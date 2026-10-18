import orchestrator from "tests/orchestrator.js";
import database from "infra/database.js";
import session from "models/session.js";
import legalAcceptance from "models/legalAcceptance.js";
const baseUrl = "http://127.0.0.1:3002";
beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDataBase();
  await orchestrator.runPendingMigrations();
});
async function pendingAccount() {
  const user = await orchestrator.createUser({ skipLegalAcceptance: true });
  const cookie = `trama_session_id=${(await session.create(user.id)).token}`;
  return { ...user, cookie };
}
function request(path, account, method = "GET", body) {
  return fetch(`${baseUrl}${path}`, {
    method,
    redirect: "manual",
    headers: {
      Cookie: account?.cookie || "",
      "Content-Type": "application/json",
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
const url = "/api/v1/legal/acceptance";
const input = { accepted: true, release_id: legalAcceptance.currentRelease.id };

test("Public documents and support remain accessible, while pending accounts cannot access protected pages or APIs", async () => {
  const account = await pendingAccount();
  for (const path of ["/terms", "/privacy", "/legal/support"]) {
    const response = await request(path);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("65.457.811/0001-61");
  }
  for (const path of [
    "/home",
    "/works",
    "/account",
    "/users",
    "/invitations",
    "/login",
    "/register",
  ]) {
    const response = await request(path, account);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("/legal/accept");
  }
  for (const [path, method, body] of [
    ["/api/v1/works", "GET"],
    ["/api/v1/works", "POST", { title: "Blocked" }],
    ["/api/v1/user", "PATCH", { name: "Blocked" }],
    ["/api/v1/users", "GET"],
  ]) {
    const response = await request(path, account, method, body);
    expect(response.status).toBe(403);
    expect((await response.json()).name).toBe("LegalAcceptanceRequiredError");
  }
  expect((await request("/legal/accept", account)).status).toBe(200);
  expect((await request("/api/v1/user", account)).status).toBe(200);
  expect((await request("/api/v1/sessions", account, "DELETE")).status).toBe(
    204,
  );
});

test("Requires explicit acceptance of the exact release, ignores no identity fields, and preserves the first acceptance timestamp", async () => {
  const account = await pendingAccount();
  expect((await request(url)).status).toBe(401);
  const before = await (await request(url, account)).json();
  expect(before).toMatchObject({ required: true, accepted_at: null });
  for (const body of [
    {},
    { ...input, accepted: false },
    { ...input, accepted: "true" },
    { ...input, release_id: "old" },
    { ...input, user_id: account.id },
  ])
    expect((await request(url, account, "POST", body)).status).toBe(400);
  const response = await request(url, account, "POST", input);
  expect(response.status).toBe(200);
  const accepted = await response.json();
  expect(accepted).toMatchObject({
    required: false,
    release_id: input.release_id,
  });
  expect(accepted.accepted_at).not.toBeNull();
  expect(
    (await (await request(url, account, "POST", input)).json()).accepted_at,
  ).toBe(accepted.accepted_at);
  expect((await request("/api/v1/works", account)).status).toBe(200);
  const stored = await database.query({
    text: "SELECT * FROM legal_acceptances WHERE user_id = $1",
    values: [account.id],
  });
  expect(stored.rowCount).toBe(1);
  expect(Object.keys(stored.rows[0]).sort()).toEqual([
    "accepted_at",
    "release_id",
    "user_id",
  ]);
  const archived = await database.query({
    text: "SELECT * FROM legal_document_releases WHERE id = $1",
    values: [input.release_id],
  });
  expect(archived.rows[0]).toMatchObject({
    terms: legalAcceptance.currentRelease.terms,
    privacy: legalAcceptance.currentRelease.privacy,
    terms_hash: legalAcceptance.currentRelease.terms_hash,
  });
});

test("An old acceptance does not unlock current access and its documents remain available", async () => {
  const account = await pendingAccount();
  await database.query({
    text: "INSERT INTO legal_document_releases (id,terms,privacy,terms_hash,privacy_hash) VALUES ('previous-v1','Previous terms','Previous privacy','old','old') ON CONFLICT DO NOTHING",
  });
  await database.query({
    text: "INSERT INTO legal_acceptances (user_id,release_id) VALUES ($1,'previous-v1')",
    values: [account.id],
  });
  expect((await request("/api/v1/works", account)).status).toBe(403);
  const archived = await request("/terms?version=previous-v1");
  expect(archived.status).toBe(200);
  expect(await archived.text()).toContain("Previous terms");
  expect((await request("/terms?version=unknown")).status).toBe(404);
});

test("Impersonation cannot fabricate acceptance for another user or bypass a pending account", async () => {
  const admin = await pendingAccount();
  await database.query({
    text: "UPDATE users SET is_admin = true WHERE id = $1",
    values: [admin.id],
  });
  const target = await pendingAccount();
  expect(
    (
      await request("/api/v1/impersonation", admin, "POST", {
        user_id: target.id,
      })
    ).status,
  ).toBe(403);
  await request(url, admin, "POST", input);
  expect(
    (
      await request("/api/v1/impersonation", admin, "POST", {
        user_id: target.id,
      })
    ).status,
  ).toBe(403);
  await request(url, target, "POST", input);
  expect(
    (
      await request("/api/v1/impersonation", admin, "POST", {
        user_id: target.id,
      })
    ).status,
  ).toBe(201);
  expect((await request(url, admin, "POST", input)).status).toBe(403);
  expect((await request("/api/v1/impersonation", admin, "DELETE")).status).toBe(
    204,
  );
});
