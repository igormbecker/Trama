import { Client } from "pg";
import database from "infra/database.js";

jest.mock("pg", () => ({ Client: jest.fn() }));

const originalEnvironment = { ...process.env };

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.DATABASE_URL;
  delete process.env.DATABASE_URL_UNPOOLED;
  delete process.env.POSTGRES_CA;
  Client.mockImplementation(() => ({ connect: jest.fn().mockResolvedValue() }));
});

afterEach(() => {
  process.env = { ...originalEnvironment };
});

test("Uses the Neon pooled URL for application connections with production SSL", async () => {
  process.env.NODE_ENV = "production";
  process.env.DATABASE_URL = "postgresql://example:fake@pooled.invalid/neondb";
  await database.getNewClient();
  expect(Client).toHaveBeenCalledWith({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  });
});

test("Uses the direct URL for migrations instead of the pooled application URL", async () => {
  process.env.DATABASE_URL = "postgresql://example:fake@pooled.invalid/neondb";
  process.env.DATABASE_URL_UNPOOLED =
    "postgresql://example:fake@direct.invalid/neondb";
  await database.getNewClient({ direct: true });
  expect(Client).toHaveBeenCalledWith({
    connectionString: process.env.DATABASE_URL_UNPOOLED,
    ssl: false,
  });
});

test("Falls back to the application URL when a direct URL is not configured", async () => {
  process.env.DATABASE_URL =
    "postgresql://example:fake@database.invalid/neondb";
  await database.getNewClient({ direct: true });
  expect(Client).toHaveBeenCalledWith({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
  });
});

test("Preserves the existing local PostgreSQL settings without a connection URL", async () => {
  await database.getNewClient();
  expect(Client).toHaveBeenCalledWith({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    ssl: false,
  });
});
