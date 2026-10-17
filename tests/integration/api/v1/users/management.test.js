import orchestrator from "tests/orchestrator.js";
import database from "infra/database.js";
import session from "models/session.js";
import user from "models/user.js";

const baseUrl = "http://127.0.0.1:3002";
let admin;
let adminCookie;
let readerCookie;

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDataBase();
  await orchestrator.runPendingMigrations();
  admin = await orchestrator.createUser({ username: "administrator" });
  await database.query({
    text: "UPDATE users SET is_admin = true WHERE id = $1",
    values: [admin.id],
  });
  adminCookie = `trama_session_id=${(await session.create(admin.id)).token}`;
  const reader = await orchestrator.createUser({ username: "reader" });
  readerCookie = `trama_session_id=${(await session.create(reader.id)).token}`;
});

function request(path, method = "GET", cookie, body) {
  return fetch(`${baseUrl}${path}`, {
    method,
    redirect: "manual",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

test.each(["GET", "PATCH", "DELETE"])(
  "Rejects anonymous %s on individual users",
  async (method) => {
    expect((await request("/api/v1/users/reader", method)).status).toBe(401);
  },
);

test.each(["GET", "PATCH", "DELETE"])(
  "Rejects ordinary users for %s",
  async (method) => {
    expect(
      (await request("/api/v1/users/reader", method, readerCookie)).status,
    ).toBe(403);
  },
);

test("Protects the user list and administrative page", async () => {
  expect((await request("/api/v1/users")).status).toBe(401);
  expect((await request("/api/v1/users", "GET", readerCookie)).status).toBe(
    403,
  );
  expect((await request("/users")).headers.get("location")).toBe("/login");
  expect(
    (await request("/users", "GET", readerCookie)).headers.get("location"),
  ).toBe("/works");
  const response = await request("/users", "GET", adminCookie);
  expect(response.status).toBe(200);
  const html = await response.text();
  expect(html).toContain("Adicionar usuário");
  expect(html).toContain('href="/users"');
  expect(html).not.toContain(admin.password);
  const works = await request("/works", "GET", readerCookie);
  expect(await works.text()).not.toContain('href="/users"');
});

test("Lists users without exposing password hashes", async () => {
  const response = await request("/api/v1/users", "GET", adminCookie);
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toContain("no-store");
  const body = await response.json();
  expect(
    body.some((entry) => entry.username === "administrator" && entry.is_admin),
  ).toBe(true);
  body.forEach((entry) => expect(entry).not.toHaveProperty("password"));
});

test.each([
  [undefined, 401],
  ["invalid", 401],
  ["reader", 403],
])(
  "Rejects registration without administrator access: %s",
  async (cookie, status) => {
    const before = await database.query(
      "SELECT count(*)::int AS count FROM users",
    );
    const response = await request(
      "/api/v1/users",
      "POST",
      cookie === "reader" ? readerCookie : cookie,
      {
        name: "Blocked account",
        username: "blocked",
        email: "blocked@trama.test",
        password: "example-password",
      },
    );
    expect(response.status).toBe(status);
    expect(response.headers.get("cache-control")).toContain("no-store");
    const after = await database.query(
      "SELECT count(*)::int AS count FROM users",
    );
    expect(after.rows[0].count).toBe(before.rows[0].count);
  },
);

test("Administrators create ordinary accounts without granting privileges", async () => {
  const response = await request("/api/v1/users", "POST", adminCookie, {
    name: "Ordinary account",
    username: "notadmin",
    email: "notadmin@trama.test",
    password: "example-password",
    is_admin: true,
  });
  expect(response.status).toBe(201);
  expect((await user.findOneByUsername("notadmin")).is_admin).toBe(false);
});

test("Edits an unchanged username and email without duplicate errors", async () => {
  const response = await request("/api/v1/users/reader", "PATCH", adminCookie, {
    name: "Updated Reader",
    username: "reader",
    email: (await user.findOneByUsername("reader")).email,
  });
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.name).toBe("Updated Reader");
  expect(body).not.toHaveProperty("password");
});

test.each([
  { name: " " },
  { email: "invalid" },
  { password: "short" },
  { password: null },
  { is_admin: "admin" },
  { id: "other" },
  null,
])("Rejects invalid or protected update fields: %#", async (input) => {
  const response = await request(
    "/api/v1/users/reader",
    "PATCH",
    adminCookie,
    input,
  );
  expect(response.status).toBe(400);
});

test("Does not let administrators delete their own account", async () => {
  expect(
    (await request("/api/v1/users/administrator", "DELETE", adminCookie))
      .status,
  ).toBe(400);
  expect((await user.findOneByUsername("administrator")).id).toBe(admin.id);
});

test("Deletes a user and their sessions without affecting the administrator", async () => {
  const target = await orchestrator.createUser({ username: "remove-me" });
  const targetSession = await session.create(target.id);
  const response = await request(
    "/api/v1/users/remove-me",
    "DELETE",
    adminCookie,
  );
  expect(response.status).toBe(204);
  expect(await response.text()).toBe("");
  const remaining = await database.query({
    text: "SELECT id FROM sessions WHERE user_id = $1",
    values: [target.id],
  });
  expect(remaining.rowCount).toBe(0);
  const formerSession = await request(
    "/api/v1/user",
    "GET",
    `trama_session_id=${targetSession.token}`,
  );
  expect(formerSession.status).toBe(401);
  expect((await request("/api/v1/users", "GET", adminCookie)).status).toBe(200);
  expect(
    (await request("/api/v1/users/remove-me", "DELETE", adminCookie)).status,
  ).toBe(404);
});

test("Expired or demoted administrators immediately lose access", async () => {
  const temporary = await orchestrator.createUser({
    username: "temporary-admin",
  });
  await database.query({
    text: "UPDATE users SET is_admin = true WHERE id = $1",
    values: [temporary.id],
  });
  const temporarySession = await session.create(temporary.id);
  const cookie = `trama_session_id=${temporarySession.token}`;
  expect((await request("/api/v1/users", "GET", cookie)).status).toBe(200);
  await database.query({
    text: "UPDATE users SET is_admin = false WHERE id = $1",
    values: [temporary.id],
  });
  expect((await request("/api/v1/users", "GET", cookie)).status).toBe(403);
  await database.query({
    text: "UPDATE sessions SET expires_at = now() - interval '1 second' WHERE id = $1",
    values: [temporarySession.id],
  });
  expect((await request("/api/v1/users", "GET", cookie)).status).toBe(401);
});
