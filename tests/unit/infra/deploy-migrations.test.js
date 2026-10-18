const {
  runDeploymentMigrations,
} = require("../../../infra/scripts/run-deploy-migrations.js");
const vercel = require("../../../vercel.json");
const { spawnSync } = require("node:child_process");
const { resolve } = require("node:path");

const environment = {
  VERCEL: "1",
  VERCEL_ENV: "preview",
  DATABASE_URL_UNPOOLED:
    "postgresql://user:password@ep-example.sa-east-1.aws.neon.tech/trama?sslmode=require",
};

function setup() {
  const client = {
    connect: jest.fn().mockResolvedValue(),
    query: jest.fn().mockResolvedValue({ rows: [] }),
    end: jest.fn().mockResolvedValue(),
  };
  const createClient = jest.fn(() => client);
  const runner = jest.fn().mockResolvedValue([{ name: "pending" }]);
  return { client, createClient, runner };
}

test("Vercel only builds after migrations succeed", () => {
  expect(vercel.buildCommand).toBe(
    "npm run migrations:deploy && npm run build",
  );
});

test.each(["production", "preview"])(
  "uses the direct connection and native migration lock in %s",
  async (target) => {
    const dependencies = setup();
    await expect(
      runDeploymentMigrations(
        { ...environment, VERCEL_ENV: target },
        dependencies,
      ),
    ).resolves.toHaveLength(1);
    expect(dependencies.createClient).toHaveBeenCalledWith(
      expect.objectContaining({ ssl: { rejectUnauthorized: true } }),
    );
    expect(dependencies.client.query).toHaveBeenCalledWith(
      "SET lock_timeout = '60s'",
    );
    expect(dependencies.runner).toHaveBeenCalledWith(
      expect.objectContaining({
        dbClient: dependencies.client,
        migrationsTable: "pgmigrations",
        direction: "up",
        dryRun: false,
        noLock: false,
        advisoryLockMode: "wait",
        singleTransaction: true,
        checkOrder: true,
      }),
    );
    expect(dependencies.client.end).toHaveBeenCalledTimes(1);
  },
);

test.each([
  { VERCEL: "" },
  { VERCEL_ENV: "development" },
  {
    DATABASE_URL_UNPOOLED: "",
    DATABASE_URL: environment.DATABASE_URL_UNPOOLED,
  },
  { DATABASE_URL_UNPOOLED: "postgresql://user:password@localhost/trama_dev" },
  {
    DATABASE_URL_UNPOOLED:
      "postgresql://user:password@ep-example-pooler.sa-east-1.aws.neon.tech/trama",
  },
])("rejects unsafe configuration before connecting: %j", async (overrides) => {
  const dependencies = setup();
  await expect(
    runDeploymentMigrations({ ...environment, ...overrides }, dependencies),
  ).rejects.toThrow();
  expect(dependencies.createClient).not.toHaveBeenCalled();
});

test("propagates migration failure and closes the connection", async () => {
  const dependencies = setup();
  dependencies.runner.mockRejectedValue(new Error("Migration failed"));
  await expect(
    runDeploymentMigrations(environment, dependencies),
  ).rejects.toThrow("Migration failed");
  expect(dependencies.client.end).toHaveBeenCalledTimes(1);
});

test("closes the connection when lock setup fails", async () => {
  const dependencies = setup();
  dependencies.client.query.mockRejectedValue(new Error("Connection lost"));
  await expect(
    runDeploymentMigrations(environment, dependencies),
  ).rejects.toThrow("Connection lost");
  expect(dependencies.runner).not.toHaveBeenCalled();
  expect(dependencies.client.end).toHaveBeenCalledTimes(1);
});

test("does not reapply migrations when nothing is pending", async () => {
  const dependencies = setup();
  dependencies.runner.mockResolvedValue([]);
  await expect(
    runDeploymentMigrations(environment, dependencies),
  ).resolves.toEqual([]);
  expect(dependencies.client.end).toHaveBeenCalledTimes(1);
});

test("URL parameters cannot disable certificate validation", async () => {
  const dependencies = setup();
  await runDeploymentMigrations(
    {
      ...environment,
      DATABASE_URL_UNPOOLED: `${environment.DATABASE_URL_UNPOOLED}&ssl=false&sslcert=unsafe`,
    },
    dependencies,
  );
  const options = dependencies.createClient.mock.calls[0][0];
  expect(options.connectionString).not.toMatch(/ssl/);
  expect(options.ssl.rejectUnauthorized).toBe(true);
});

test("the deploy command exits with failure outside Vercel without exposing credentials", () => {
  const result = spawnSync(
    process.execPath,
    [resolve("infra/scripts/run-deploy-migrations.js")],
    {
      env: { ...process.env, ...environment, VERCEL: "" },
      encoding: "utf8",
      timeout: 10000,
    },
  );
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("Build stopped");
  expect(result.stderr).not.toContain("password");
});
