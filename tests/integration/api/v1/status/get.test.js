import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("GET /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("Retrieving current system status", async () => {
      const response = await fetch(`http://localhost:3000/api/v1/status`);
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody.updated_at).toBeDefined();

      const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toBe(parsedUpdatedAt);

      const expectedVersion =
        process.env.NODE_ENV.toUpperCase() === "TEST"
          ? "16.0"
          : "16.12 (6d3029c)";
      expect(responseBody.dependencies.database.version).toEqual(
        expectedVersion,
      );

      expect(responseBody.dependencies.database.max_connections).toEqual(100);
      expect(responseBody.dependencies.database.opened_connections).toEqual(1);
    });
  });
});
