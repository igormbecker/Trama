const { resolve } = require("node:path");
const { Client } = require("pg");

function getConnectionOptions(environment) {
  if (
    environment.VERCEL !== "1" ||
    !["production", "preview"].includes(environment.VERCEL_ENV)
  ) {
    throw new Error(
      "Deployment migrations require Vercel production or preview.",
    );
  }

  if (!environment.DATABASE_URL_UNPOOLED) {
    throw new Error(
      "DATABASE_URL_UNPOOLED is required for deployment migrations.",
    );
  }

  let connectionUrl;
  try {
    connectionUrl = new URL(environment.DATABASE_URL_UNPOOLED);
  } catch {
    throw new Error("DATABASE_URL_UNPOOLED must be a valid direct Neon URL.");
  }

  if (
    !["postgres:", "postgresql:"].includes(connectionUrl.protocol) ||
    !connectionUrl.hostname.endsWith(".neon.tech") ||
    connectionUrl.hostname.includes("-pooler.") ||
    !connectionUrl.username ||
    !connectionUrl.password ||
    connectionUrl.pathname.length < 2
  ) {
    throw new Error("DATABASE_URL_UNPOOLED must be a direct Neon connection.");
  }

  // Let pg use the explicit TLS configuration instead of URL SSL overrides.
  for (const parameter of [
    "sslmode",
    "sslcert",
    "sslkey",
    "sslrootcert",
    "ssl",
  ]) {
    connectionUrl.searchParams.delete(parameter);
  }

  return {
    connectionString: connectionUrl.toString(),
    ssl: { rejectUnauthorized: true },
    connectionTimeoutMillis: 15000,
  };
}

async function runDeploymentMigrations(
  environment = process.env,
  dependencies = {},
) {
  const connectionOptions = getConnectionOptions(environment);
  const createClient =
    dependencies.createClient || ((options) => new Client(options));
  const client = createClient(connectionOptions);

  try {
    await client.connect();
    await client.query("SET lock_timeout = '60s'");
    const runner =
      dependencies.runner || (await import("node-pg-migrate")).runner;
    return await runner({
      dbClient: client,
      dir: resolve(__dirname, "..", "migrations"),
      direction: "up",
      migrationsTable: "pgmigrations",
      dryRun: false,
      noLock: false,
      advisoryLockMode: "wait",
      singleTransaction: true,
      checkOrder: true,
      log: () => {},
    });
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  runDeploymentMigrations()
    .then((migrations) => {
      console.log(`Deployment migrations applied: ${migrations.length}.`);
    })
    .catch((error) => {
      // Database errors can contain credentials or SQL; expose only a safe code.
      const code = /^[A-Z0-9_]{2,30}$/.test(error.code || "")
        ? error.code
        : "MIGRATION_FAILED";
      console.error(
        `Deployment migrations failed (${code}). Check the direct Neon connection and pending migrations. Build stopped.`,
      );
      process.exitCode = 1;
    });
}

module.exports = { runDeploymentMigrations };
