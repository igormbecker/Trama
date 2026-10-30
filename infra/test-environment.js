const { resolve } = require("node:path");
const dotenv = require("dotenv");
const { expand } = require("dotenv-expand");

function isIsolatedConnectionUrl(value) {
  if (!value) {
    return true;
  }
  try {
    const connection = new URL(value);
    return (
      ["postgres:", "postgresql:"].includes(connection.protocol) &&
      connection.hostname === "127.0.0.1" &&
      connection.port === "5434" &&
      connection.username === "trama_test_user" &&
      connection.pathname === "/trama_test" &&
      connection.search === ""
    );
  } catch {
    return false;
  }
}

function assertTestEnvironment(environment = process.env) {
  const isIsolated =
    environment.NODE_ENV === "test" &&
    environment.POSTGRES_HOST === "127.0.0.1" &&
    environment.POSTGRES_PORT === "5434" &&
    environment.POSTGRES_USER === "trama_test_user" &&
    environment.POSTGRES_DB === "trama_test" &&
    environment.TRAMA_TEST_SERVER === "true" &&
    environment.TEST_BASE_URL === "http://127.0.0.1:3002" &&
    isIsolatedConnectionUrl(environment.DATABASE_URL) &&
    isIsolatedConnectionUrl(environment.DATABASE_URL_UNPOOLED);

  if (!isIsolated) {
    throw new Error(
      "Tests require the isolated Trama environment: 127.0.0.1:5434/trama_test and HTTP port 3002.",
    );
  }
}

function loadTestEnvironment() {
  const configuration = dotenv.config({
    path: resolve(__dirname, "..", ".env.test"),
    override: true,
    quiet: true,
  });

  if (configuration.error) {
    throw configuration.error;
  }

  expand(configuration);
  process.env.DATABASE_URL_UNPOOLED = process.env.DATABASE_URL;
  process.env.NODE_ENV = "test";
  assertTestEnvironment();
}

module.exports = {
  assertTestEnvironment,
  loadTestEnvironment,
};
