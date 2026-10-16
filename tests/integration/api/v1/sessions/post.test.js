import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";
import database from "infra/database.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDataBase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/sessions", () => {
  describe("Anonymous user", () => {
    test("With incorrect `email` but correct `password`", async () => {
      await orchestrator.createUser({
        password: "senha-correta",
      });

      const response = await fetch("http://127.0.0.1:3002/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "emailerrado@bectec.com.br",
          password: "senha-correta",
        }),
      });
      expect(response.status).toBe(401);
      expect(response.headers.get("set-cookie")).toBeNull();

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Invalid email or password.",
        action: "Check your credentials and try again.",
        status_code: 401,
      });

      const sessions = await database.query("SELECT * FROM sessions;");
      expect(sessions.rowCount).toBe(0);
    });

    test("With correct `email` but incorrect `password`", async () => {
      await orchestrator.createUser({
        email: "email.correto@bectec.com.br",
      });

      const response = await fetch("http://127.0.0.1:3002/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "email.correto@bectec.com.br",
          password: "senha-incorreta",
        }),
      });
      expect(response.status).toBe(401);
      expect(response.headers.get("set-cookie")).toBeNull();

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Invalid email or password.",
        action: "Check your credentials and try again.",
        status_code: 401,
      });

      const sessions = await database.query("SELECT * FROM sessions;");
      expect(sessions.rowCount).toBe(0);
    });

    test("With incorrect `email` and incorrect `password`", async () => {
      await orchestrator.createUser({});

      const response = await fetch("http://127.0.0.1:3002/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "email.incorreto@bectec.com.br",
          password: "senha-incorreta",
        }),
      });
      expect(response.status).toBe(401);
      expect(response.headers.get("set-cookie")).toBeNull();

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Invalid email or password.",
        action: "Check your credentials and try again.",
        status_code: 401,
      });

      const sessions = await database.query("SELECT * FROM sessions;");
      expect(sessions.rowCount).toBe(0);
    });

    test("With correct `email` and correct `password`", async () => {
      const createdUser = await orchestrator.createUser({
        email: "email.correto2@bectec.com.br",
        password: "senha-correta",
      });

      const beforeRequest = Date.now();
      const response = await fetch("http://127.0.0.1:3002/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "email.correto2@bectec.com.br",
          password: "senha-correta",
        }),
      });
      expect(response.status).toBe(201);

      const responseBody = await response.json();

      const afterRequest = Date.now();
      expect(responseBody).toEqual({
        id: expect.any(String),
        token: expect.any(String),
        expires_at: expect.any(String),
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });

      expect(responseBody).not.toHaveProperty("password");
      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(responseBody.token).toMatch(/^[a-f0-9]{96}$/);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      const cookie = response.headers.get("set-cookie");
      expect(cookie).not.toBeNull();
      const attributes = cookie.split("; ");
      expect(attributes).toEqual(
        expect.arrayContaining([
          `trama_session_id=${responseBody.token}`,
          "Path=/",
          "HttpOnly",
          "SameSite=Lax",
        ]),
      );
      const maxAge = Number(
        attributes
          .find((attribute) => attribute.startsWith("Max-Age="))
          .split("=")[1],
      );
      expect(maxAge).toBeGreaterThan(86390);
      expect(maxAge).toBeLessThanOrEqual(86400);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const sessionDurationInMilliseconds = 24 * 60 * 60 * 1000;
      expect(Date.parse(responseBody.expires_at)).toBeGreaterThanOrEqual(
        beforeRequest + sessionDurationInMilliseconds,
      );
      expect(Date.parse(responseBody.expires_at)).toBeLessThanOrEqual(
        afterRequest + sessionDurationInMilliseconds,
      );

      const storedSessions = await database.query({
        text: "SELECT * FROM sessions WHERE id = $1;",
        values: [responseBody.id],
      });

      expect(storedSessions.rowCount).toBe(1);
      const storedSession = storedSessions.rows[0];
      expect(storedSession).toEqual({
        id: responseBody.id,
        token: responseBody.token,
        user_id: createdUser.id,
        expires_at: new Date(responseBody.expires_at),
        created_at: new Date(responseBody.created_at),
        updated_at: new Date(responseBody.updated_at),
      });
    });

    test("Creates distinct sessions for repeated logins by the same user", async () => {
      const createdUser = await orchestrator.createUser({
        email: "multiple.sessions@trama.test",
        password: "validpassword",
      });

      const responses = [];
      for (let attempt = 0; attempt < 2; attempt++) {
        const response = await fetch("http://127.0.0.1:3002/api/v1/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: createdUser.email,
            password: "validpassword",
          }),
        });
        expect(response.status).toBe(201);
        responses.push(await response.json());
      }

      expect(responses[0].token).toMatch(/^[a-f0-9]{96}$/);
      expect(responses[1].token).toMatch(/^[a-f0-9]{96}$/);
      expect(responses[0].token).not.toBe(responses[1].token);
      expect(responses[0].id).not.toBe(responses[1].id);

      const storedSessions = await database.query({
        text: "SELECT id, token FROM sessions WHERE user_id = $1 ORDER BY created_at;",
        values: [createdUser.id],
      });
      expect(storedSessions.rows).toEqual(
        responses.map(({ id, token }) => ({ id, token })),
      );
    });
  });
});

test("Session creation and update timestamps default to the project's UTC expression", async () => {
  const result = await database.query(`
    SELECT column_name, column_default FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sessions'
      AND column_name IN ('created_at', 'updated_at') ORDER BY column_name
  `);
  expect(result.rows).toHaveLength(2);
  for (const column of result.rows) {
    expect(column.column_default).toContain("timezone('utc'::text, now())");
  }
});
