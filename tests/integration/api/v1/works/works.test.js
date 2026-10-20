import orchestrator from "tests/orchestrator.js";
import session from "models/session.js";
import database from "infra/database.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDataBase();
  await orchestrator.runPendingMigrations();
});

const baseUrl = "http://127.0.0.1:3002";

test("Updates work details only for its owner and preserves ownership", async () => {
  const owner = await createAccount();
  const other = await createAccount();
  const created = await (await createWork(owner.cookie)).json();
  const patch = (cookie, input) =>
    fetch(`${baseUrl}/api/v1/works/${created.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: JSON.stringify(input),
    });
  expect((await patch(null, { title: "Denied" })).status).toBe(401);
  expect((await patch(other.cookie, { title: "Denied" })).status).toBe(404);
  await database.query({
    text: "UPDATE users SET is_admin = true WHERE id = $1",
    values: [other.user.id],
  });
  expect((await patch(other.cookie, { title: "Denied" })).status).toBe(404);
  expect(
    (await patch(owner.cookie, { title: "New", owner_id: other.user.id }))
      .status,
  ).toBe(400);
  expect((await patch(owner.cookie, { title: " " })).status).toBe(400);
  const response = await patch(owner.cookie, {
    title: " Updated work ",
    description: " New description ",
  });
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  const updated = await response.json();
  expect(updated).toMatchObject({
    id: created.id,
    owner_id: owner.user.id,
    title: "Updated work",
    description: "New description",
    created_at: created.created_at,
  });
  const detail = await fetch(`${baseUrl}/api/v1/works/${created.id}`, {
    headers: { Cookie: owner.cookie },
  });
  expect(await detail.json()).toEqual(updated);
});

async function createAccount() {
  const user = await orchestrator.createUser({});
  const cookie = `trama_session_id=${(await session.create(user.id)).token}`;
  return { user, cookie };
}

function createWork(cookie, input = { title: "Minha obra" }) {
  return fetch(`${baseUrl}/api/v1/works`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(input),
  });
}

test("Creates a private work for the authenticated account and persists it", async () => {
  const { user, cookie } = await createAccount();
  const response = await createWork(cookie, {
    title: " Minha obra ",
    description: " Descrição ",
  });
  expect(response.status).toBe(201);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  const body = await response.json();
  expect(body).toEqual({
    id: expect.any(String),
    title: "Minha obra",
    description: "Descrição",
    type: "literary",
    deleted_at: null,
    owner_id: user.id,
    created_at: expect.any(String),
    updated_at: expect.any(String),
  });
  const stored = await database.query({
    text: "SELECT * FROM works WHERE id = $1",
    values: [body.id],
  });
  expect(stored.rows[0].owner_id).toBe(user.id);
});

test.each([
  null,
  [],
  {},
  { title: " " },
  { title: 123 },
  { title: "x".repeat(256) },
  { title: "Book", description: null },
  { title: "Book", description: "x".repeat(5001) },
  { title: "Book", owner_id: "another-account" },
])("Rejects invalid work data without inserting: %#", async (input) => {
  const { cookie } = await createAccount();
  const before = await database.query(
    "SELECT count(*)::int AS count FROM works",
  );
  const response = await createWork(cookie, input);
  expect(response.status).toBe(400);
  expect((await response.json()).name).toBe("ValidationError");
  const after = await database.query(
    "SELECT count(*)::int AS count FROM works",
  );
  expect(after.rows[0].count).toBe(before.rows[0].count);
});

test("Allows maximum lengths, repeated titles and an omitted description", async () => {
  const { cookie } = await createAccount();
  const input = { title: "x".repeat(255), description: "x".repeat(5000) };
  expect((await createWork(cookie, input)).status).toBe(201);
  const response = await createWork(cookie, { title: input.title });
  expect(response.status).toBe(201);
  expect((await response.json()).description).toBe("");
});

test("Lists only owned works and allows their details", async () => {
  const owner = await createAccount();
  const other = await createAccount();
  const created = await (await createWork(owner.cookie)).json();
  await createWork(other.cookie, { title: "Other private work" });
  const response = await fetch(`${baseUrl}/api/v1/works`, {
    headers: { Cookie: owner.cookie },
  });
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(await response.json()).toEqual([created]);
  const detail = await fetch(`${baseUrl}/api/v1/works/${created.id}`, {
    headers: { Cookie: owner.cookie },
  });
  expect(detail.status).toBe(200);
  expect(await detail.json()).toEqual(created);
  const empty = await createAccount();
  const emptyList = await fetch(`${baseUrl}/api/v1/works`, {
    headers: { Cookie: empty.cookie },
  });
  expect(await emptyList.json()).toEqual([]);
});

test("Hides private works from other accounts, including administrators, in API and pages", async () => {
  const owner = await createAccount();
  const created = await (await createWork(owner.cookie)).json();
  for (const cookie of [
    (await createAccount()).cookie,
    await orchestrator.createAdministratorCookie(),
  ]) {
    const list = await fetch(`${baseUrl}/api/v1/works`, {
      headers: { Cookie: cookie },
    });
    expect(await list.json()).toEqual([]);
    for (const path of [
      `/api/v1/works/${created.id}`,
      `/works/${created.id}`,
    ]) {
      const response = await fetch(`${baseUrl}${path}`, {
        headers: { Cookie: cookie },
      });
      expect(response.status).toBe(404);
      expect(await response.text()).not.toContain(created.title);
    }
  }
  for (const id of ["invalid", "00000000-0000-4000-8000-000000000000"]) {
    const response = await fetch(`${baseUrl}/api/v1/works/${id}`, {
      headers: { Cookie: owner.cookie },
    });
    expect(response.status).toBe(404);
  }
});

test("Requires a valid session for every work endpoint", async () => {
  const owner = await createAccount();
  const created = await (await createWork(owner.cookie)).json();
  const expired = await session.create(owner.user.id);
  await database.query({
    text: "UPDATE sessions SET expires_at = now() - interval '1 second' WHERE id = $1",
    values: [expired.id],
  });
  for (const cookie of [
    "",
    "trama_session_id=invalid",
    `trama_session_id=${"0".repeat(96)}`,
    `trama_session_id=${expired.token}`,
  ]) {
    for (const path of ["/api/v1/works", `/api/v1/works/${created.id}`]) {
      const response = await fetch(`${baseUrl}${path}`, {
        headers: { Cookie: cookie },
      });
      expect(response.status).toBe(401);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
    }
    expect((await createWork(cookie)).status).toBe(401);
  }
});

test("Prevents deleting an owner and preserves their session and works", async () => {
  const owner = await createAccount();
  const created = await (await createWork(owner.cookie)).json();
  const response = await fetch(
    `${baseUrl}/api/v1/users/${owner.user.username}`,
    {
      method: "DELETE",
      headers: { Cookie: await orchestrator.createAdministratorCookie() },
    },
  );
  expect(response.status).toBe(400);
  expect((await response.json()).message).toBe(
    "Transfer responsibility for your works before deleting this account.",
  );
  const detail = await fetch(`${baseUrl}/api/v1/works/${created.id}`, {
    headers: { Cookie: owner.cookie },
  });
  expect(detail.status).toBe(200);
});

test("Renders the list, creation form and owned detail and redirects anonymous detail visitors", async () => {
  const owner = await createAccount();
  const created = await (
    await createWork(owner.cookie, {
      title: "Obra editorial",
      description: "Descrição privada",
    })
  ).json();
  const list = await fetch(`${baseUrl}/works`, {
    headers: { Cookie: owner.cookie },
  });
  const listHtml = await list.text();
  expect(listHtml).toContain("Obra editorial");
  expect(listHtml).toContain(`href="/works/${created.id}"`);
  expect(listHtml).toContain('for="title"');
  expect(listHtml).toContain('for="description"');
  const detail = await fetch(`${baseUrl}/works/${created.id}`, {
    headers: { Cookie: owner.cookie },
  });
  expect(detail.status).toBe(200);
  expect(await detail.text()).toContain("Descrição privada");
  const anonymous = await fetch(`${baseUrl}/works/${created.id}`, {
    redirect: "manual",
  });
  expect(anonymous.status).toBe(307);
  expect(anonymous.headers.get("location")).toBe("/login");
});
