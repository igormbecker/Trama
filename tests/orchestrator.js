import retry from "async-retry";
import testEnvironment from "infra/test-environment.js";
import database from "infra/database.js";
import migrator from "models/migrator.js";
import user from "models/user.js";
import session from "models/session.js";
import { faker } from "@faker-js/faker";

async function waitForAllServices() {
  testEnvironment.assertTestEnvironment();
  await waitForWebServer();

  async function waitForWebServer() {
    return retry(fetchStatusPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchStatusPage() {
      const response = await fetch("http://127.0.0.1:3002/api/v1/status");

      if (response.status !== 200) {
        throw new Error();
      }
    }
  }
}

async function clearDataBase() {
  testEnvironment.assertTestEnvironment();

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

async function createAdministratorCookie() {
  const administrator = await createUser({});
  await database.query({
    text: "UPDATE users SET is_admin = true WHERE id = $1",
    values: [administrator.id],
  });
  return `trama_session_id=${(await session.create(administrator.id)).token}`;
}

const orchestrator = {
  createAdministratorCookie,
  waitForAllServices,
  clearDataBase,
  runPendingMigrations,
  createUser,
};

export default orchestrator;
