import orchestrator from "tests/orchestrator.js";
import database from "infra/database.js";
import session from "models/session.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDataBase();
  await orchestrator.runPendingMigrations();
});

describe("DELETE /api/v1/sessions", () => {
  test("Invalidates only the current session and prevents reuse of its cookie", async () => {
    const createdUser = await orchestrator.createUser({});
    const loginResponse = await fetch("http://localhost:3001/api/v1/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: createdUser.email,
        password: "validpassword",
      }),
    });
    expect(loginResponse.status).toBe(201);
    const currentSession = await loginResponse.json();
    const cookie = loginResponse.headers.get("set-cookie").split(";")[0];
    const otherSession = await session.create(createdUser.id);

    const response = await fetch("http://localhost:3001/api/v1/sessions", {
      method: "DELETE",
      headers: { Cookie: cookie },
    });
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("set-cookie").split("; ")).toEqual(
      expect.arrayContaining([
        "trama_session_id=",
        "Max-Age=0",
        "Path=/",
        "HttpOnly",
        "SameSite=Lax",
      ]),
    );

    const storedSession = await database.query({
      text: "SELECT expires_at <= now() AS expired FROM sessions WHERE id = $1;",
      values: [currentSession.id],
    });
    expect(storedSession.rows).toEqual([{ expired: true }]);

    const replay = await fetch("http://localhost:3001/api/v1/user", {
      headers: { Cookie: cookie },
    });
    expect(replay.status).toBe(401);

    const otherResponse = await fetch("http://localhost:3001/api/v1/user", {
      headers: { Cookie: `trama_session_id=${otherSession.token}` },
    });
    expect(otherResponse.status).toBe(200);
    expect((await otherResponse.json()).id).toBe(createdUser.id);

    const repeatedLogout = await fetch(
      "http://localhost:3001/api/v1/sessions",
      {
        method: "DELETE",
        headers: { Cookie: cookie },
      },
    );
    expect(repeatedLogout.status).toBe(204);
  });

  test.each([
    ["missing cookie", undefined],
    ["malformed token", "trama_session_id=invalid"],
    ["unknown token", `trama_session_id=${"0".repeat(96)}`],
  ])("Clears a %s without failing", async (_description, cookie) => {
    const response = await fetch("http://localhost:3001/api/v1/sessions", {
      method: "DELETE",
      headers: cookie === undefined ? {} : { Cookie: cookie },
    });
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  test("Clears an expired session cookie without extending its expiration", async () => {
    const createdUser = await orchestrator.createUser({});
    const expiredSession = await session.create(createdUser.id);
    const expiration = await database.query({
      text: "UPDATE sessions SET expires_at = now() - interval '1 day' WHERE id = $1 RETURNING expires_at;",
      values: [expiredSession.id],
    });
    const response = await fetch("http://localhost:3001/api/v1/sessions", {
      method: "DELETE",
      headers: { Cookie: `trama_session_id=${expiredSession.token}` },
    });
    expect(response.status).toBe(204);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");

    const storedSession = await database.query({
      text: "SELECT expires_at FROM sessions WHERE id = $1;",
      values: [expiredSession.id],
    });
    expect(storedSession.rows[0].expires_at).toEqual(
      expiration.rows[0].expires_at,
    );
  });

  test("Does not invalidate a session supplied in another project's cookie", async () => {
    const createdUser = await orchestrator.createUser({});
    const createdSession = await session.create(createdUser.id);
    const response = await fetch("http://localhost:3001/api/v1/sessions", {
      method: "DELETE",
      headers: { Cookie: `session_id=${createdSession.token}` },
    });
    expect(response.status).toBe(204);
    const storedSession = await session.findOneValidByToken(
      createdSession.token,
    );
    expect(storedSession.id).toBe(createdSession.id);
  });
});
