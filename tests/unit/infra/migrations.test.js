import { jest } from "@jest/globals";
import handler from "pages/api/v1/migrations/index.js";
import authentication from "models/authentication.js";
import migrator from "models/migrator.js";

afterEach(() => jest.restoreAllMocks());

describe("Authorized migration responses", () => {
  test.each([
    ["GET", "listPendingMigrations", [{ name: "pending-migration" }], 200],
    ["POST", "runPendingMigrations", [{ name: "pending-migration" }], 201],
    ["POST", "runPendingMigrations", [], 200],
  ])(
    "%s preserves the result of %s",
    async (method, operation, migrations, status) => {
      jest
        .spyOn(authentication, "authenticateAdministrator")
        .mockResolvedValue({});
      const migrate = jest
        .spyOn(migrator, operation)
        .mockResolvedValue(migrations);
      const response = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await handler(
        {
          method,
          url: "/api/v1/migrations",
          cookies: { trama_session_id: "token" },
        },
        response,
      );

      expect(authentication.authenticateAdministrator).toHaveBeenCalledWith(
        "token",
      );
      expect(migrate).toHaveBeenCalledTimes(1);
      expect(response.status).toHaveBeenCalledWith(status);
      expect(response.json).toHaveBeenCalledWith(migrations);
    },
  );
});
