import orchestrator from "tests/orchestrator.js";
import database from "infra/database.js";
import session from "models/session.js";

const baseUrl = "http://127.0.0.1:3002";
beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDataBase();
  await orchestrator.runPendingMigrations();
});
async function account(admin = false) {
  const user = await orchestrator.createUser({});
  if (admin)
    await database.query({
      text: "UPDATE users SET is_admin = true WHERE id = $1",
      values: [user.id],
    });
  const storedSession = await session.create(user.id);
  return {
    ...user,
    sessionId: storedSession.id,
    cookie: `trama_session_id=${storedSession.token}`,
  };
}
function request(path, actor, method = "GET", body, headers = {}) {
  return fetch(`${baseUrl}${path}`, {
    method,
    redirect: "manual",
    headers: {
      Cookie: actor?.cookie || "",
      "Content-Type": "application/json",
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
const path = "/api/v1/impersonation";

test("Only a real administrator can start, without representing administrators, self or nested users", async () => {
  const admin = await account(true);
  const otherAdmin = await account(true);
  const target = await account();
  expect(
    (await request(path, null, "POST", { user_id: target.id })).status,
  ).toBe(401);
  expect(
    (await request(path, target, "POST", { user_id: admin.id })).status,
  ).toBe(403);
  for (const id of [
    admin.id,
    otherAdmin.id,
    "00000000-0000-4000-8000-000000000000",
  ]) {
    expect((await request(path, admin, "POST", { user_id: id })).status).toBe(
      403,
    );
  }
  expect((await request(path, admin, "POST", {})).status).toBe(400);
  expect(
    (
      await request(
        path,
        admin,
        "POST",
        { user_id: target.id },
        { Origin: "https://other.example" },
      )
    ).status,
  ).toBe(403);
  const started = await request(path, admin, "POST", { user_id: target.id });
  expect(started.status).toBe(201);
  expect(started.headers.get("cache-control")).toBe("private, no-store");
  expect(started.headers.get("set-cookie")).toBeNull();
  expect(
    (await request(path, admin, "POST", { user_id: target.id })).status,
  ).toBe(403);
  expect((await request("/api/v1/users", admin)).status).toBe(403);
  expect((await request("/api/v1/migrations", admin, "POST")).status).toBe(403);
  expect(
    (
      await request("/api/v1/user", admin, "PATCH", {
        name: "Changed",
        password: "newpassword",
        password_confirmation: "newpassword",
      })
    ).status,
  ).toBe(403);
  expect((await (await request("/api/v1/user", admin)).json()).id).toBe(
    target.id,
  );
  const visible = await (await request(path, admin)).json();
  expect(visible).toMatchObject({
    active: true,
    name: target.name,
    expired: false,
  });
  expect(new Date(visible.expires_at) - Date.now()).toBeLessThanOrEqual(
    15 * 60000,
  );
  expect((await request(path, admin, "DELETE")).status).toBe(204);
  expect((await (await request("/api/v1/user", admin)).json()).id).toBe(
    admin.id,
  );
});

test("Writes as the represented user, preserves attribution and unrelated sessions, and stops on logout", async () => {
  const admin = await account(true);
  const target = await account();
  await request(path, admin, "POST", { user_id: target.id });
  const created = await request("/api/v1/works", admin, "POST", {
    title: "Support work",
  });
  expect(created.status).toBe(201);
  const work = await created.json();
  expect(work.owner_id).toBe(target.id);
  expect((await request(`/api/v1/works/${work.id}`, target)).status).toBe(200);
  const audit = await database.query({
    text: "SELECT * FROM impersonation_audit WHERE session_id = $1 ORDER BY id",
    values: [admin.sessionId],
  });
  expect(audit.rows).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        event: "started",
        administrator_id: admin.id,
        represented_user_id: target.id,
      }),
      expect.objectContaining({
        event: "request_started",
        method: "POST",
        path: "/api/v1/works",
        administrator_id: admin.id,
        represented_user_id: target.id,
      }),
    ]),
  );
  expect(JSON.stringify(audit.rows)).not.toContain("Support work");
  expect((await request("/api/v1/sessions", admin, "DELETE")).status).toBe(204);
  expect((await request(path, admin, "DELETE")).status).toBe(401);
  expect((await request("/api/v1/user", target)).status).toBe(200);
});

test("Expiration, deletion and revocation never silently grant the administrator's permissions", async () => {
  const admin = await account(true);
  const target = await account();
  await request(path, admin, "POST", { user_id: target.id });
  await database.query({
    text: "UPDATE sessions SET impersonation_expires_at = now() - interval '1 second' WHERE id = $1",
    values: [admin.sessionId],
  });
  expect((await request("/api/v1/user", admin)).status).toBe(401);
  expect((await (await request(path, admin)).json()).expired).toBe(true);
  expect((await request(path, admin, "DELETE")).status).toBe(204);
  await request(path, admin, "POST", { user_id: target.id });
  await database.query({
    text: "DELETE FROM sessions WHERE user_id = $1",
    values: [target.id],
  });
  await database.query({
    text: "DELETE FROM users WHERE id = $1",
    values: [target.id],
  });
  expect((await request("/api/v1/user", admin)).status).toBe(401);
  expect((await request(path, admin, "DELETE")).status).toBe(204);
  const another = await account();
  await request(path, admin, "POST", { user_id: another.id });
  await database.query({
    text: "UPDATE users SET is_admin = false WHERE id = $1",
    values: [admin.id],
  });
  expect((await request("/api/v1/user", admin)).status).toBe(401);
  expect((await request(path, admin, "DELETE")).status).toBe(403);
});

test("Only owners export: organizers keep reading access; represented owners can export", async () => {
  const owner = await account();
  const organizer = await account();
  const admin = await account(true);
  const work = await (
    await request("/api/v1/works", owner, "POST", {
      title: "Restricted exports",
    })
  ).json();
  await database.query({
    text: "INSERT INTO work_participants (work_id, user_id, role) VALUES ($1, $2, 'organizer')",
    values: [work.id, organizer.id],
  });
  expect((await request(`/works/${work.id}/read`, organizer)).status).toBe(200);
  for (const format of ["pdf", "docx"]) {
    const url = `/api/v1/works/${work.id}/export?format=${format}`;
    expect((await request(url, owner)).status).toBe(200);
    expect((await request(url, organizer)).status).toBe(404);
    expect((await request(url, admin)).status).toBe(404);
    expect((await request(url, null)).status).toBe(401);
  }
  await request(path, admin, "POST", { user_id: owner.id });
  expect(
    (await request(`/api/v1/works/${work.id}/export?format=pdf`, admin)).status,
  ).toBe(200);
  await request(path, admin, "DELETE");
  expect(
    (await request(`/api/v1/works/${work.id}/export?format=pdf`, admin)).status,
  ).toBe(404);
});

test("Concurrent starts allow only one represented identity per session", async () => {
  const admin = await account(true);
  const first = await account();
  const second = await account();
  const responses = await Promise.all([
    request(path, admin, "POST", { user_id: first.id }),
    request(path, admin, "POST", { user_id: second.id }),
  ]);
  expect(responses.map((response) => response.status).sort()).toEqual([
    201, 403,
  ]);
  const audit = await database.query({
    text: "SELECT * FROM impersonation_audit WHERE session_id = $1 AND event = 'started'",
    values: [admin.sessionId],
  });
  expect(audit.rowCount).toBe(1);
  expect((await request(path, admin, "DELETE")).status).toBe(204);
});
