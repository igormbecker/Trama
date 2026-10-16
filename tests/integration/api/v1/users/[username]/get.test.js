import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";

let administratorCookie;
beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDataBase();
  await orchestrator.runPendingMigrations();
  administratorCookie = await orchestrator.createAdministratorCookie();
});

describe("GET /api/v1/users/[username]", () => {
  describe("Administrator", () => {
    test("With exact case match", async () => {
      await orchestrator.createUser({
        name: "Mesmo Case",
        username: "MesmoCase",
        email: "mesmo.case@bectec.com.br",
        password: "password123",
      });

      const response2 = await fetch(
        "http://127.0.0.1:3002/api/v1/users/MesmoCase",
        { headers: { Cookie: administratorCookie } },
      );
      expect(response2.status).toBe(200);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        id: response2Body.id,
        name: "Mesmo Case",
        username: "MesmoCase",
        email: "mesmo.case@bectec.com.br",
        is_admin: false,
        created_at: response2Body.created_at,
        updated_at: response2Body.updated_at,
      });

      expect(uuidVersion(response2Body.id)).toBe(4);
      expect(Date.parse(response2Body.created_at)).not.toBeNaN();
      expect(Date.parse(response2Body.updated_at)).not.toBeNaN();
    });

    test("With case mismatch", async () => {
      await orchestrator.createUser({
        name: "Case Diferente",
        username: "CaseDiferente",
        email: "case.diferente@bectec.com.br",
        password: "password123",
      });

      const response2 = await fetch(
        "http://127.0.0.1:3002/api/v1/users/casediferente",
        { headers: { Cookie: administratorCookie } },
      );
      expect(response2.status).toBe(200);

      const response2Body = await response2.json();
      expect(response2Body).toEqual({
        id: response2Body.id,
        name: "Case Diferente",
        username: "CaseDiferente",
        email: "case.diferente@bectec.com.br",
        is_admin: false,
        created_at: response2Body.created_at,
        updated_at: response2Body.updated_at,
      });

      expect(uuidVersion(response2Body.id)).toBe(4);
      expect(Date.parse(response2Body.created_at)).not.toBeNaN();
      expect(Date.parse(response2Body.updated_at)).not.toBeNaN();
    });

    test("With nonexistent username", async () => {
      const response = await fetch(
        "http://127.0.0.1:3002/api/v1/users/UsuarioInexistente",
        { headers: { Cookie: administratorCookie } },
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
  });
});
