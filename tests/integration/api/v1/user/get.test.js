import orchestrator from "tests/orchestrator.js";
import database from "infra/database.js";
import session from "models/session.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDataBase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/user", () => {
  test.each([
    ["missing cookie", undefined],
    ["empty token", "trama_session_id="],
    ["malformed token", "trama_session_id=invalid-token"],
    ["unknown token", `trama_session_id=${"0".repeat(96)}`],
    ["SQL injection attempt", "trama_session_id=' OR 1=1 --"],
    ["oversized token", `trama_session_id=${"a".repeat(97)}`],
  ])("Rejects a %s", async (_description, cookie) => {
    const response = await fetch("http://127.0.0.1:3002/api/v1/user", {
      headers: cookie === undefined ? {} : { Cookie: cookie },
    });

    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.json()).toEqual({
      name: "UnauthorizedError",
      message: "Authentication is required to perform this action.",
      action: "Please sign in and try again.",
      status_code: 401,
    });
  });

  test("Uses the login cookie to identify the user without renewing the session", async () => {
    const createdUser = await orchestrator.createUser({});
    const loginResponse = await fetch("http://127.0.0.1:3002/api/v1/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: createdUser.email,
        password: "validpassword",
      }),
    });
    expect(loginResponse.status).toBe(201);
    const loginSession = await loginResponse.json();
    const cookie = loginResponse.headers.get("set-cookie");
    expect(cookie).not.toBeNull();

    const response = await fetch("http://127.0.0.1:3002/api/v1/user", {
      headers: { Cookie: cookie.split(";")[0] },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(await response.json()).toEqual({
      id: createdUser.id,
      name: createdUser.name,
      username: createdUser.username,
      email: createdUser.email,
      created_at: createdUser.created_at.toISOString(),
      updated_at: createdUser.updated_at.toISOString(),
    });

    const storedSession = await database.query({
      text: "SELECT expires_at FROM sessions WHERE id = $1;",
      values: [loginSession.id],
    });
    expect(storedSession.rows[0].expires_at.toISOString()).toBe(
      loginSession.expires_at,
    );
  });

  test("Rejects a session that has expired in the database", async () => {
    const createdUser = await orchestrator.createUser({});
    const expiredSession = await session.create(createdUser.id);
    await database.query({
      text: "UPDATE sessions SET expires_at = now() - interval '1 second' WHERE id = $1;",
      values: [expiredSession.id],
    });

    const response = await fetch("http://127.0.0.1:3002/api/v1/user", {
      headers: { Cookie: `trama_session_id=${expiredSession.token}` },
    });
    expect(response.status).toBe(401);
    expect((await response.json()).name).toBe("UnauthorizedError");
  });

  test("Does not accept another project's cookie name", async () => {
    const createdUser = await orchestrator.createUser({});
    const createdSession = await session.create(createdUser.id);
    const response = await fetch("http://127.0.0.1:3002/api/v1/user", {
      headers: { Cookie: `session_id=${createdSession.token}` },
    });
    expect(response.status).toBe(401);
  });

  test("Rejects unsupported methods", async () => {
    const response = await fetch("http://127.0.0.1:3002/api/v1/user", {
      method: "POST",
    });
    expect(response.status).toBe(405);
    expect((await response.json()).name).toBe("MethodNotAllowedError");
  });
});
