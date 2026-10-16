import { spawnSync } from "node:child_process";

function loadOrigins(value) {
  const result = spawnSync(
    process.execPath,
    [
      "-e",
      "process.stdout.write(JSON.stringify(require('./next.config.js').allowedDevOrigins ?? null))",
    ],
    {
      encoding: "utf8",
      env: { ...process.env, TRAMA_DEV_ORIGINS: value },
    },
  );
  expect(result.status).toBe(0);
  return JSON.parse(result.stdout);
}

test("Only permits explicitly configured development hosts", () => {
  expect(loadOrigins(" 192.168.1.20,172.22.180.28, ")).toEqual([
    "192.168.1.20",
    "172.22.180.28",
  ]);
});
test("Does not allow additional development hosts by default", () => {
  expect(loadOrigins("")).toEqual([]);
});
