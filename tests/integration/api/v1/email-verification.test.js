import orchestrator from "tests/orchestrator.js";
import database from "infra/database.js";
import user from "models/user.js";
import session from "models/session.js";
import emailVerification from "models/emailVerification.js";
import { createHash } from "node:crypto";

const base = "http://127.0.0.1:3002";
beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDataBase();
  await orchestrator.runPendingMigrations();
});

async function createAccount() {
  return user.create({
    name: "Reader",
    username: `reader${Date.now()}${Math.floor(Math.random() * 10000)}`,
    email: `reader${Date.now()}${Math.random()}@example.com`,
    password: "validpassword",
  });
}

async function requestToken(account) {
  await emailVerification.request({ email: account.email });
  const messages = await (await fetch("http://127.0.0.1:1082/messages")).json();
  const matching = messages.filter((message) =>
    message.recipients.some((recipient) => recipient.includes(account.email)),
  );
  const message = await (
    await fetch(`http://127.0.0.1:1082/messages/${matching.at(-1).id}.plain`)
  ).text();
  return message.match(/#token=([a-f0-9]{96})/)[1];
}

test("New accounts cannot log in or use pre-existing sessions before confirmation; links are hashed and single use", async () => {
  const account = await createAccount();
  const login = await fetch(`${base}/api/v1/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: account.email, password: "validpassword" }),
  });
  expect(login.status).toBe(403);
  expect(login.headers.get("set-cookie")).toBeNull();
  const cookie = `trama_session_id=${(await session.create(account.id)).token}`;
  expect(
    (await fetch(`${base}/api/v1/works`, { headers: { Cookie: cookie } }))
      .status,
  ).toBe(401);
  const token = await requestToken(account);
  const stored = await database.query({
    text: "SELECT token_hash FROM email_verification_tokens WHERE user_id = $1",
    values: [account.id],
  });
  expect(stored.rows[0].token_hash).toBe(
    createHash("sha256").update(token).digest("hex"),
  );
  const confirm = () =>
    fetch(`${base}/api/v1/email-verification`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
  expect((await confirm()).status).toBe(204);
  expect((await confirm()).status).toBe(400);
  expect((await user.findOneById(account.id)).email_verified_at).toBeInstanceOf(
    Date,
  );
  const verifiedLogin = await fetch(`${base}/api/v1/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: account.email, password: "validpassword" }),
  });
  expect(verifiedLogin.status).toBe(201);
});

test("Expired links fail, concurrent confirmations only succeed once, and resends are limited", async () => {
  const account = await createAccount();
  const token = await requestToken(account);
  await database.query({
    text: "UPDATE email_verification_tokens SET expires_at = now() - interval '1 second' WHERE user_id = $1",
    values: [account.id],
  });
  await expect(emailVerification.confirm({ token })).rejects.toMatchObject({
    name: "ValidationError",
  });
  await emailVerification.request({ email: account.email });
  const count = await database.query({
    text: "SELECT count(*)::int AS count FROM email_verification_tokens WHERE user_id = $1",
    values: [account.id],
  });
  expect(count.rows[0].count).toBe(1);
  await database.query({
    text: "UPDATE email_verification_requests SET requested_at = now() - interval '2 minutes' WHERE address_hash = $1",
    values: [createHash("sha256").update(account.email).digest("hex")],
  });
  const nextToken = await requestToken(account);
  const results = await Promise.allSettled([
    emailVerification.confirm({ token: nextToken }),
    emailVerification.confirm({ token: nextToken }),
  ]);
  expect(
    results.filter((result) => result.status === "fulfilled"),
  ).toHaveLength(1);
});

test("Existing exempt accounts keep access without a fabricated confirmation", async () => {
  const account = await createAccount();
  await database.query({
    text: "UPDATE users SET email_verification_required = false WHERE id = $1",
    values: [account.id],
  });
  const response = await fetch(`${base}/api/v1/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: account.email, password: "validpassword" }),
  });
  expect(response.status).toBe(201);
  expect((await user.findOneById(account.id)).email_verified_at).toBeNull();
});

test("Changing an email invalidates confirmation and old links, including when the old address is restored", async () => {
  const account = await createAccount();
  const token = await requestToken(account);
  await user.update(account.username, {
    email: `changed${Date.now()}@example.com`,
  });
  await user.update(account.username, { email: account.email });
  await expect(emailVerification.confirm({ token })).rejects.toMatchObject({
    name: "ValidationError",
  });
});

test("Unknown and known addresses receive the same public resend response and tokens are not returned", async () => {
  const account = await createAccount();
  const request = (email) =>
    fetch(`${base}/api/v1/email-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  const known = await request(account.email);
  const unknown = await request("unknown@example.com");
  expect(known.status).toBe(202);
  expect(unknown.status).toBe(202);
  expect(await known.json()).toEqual(await unknown.json());
});
