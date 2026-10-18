import { createHash } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import orchestrator from "tests/orchestrator.js";
import database from "infra/database.js";
import session from "models/session.js";
import password from "models/password.js";
import passwordRecovery from "models/passwordRecovery.js";

const endpoint = "http://127.0.0.1:3002/api/v1/password-recovery";
const newPassword = "new-password-123";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDataBase();
  await orchestrator.runPendingMigrations();
});

async function requestRecovery(email) {
  return fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Host: "untrusted.invalid" },
    body: JSON.stringify({ email }),
  });
}

async function getToken(account) {
  const response = await requestRecovery(account.email);
  expect(response.status).toBe(202);
  for (let attempt = 0; attempt < 100; attempt++) {
    const messages = await fetch("http://127.0.0.1:1082/messages").then(
      (response) => response.json(),
    );
    const message = messages.find(
      (message) =>
        message.recipients.some((recipient) =>
          recipient.includes(account.email),
        ) && message.subject === "Recupere sua senha no Trama",
    );
    if (message) {
      const text = await fetch(
        `http://127.0.0.1:1082/messages/${message.id}.plain`,
      ).then((response) => response.text());
      expect(text).toContain("http://127.0.0.1:3002/reset-password#token=");
      expect(text).not.toContain("untrusted.invalid");
      return text.match(/#token=([a-f0-9]{96})/)[1];
    }
    await delay(100);
  }
  throw new Error("Recovery email was not captured in the isolated mailbox.");
}

function reset(token, fields = {}, headers = {}) {
  return fetch(endpoint, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({
      token,
      password: newPassword,
      password_confirmation: newPassword,
      ...fields,
    }),
  });
}

test("Returns the same private response for existing and unknown addresses without exposing tokens", async () => {
  const account = await orchestrator.createUser({ skipLegalAcceptance: true });
  const existing = await requestRecovery(account.email);
  const missing = await requestRecovery("unknown-recovery@example.invalid");
  expect(existing.status).toBe(202);
  expect(missing.status).toBe(202);
  expect(existing.headers.get("cache-control")).toBe("private, no-store");
  expect(await existing.json()).toEqual(await missing.json());
});

test("Sends a hashed 15-minute link and resets without requiring legal acceptance or creating sessions", async () => {
  const account = await orchestrator.createUser({ skipLegalAcceptance: true });
  const first = await session.create(account.id);
  await session.create(account.id);
  const other = await orchestrator.createUser({});
  const otherSession = await session.create(other.id);
  const token = await getToken(account);
  const stored = await database.query({
    text: "SELECT * FROM password_recovery_tokens WHERE user_id = $1",
    values: [account.id],
  });
  expect(stored.rows[0].token_hash).toBe(
    createHash("sha256").update(token).digest("hex"),
  );
  expect(JSON.stringify(stored.rows)).not.toContain(token);
  expect(
    new Date(stored.rows[0].expires_at) - new Date(stored.rows[0].created_at),
  ).toBe(15 * 60 * 1000);
  const response = await reset(token);
  expect(response.status).toBe(204);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  const updated = await database.query({
    text: "SELECT * FROM users WHERE id = $1",
    values: [account.id],
  });
  expect(await password.compare(newPassword, updated.rows[0].password)).toBe(
    true,
  );
  await expect(session.findOneValidByToken(first.token)).rejects.toMatchObject({
    name: "UnauthorizedError",
  });
  await expect(
    session.findOneValidByToken(otherSession.token),
  ).resolves.toMatchObject({ user_id: other.id });
  const active = await database.query({
    text: "SELECT id FROM sessions WHERE user_id = $1 AND expires_at > now()",
    values: [account.id],
  });
  expect(active.rowCount).toBe(0);
  const acceptances = await database.query({
    text: "SELECT user_id FROM legal_acceptances WHERE user_id = $1",
    values: [account.id],
  });
  expect(acceptances.rowCount).toBe(0);
  expect((await reset(token)).status).toBe(400);
});

test("Only one concurrent reset can consume the same token", async () => {
  const account = await orchestrator.createUser({});
  const token = await getToken(account);
  const responses = await Promise.all([reset(token), reset(token)]);
  expect(responses.map((response) => response.status).sort()).toEqual([
    204, 400,
  ]);
});

test("Expired tokens cannot change the password", async () => {
  const account = await orchestrator.createUser({});
  const token = await getToken(account);
  await database.query({
    text: "UPDATE password_recovery_tokens SET expires_at = now() - interval '1 second' WHERE user_id = $1",
    values: [account.id],
  });
  expect((await reset(token)).status).toBe(400);
  const result = await database.query({
    text: "SELECT password FROM users WHERE id = $1",
    values: [account.id],
  });
  expect(result.rows[0].password).toBe(account.password);
});

test("Limits requests to one per minute and five per hour without changing the public result", async () => {
  const account = await orchestrator.createUser({});
  await getToken(account);
  await passwordRecovery.request({ email: account.email });
  let tokens = await database.query({
    text: "SELECT token_hash FROM password_recovery_tokens WHERE user_id = $1",
    values: [account.id],
  });
  expect(tokens.rowCount).toBe(1);
  for (let attempt = 0; attempt < 5; attempt++) {
    await database.query(
      "UPDATE password_recovery_requests SET requested_at = now() - interval '61 seconds'",
    );
    await passwordRecovery.request({ email: account.email });
  }
  tokens = await database.query({
    text: "SELECT token_hash FROM password_recovery_tokens WHERE user_id = $1",
    values: [account.id],
  });
  expect(tokens.rowCount).toBe(5);
});

test("Successful recovery invalidates all outstanding links and represented sessions", async () => {
  const account = await orchestrator.createUser({});
  const token = await getToken(account);
  const otherToken = "b".repeat(96);
  await database.query({
    text: "INSERT INTO password_recovery_tokens (token_hash, user_id, email, password_fingerprint) SELECT $2, user_id, email, password_fingerprint FROM password_recovery_tokens WHERE user_id = $1 LIMIT 1",
    values: [account.id, createHash("sha256").update(otherToken).digest("hex")],
  });
  const administrator = await orchestrator.createUser({});
  const representedSession = await session.create(administrator.id);
  await database.query({
    text: "UPDATE sessions SET impersonated_user_id = $2, impersonation_expires_at = now() + interval '15 minutes' WHERE id = $1",
    values: [representedSession.id, account.id],
  });
  expect((await reset(token)).status).toBe(204);
  expect((await reset(otherToken)).status).toBe(400);
  await expect(
    session.findOneValidByToken(representedSession.token),
  ).rejects.toMatchObject({ name: "UnauthorizedError" });
});

test.each(["email", "password"])(
  "Rejects a token after the account %s changes",
  async (field) => {
    const account = await orchestrator.createUser({});
    const token = await getToken(account);
    const value =
      field === "email"
        ? "changed@example.invalid"
        : await password.hash("another-password");
    await database.query({
      text: `UPDATE users SET ${field} = $2 WHERE id = $1`,
      values: [account.id, value],
    });
    expect((await reset(token)).status).toBe(400);
  },
);

test("Invalid password input leaves the token available for a corrected submission", async () => {
  const account = await orchestrator.createUser({});
  const token = await getToken(account);
  for (const fields of [
    { password: "short", password_confirmation: "short" },
    { password_confirmation: "different" },
    { password: "a".repeat(129), password_confirmation: "a".repeat(129) },
    { is_admin: true },
  ]) {
    expect((await reset(token, fields)).status).toBe(400);
  }
  expect((await reset(token)).status).toBe(204);
});

test("Malformed tokens and request fields are rejected without authentication", async () => {
  expect((await reset("invalid")).status).toBe(400);
  expect((await reset("a".repeat(96))).status).toBe(400);
  expect((await requestRecovery("invalid")).status).toBe(400);
});

test("A represented session cannot change passwords through recovery", async () => {
  const administrator = await orchestrator.createUser({});
  const target = await orchestrator.createUser({});
  const current = await session.create(administrator.id);
  await database.query({
    text: "UPDATE sessions SET impersonated_user_id = $2, impersonation_expires_at = now() + interval '15 minutes' WHERE id = $1",
    values: [current.id, target.id],
  });
  const token = await getToken(target);
  expect(
    (await reset(token, {}, { Cookie: `trama_session_id=${current.token}` }))
      .status,
  ).toBe(403);
  expect((await reset(token)).status).toBe(204);
});
