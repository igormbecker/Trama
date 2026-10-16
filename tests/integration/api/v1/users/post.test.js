import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";
import user from "models/user.js";
import database from "infra/database.js";
import password from "models/password.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDataBase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/users", () => {
  describe("Anonymous user", () => {
    test("With unique and valid data", async () => {
      const response = await fetch("http://127.0.0.1:3002/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Igor Becker",
          username: "igormbecker",
          email: "igormbecker@gmail.com",
          password: "password123",
        }),
      });

      expect(response.status).toBe(201);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        name: "Igor Becker",
        username: "igormbecker",
        email: "igormbecker@gmail.com",
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const userInDatabase = await user.findOneByUsername("igormbecker");
      const correctPasswordMatch = await password.compare(
        "password123",
        userInDatabase.password,
      );
      const incorrectPasswordMatch = await password.compare(
        "wrongPassword",
        userInDatabase.password,
      );

      expect(correctPasswordMatch).toBe(true);
      expect(incorrectPasswordMatch).toBe(false);
    });

    test.each([
      null,
      {},
      {
        name: " ",
        username: "reader",
        email: "reader@trama.test",
        password: "password123",
      },
      {
        name: "Reader",
        username: "invalid user",
        email: "reader@trama.test",
        password: "password123",
      },
      {
        name: "Reader",
        username: "reader",
        email: "invalid",
        password: "password123",
      },
      {
        name: "Reader",
        username: "reader",
        email: "reader@trama.test",
        password: "short",
      },
      {
        name: "Reader",
        username: 123,
        email: "reader@trama.test",
        password: "password123",
      },
    ])(
      "Rejects invalid registration data without inserting a user: %#",
      async (input) => {
        const before = await database.query(
          "SELECT count(*)::int AS count FROM users;",
        );
        const response = await fetch("http://127.0.0.1:3002/api/v1/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        expect(response.status).toBe(400);
        expect((await response.json()).name).toBe("ValidationError");
        const after = await database.query(
          "SELECT count(*)::int AS count FROM users;",
        );
        expect(after.rows[0].count).toBe(before.rows[0].count);
      },
    );

    test("Normalizes profile fields and allows the new account to sign in", async () => {
      const response = await fetch("http://127.0.0.1:3002/api/v1/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: " Reader ",
          username: " new.reader ",
          email: " new-reader@trama.test ",
          password: "example-password",
        }),
      });
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.name).toBe("Reader");
      expect(body.username).toBe("new.reader");
      expect(body.email).toBe("new-reader@trama.test");
      expect(body).not.toHaveProperty("password");
      const login = await fetch("http://127.0.0.1:3002/api/v1/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: body.email,
          password: "example-password",
        }),
      });
      expect(login.status).toBe(201);
      expect(login.headers.get("set-cookie")).toContain("trama_session_id=");
    });
    test("With duplicated 'email'", async () => {
      const response1 = await fetch("http://127.0.0.1:3002/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Igor Becker",
          username: "emailduplicated1",
          email: "duplicated@bectec.com.br",
          password: "password123",
        }),
      });
      expect(response1.status).toBe(201);

      const response2 = await fetch("http://127.0.0.1:3002/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Igor Becker",
          username: "emailduplicated2",
          email: "Duplicated@bectec.com.br",
          password: "password123",
        }),
      });
      expect(response2.status).toBe(400);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        name: "ValidationError",
        message: "The informed e-mail is already in use.",
        action: "Use another email.",
        status_code: 400,
      });
    });

    test("With duplicated 'username'", async () => {
      const response1 = await fetch("http://127.0.0.1:3002/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Igor Becker",
          username: "usernameduplicated",
          email: "username1@bectec.com.br",
          password: "password123",
        }),
      });
      expect(response1.status).toBe(201);

      const response2 = await fetch("http://127.0.0.1:3002/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Igor Becker",
          username: "UsernameDuplicated",
          email: "username2@bectec.com.br",
          password: "password123",
        }),
      });
      expect(response2.status).toBe(400);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        name: "ValidationError",
        message: "The informed username is already in use.",
        action: "Use another username.",
        status_code: 400,
      });
    });
  });
});
