import user from "models/user.js";
import password from "models/password.js";
import orchestrator from "tests/orchestrator.js";

let administratorCookie;
beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDataBase();
  await orchestrator.runPendingMigrations();
  administratorCookie = await orchestrator.createAdministratorCookie();
});

describe("PATCH /api/v1/users/[username]", () => {
  describe("Administrator", () => {
    test("With nonexistent 'username'", async () => {
      const response = await fetch(
        "http://127.0.0.1:3002/api/v1/users/UsuarioInexistente",
        {
          method: "PATCH",
          headers: { Cookie: administratorCookie },
        },
      );
      expect(response.status).toBe(404);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "Username not found.",
        action:
          "Please check that the username was entered correctly and try again.",
        status_code: 404,
      });
    });

    test("With duplicated 'username'", async () => {
      await orchestrator.createUser({
        username: "user1",
      });

      await orchestrator.createUser({
        username: "user2",
      });

      const response = await fetch("http://127.0.0.1:3002/api/v1/users/user2", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: administratorCookie,
        },
        body: JSON.stringify({
          username: "user1",
        }),
      });
      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "The informed username is already in use.",
        action: "Use another username.",
        status_code: 400,
      });
    });

    test("With duplicated 'email'", async () => {
      await orchestrator.createUser({
        email: "email1@bectec.com.br",
      });

      const createdUser2 = await orchestrator.createUser({
        email: "email2@bectec.com.br",
      });

      const response = await fetch(
        `http://127.0.0.1:3002/api/v1/users/${createdUser2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: administratorCookie,
          },
          body: JSON.stringify({
            email: "email1@bectec.com.br",
          }),
        },
      );
      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "The informed e-mail is already in use.",
        action: "Use another email.",
        status_code: 400,
      });
    });

    test("With unique 'username'", async () => {
      const createUser = await orchestrator.createUser({});

      const response = await fetch(
        `http://127.0.0.1:3002/api/v1/users/${createUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: administratorCookie,
          },
          body: JSON.stringify({
            username: "uniqueuser2",
          }),
        },
      );
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        name: responseBody.name,
        username: "uniqueuser2",
        email: responseBody.email,
        is_admin: false,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("With unique 'email'", async () => {
      const createdUser = await orchestrator.createUser({});

      const response = await fetch(
        `http://127.0.0.1:3002/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: administratorCookie,
          },
          body: JSON.stringify({
            email: "uniqueemail2@bectec.com.br",
          }),
        },
      );
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        name: responseBody.name,
        username: responseBody.username,
        email: "uniqueemail2@bectec.com.br",
        is_admin: false,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("With new 'password'", async () => {
      const createdUser = await orchestrator.createUser({});

      const response = await fetch(
        `http://127.0.0.1:3002/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: administratorCookie,
          },
          body: JSON.stringify({
            password: "newpassword123",
            password_confirmation: "newpassword123",
          }),
        },
      );
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        name: responseBody.name,
        username: responseBody.username,
        email: responseBody.email,
        is_admin: false,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);

      const userInDatabase = await user.findOneByUsername(
        responseBody.username,
      );
      const correctPasswordMatch = await password.compare(
        "newpassword123",
        userInDatabase.password,
      );
      const incorrectPasswordMatch = await password.compare(
        "password123",
        userInDatabase.password,
      );

      expect(correctPasswordMatch).toBe(true);
      expect(incorrectPasswordMatch).toBe(false);
    });
  });
});

test.each([
  { password: "new-password" },
  { password: "new-password", password_confirmation: "different-password" },
  { password: "", password_confirmation: "confirmation-only" },
])(
  "Rejects mismatched administrative password changes on the server: %#",
  async (input) => {
    const target = await orchestrator.createUser({});
    const response = await fetch(
      `http://127.0.0.1:3002/api/v1/users/${target.username}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: administratorCookie,
        },
        body: JSON.stringify(input),
      },
    );
    expect(response.status).toBe(400);
    expect((await response.json()).message).toBe(
      "Password confirmation does not match.",
    );
    expect(
      await password.compare(
        "validpassword",
        (await user.findOneByUsername(target.username)).password,
      ),
    ).toBe(true);
  },
);
test("Preserves the password when both administrative fields are blank", async () => {
  const target = await orchestrator.createUser({});
  const response = await fetch(
    `http://127.0.0.1:3002/api/v1/users/${target.username}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: administratorCookie,
      },
      body: JSON.stringify({
        name: "Unchanged password",
        password: "",
        password_confirmation: "",
      }),
    },
  );
  expect(response.status).toBe(200);
  expect(
    await password.compare(
      "validpassword",
      (await user.findOneByUsername(target.username)).password,
    ),
  ).toBe(true);
});
