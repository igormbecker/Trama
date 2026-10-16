import { jest } from "@jest/globals";
import orchestrator from "tests/orchestrator.js";
import database from "infra/database.js";
import testEnvironment from "infra/test-environment.js";

const isolatedEnvironment = {
  NODE_ENV: "test",
  POSTGRES_HOST: "127.0.0.1",
  POSTGRES_PORT: "5434",
  POSTGRES_USER: "trama_test_user",
  POSTGRES_DB: "trama_test",
  TRAMA_TEST_SERVER: "true",
  TEST_BASE_URL: "http://127.0.0.1:3002",
};

beforeEach(() => {
  jest.spyOn(database, "query").mockResolvedValue({ rows: [] });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("Test database isolation", () => {
  test("Allows schema cleanup only in the isolated test environment", async () => {
    jest.replaceProperty(process, "env", { ...isolatedEnvironment });
    await expect(orchestrator.clearDataBase()).resolves.toBeUndefined();
    expect(database.query).toHaveBeenCalledWith(
      "DROP SCHEMA public CASCADE; CREATE SCHEMA public;",
    );
  });

  test.each([
    [
      "development database",
      {
        POSTGRES_PORT: "5433",
        POSTGRES_USER: "trama_user",
        POSTGRES_DB: "trama_dev",
      },
    ],
    ["Curso.Dev port", { POSTGRES_PORT: "5432" }],
    ["remote host", { POSTGRES_HOST: "db.example.com" }],
    ["production mode", { NODE_ENV: "production" }],
    ["development HTTP server", { TEST_BASE_URL: "http://localhost:3001" }],
    ["missing test server marker", { TRAMA_TEST_SERVER: undefined }],
  ])("Rejects %s before sending SQL", async (_description, overrides) => {
    jest.replaceProperty(process, "env", {
      ...isolatedEnvironment,
      ...overrides,
    });
    await expect(orchestrator.clearDataBase()).rejects.toThrow();
    expect(database.query).not.toHaveBeenCalled();
  });

  test("Rejects the full former development configuration", async () => {
    jest.replaceProperty(process, "env", {
      NODE_ENV: "test",
      POSTGRES_HOST: "127.0.0.1",
      POSTGRES_PORT: "5433",
      POSTGRES_USER: "trama_user",
      POSTGRES_DB: "trama_dev",
    });
    await expect(orchestrator.clearDataBase()).rejects.toThrow();
    expect(database.query).not.toHaveBeenCalled();
  });
});

describe("Test environment loading", () => {
  test("Replaces inherited connection settings with the isolated test configuration", () => {
    jest.replaceProperty(process, "env", {
      ...process.env,
      NODE_ENV: "production",
      POSTGRES_HOST: "production.example.com",
      POSTGRES_PORT: "5432",
      POSTGRES_DB: "production_db",
      POSTGRES_USER: "production_user",
      POSTGRES_PASSWORD: "synthetic-production-value",
      POSTGRES_CA: "synthetic-certificate",
      DATABASE_URL: "postgres://invalid.example.com/production_db",
      PASSWORD_PEPPER: "synthetic-pepper",
    });

    testEnvironment.loadTestEnvironment();

    expect(process.env).toMatchObject(isolatedEnvironment);
    expect(process.env.POSTGRES_CA).toBe("");
    expect(process.env.PASSWORD_PEPPER).toBe("trama_test_only_pepper");
    const connection = new URL(process.env.DATABASE_URL);
    expect(connection.hostname).toBe("127.0.0.1");
    expect(connection.port).toBe("5434");
    expect(connection.pathname).toBe("/trama_test");
    expect(connection.username).toBe("trama_test_user");
  });
});
