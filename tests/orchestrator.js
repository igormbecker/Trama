import retry from "async-retry";
import database from "infra/database.js";
import migrator from "models/migrator.js";
import user from "models/user.js";
import { faker } from "@faker-js/faker";

async function waitForAllServices() {
  await waitForWebServer();

  async function waitForWebServer() {
    return retry(fetchStatusPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchStatusPage() {
      const response = await fetch("http://localhost:3001/api/v1/status");

      if (response.status !== 200) {
        throw new Error();
      }
    }
  }
}

async function clearDataBase() {
  const isTramaTestDatabase =
    process.env.NODE_ENV === "test" &&
    process.env.POSTGRES_HOST === "127.0.0.1" &&
    process.env.POSTGRES_PORT === "5433" &&
    process.env.POSTGRES_USER === "trama_user" &&
    process.env.POSTGRES_DB === "trama_dev";

  if (!isTramaTestDatabase) {
    throw new Error(
      "Database cleanup requires the local Trama test configuration (127.0.0.1:5433/trama_dev).",
    );
  }

  await database.query(`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`);
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations();
}

async function createUser(userObject) {
  return await user.create({
    name: userObject.name || faker.person.fullName(),
    username:
      userObject.username || faker.internet.username().replace(/[_.-]/g, ""),
    email: userObject.email || faker.internet.email(),
    password: userObject.password || "validpassword",
  });
}

const orchestrator = {
  waitForAllServices,
  clearDataBase,
  runPendingMigrations,
  createUser,
};

export default orchestrator;
