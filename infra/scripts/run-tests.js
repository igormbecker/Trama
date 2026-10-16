const { spawn, spawnSync } = require("node:child_process");
const { createServer } = require("node:net");
const { resolve } = require("node:path");
const { setTimeout: delay } = require("node:timers/promises");
const { loadTestEnvironment } = require("../test-environment.js");

const projectDirectory = resolve(__dirname, "..", "..");
const composeArguments = [
  "compose",
  "--project-name",
  "trama-test",
  "-f",
  "infra/compose.test.yaml",
];

let webServer;
let jestProcess;
let webServerExited = false;
let serverOutput = "";
let interrupted = false;
let stopping = false;
let databaseStartAttempted = false;

function runCompose(argumentsList) {
  const result = spawnSync("docker", [...composeArguments, ...argumentsList], {
    cwd: projectDirectory,
    env: process.env,
    stdio: "inherit",
    timeout: 60000,
  });

  if (result.error || result.status !== 0) {
    throw new Error("Could not manage the isolated test database.");
  }
}

async function assertPortAvailable() {
  await new Promise((resolvePromise, reject) => {
    const probe = createServer();
    probe.once("error", () =>
      reject(
        new Error(
          "Port 3002 is already in use. The existing server was left untouched.",
        ),
      ),
    );
    probe.listen(3002, () => probe.close(resolvePromise));
  });
}

async function waitForTestServer() {
  const deadline = Date.now() + 30000;

  while (Date.now() < deadline) {
    if (interrupted || webServerExited) {
      throw new Error(
        "The isolated test server stopped before becoming ready.",
      );
    }

    try {
      const response = await fetch(
        `${process.env.TEST_BASE_URL}/api/v1/status`,
        {
          signal: AbortSignal.timeout(2000),
        },
      );

      if (response.status === 200 && !webServerExited) {
        return;
      }
    } catch {
      // Next.js may still be starting or compiling its first API request.
    }

    await delay(250);
  }

  throw new Error("The isolated test server did not become ready.");
}

function stopChildren(signal) {
  interrupted = true;
  jestProcess?.kill(signal);
  webServer?.kill("SIGTERM");
}

process.once("SIGINT", () => stopChildren("SIGINT"));
process.once("SIGTERM", () => stopChildren("SIGTERM"));

async function main() {
  loadTestEnvironment();
  await assertPortAvailable();

  try {
    databaseStartAttempted = true;
    runCompose([
      "up",
      "-d",
      "--force-recreate",
      "--wait",
      "--wait-timeout",
      "30",
    ]);

    console.log(
      "Test environment: HTTP 127.0.0.1:3002, PostgreSQL 127.0.0.1:5434/trama_test.",
    );
    webServer = spawn(
      process.execPath,
      [
        require.resolve("next/dist/bin/next"),
        "dev",
        "--hostname",
        "127.0.0.1",
        "--port",
        "3002",
      ],
      {
        cwd: projectDirectory,
        env: process.env,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    function captureServerOutput(chunk) {
      serverOutput = `${serverOutput}${chunk.toString()}`.slice(-8000);
    }

    webServer.stdout.on("data", captureServerOutput);
    webServer.stderr.on("data", captureServerOutput);

    webServer.once("exit", () => {
      webServerExited = true;
      if (!stopping) {
        jestProcess?.kill("SIGTERM");
      }
    });
    webServer.once("error", () => {
      webServerExited = true;
    });

    await waitForTestServer();

    const argumentsList = process.argv.slice(2);
    const isWatchMode = argumentsList.includes("--watch");
    const jestArguments = argumentsList.filter(
      (argument) => argument !== "--watch",
    );
    jestProcess = spawn(
      process.execPath,
      [
        "--experimental-vm-modules",
        require.resolve("jest/bin/jest"),
        "--runInBand",
        ...(isWatchMode ? ["--watchAll"] : []),
        ...jestArguments,
      ],
      {
        cwd: projectDirectory,
        env: process.env,
        stdio: "inherit",
      },
    );

    process.exitCode = await new Promise((resolvePromise, reject) => {
      jestProcess.once("error", reject);
      jestProcess.once("exit", (code) => resolvePromise(code ?? 1));
    });
  } finally {
    stopping = true;
    if (webServer && !webServerExited) {
      const serverStopped = new Promise((resolvePromise) =>
        webServer.once("exit", resolvePromise),
      );
      webServer.kill("SIGTERM");
      await serverStopped;
    }

    if (databaseStartAttempted) {
      runCompose(["stop"]);
    }
  }
}

main().catch((error) => {
  if (serverOutput) {
    console.error(serverOutput);
  }

  console.error(error.message);
  process.exitCode = 1;
});
