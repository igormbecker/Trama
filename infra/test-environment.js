const { resolve } = require("node:path");
const dotenv = require("dotenv");
const { expand } = require("dotenv-expand");

function assertTestEnvironment(environment = process.env) {
  const isIsolated =
    environment.NODE_ENV === "test" &&
    environment.POSTGRES_HOST === "127.0.0.1" &&
    environment.POSTGRES_PORT === "5434" &&
    environment.POSTGRES_USER === "trama_test_user" &&
    environment.POSTGRES_DB === "trama_test" &&
    environment.TRAMA_TEST_SERVER === "true" &&
    environment.TEST_BASE_URL === "http://127.0.0.1:3002";

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
  process.env.NODE_ENV = "test";
  assertTestEnvironment();
}

module.exports = {
  assertTestEnvironment,
  loadTestEnvironment,
};
