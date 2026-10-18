import { createHash, randomBytes } from "node:crypto";
import database from "infra/database.js";
import email from "infra/email.js";
import password from "models/password.js";
import { renderMessage } from "models/transactional/index.js";
import { ServiceError, ValidationError } from "infra/errors.js";

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function validateRequest(input) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.keys(input).some((key) => key !== "email") ||
    typeof input.email !== "string" ||
    input.email.trim().length > 254 ||
    !/^[^\s@,<>]+@[^\s@,<>]+\.[^\s@,<>]+$/.test(input.email.trim())
  ) {
    throw new ValidationError({ message: "Provide a valid email address." });
  }
  return input.email.trim().toLowerCase();
}

function getOrigin() {
  if (
    process.env.NODE_ENV === "test" ||
    process.env.TRAMA_TEST_SERVER === "true"
  )
    return "http://127.0.0.1:3002";
  if (process.env.NODE_ENV === "development") return "http://localhost:3001";
  if (process.env.VERCEL_ENV === "production")
    return "https://trama.bectec.com.br";
  if (
    process.env.VERCEL_ENV === "preview" &&
    /^[a-z0-9-]+\.vercel\.app$/i.test(process.env.VERCEL_URL || "")
  ) {
    return `https://${process.env.VERCEL_URL}`;
  }
  throw new ServiceError({ message: "Recovery origin is not configured." });
}

async function request(input) {
  const address = validateRequest(input);
  const origin = getOrigin();
  // One request per minute and at most five per hour, including unknown accounts.
  const allowed = await database.query({
    text: `INSERT INTO password_recovery_requests (address_hash, requested_at, window_started_at, request_count)
      VALUES ($1, now(), now(), 1)
      ON CONFLICT (address_hash) DO UPDATE SET requested_at = now(),
        window_started_at = CASE WHEN password_recovery_requests.window_started_at < now() - interval '1 hour' THEN now() ELSE password_recovery_requests.window_started_at END,
        request_count = CASE WHEN password_recovery_requests.window_started_at < now() - interval '1 hour' THEN 1 ELSE password_recovery_requests.request_count + 1 END
      WHERE password_recovery_requests.requested_at < now() - interval '1 minute'
        AND (password_recovery_requests.window_started_at < now() - interval '1 hour' OR password_recovery_requests.request_count < 5)
      RETURNING address_hash`,
    values: [digest(address)],
  });
  if (!allowed.rowCount) return;
  const result = await database.query({
    text: "SELECT id, email, password FROM users WHERE LOWER(email) = $1",
    values: [address],
  });
  const account = result.rows[0];
  if (!account) return;
  const token = randomBytes(48).toString("hex");
  const tokenHash = digest(token);
  await database.query({
    text: "INSERT INTO password_recovery_tokens (token_hash, user_id, email, password_fingerprint) VALUES ($1, $2, $3, $4)",
    values: [
      tokenHash,
      account.id,
      account.email.toLowerCase(),
      digest(account.password),
    ],
  });
  try {
    const content = await renderMessage({
      title: "Vamos recuperar seu acesso?",
      paragraphs: [
        "Recebemos um pedido para redefinir sua senha no Trama.",
        "Este link vale por 15 minutos e só pode ser usado uma vez. Se você não fez o pedido, ignore esta mensagem: sua senha continua a mesma.",
      ],
      actionLabel: "Redefinir minha senha",
      // The fragment is not transmitted in HTTP requests or referrer headers.
      actionUrl: `${origin}/reset-password#token=${token}`,
    });
    await email.send({
      to: account.email,
      subject: "Recupere sua senha no Trama",
      ...content,
      idempotencyKey: `recovery/${tokenHash}`,
    });
  } catch {
    await database.query({
      text: "DELETE FROM password_recovery_tokens WHERE token_hash = $1",
      values: [tokenHash],
    });
    throw new ServiceError({ message: "Recovery email could not be sent." });
  }
}

function invalidToken() {
  return new ValidationError({ message: "Invalid or expired recovery link." });
}

async function reset(input) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.keys(input).some(
      (key) => !["token", "password", "password_confirmation"].includes(key),
    )
  ) {
    throw new ValidationError({ message: "Invalid password recovery data." });
  }
  if (typeof input.token !== "string" || !/^[a-f0-9]{96}$/.test(input.token))
    throw invalidToken();
  if (
    typeof input.password !== "string" ||
    input.password.length < 8 ||
    input.password.length > 128
  ) {
    throw new ValidationError({
      message: "Password must have 8 to 128 characters.",
    });
  }
  if (input.password_confirmation !== input.password) {
    throw new ValidationError({
      message: "Password confirmation does not match.",
    });
  }
  const tokenHash = digest(input.token);
  const lookup = await database.query({
    text: "SELECT user_id FROM password_recovery_tokens WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()",
    values: [tokenHash],
  });
  if (!lookup.rowCount) throw invalidToken();
  let client;
  try {
    client = await database.getNewClient();
    await client.query("BEGIN");
    // Lock the account before any token so concurrent links cannot both reset it.
    const accounts = await client.query({
      text: "SELECT id, email, password FROM users WHERE id = $1 FOR UPDATE",
      values: [lookup.rows[0].user_id],
    });
    const account = accounts.rows[0];
    const tokens = await client.query({
      text: "SELECT * FROM password_recovery_tokens WHERE token_hash = $1 AND used_at IS NULL AND expires_at > clock_timestamp() FOR UPDATE",
      values: [tokenHash],
    });
    const stored = tokens.rows[0];
    if (
      !account ||
      !stored ||
      stored.email !== account.email.toLowerCase() ||
      stored.password_fingerprint !== digest(account.password)
    )
      throw invalidToken();
    const hashedPassword = await password.hash(input.password);
    await client.query({
      text: "UPDATE users SET password = $2, updated_at = timezone('utc', now()) WHERE id = $1",
      values: [account.id, hashedPassword],
    });
    await client.query({
      text: "UPDATE password_recovery_tokens SET used_at = timezone('utc', now()) WHERE user_id = $1 AND used_at IS NULL",
      values: [account.id],
    });
    await client.query({
      text: "UPDATE sessions SET expires_at = timezone('utc', now()), updated_at = timezone('utc', now()) WHERE user_id = $1 OR impersonated_user_id = $1",
      values: [account.id],
    });
    await client.query("COMMIT");
    return { email: account.email };
  } catch (error) {
    await client?.query("ROLLBACK");
    throw error;
  } finally {
    await client?.end();
  }
}

async function notifyPasswordChanged(account) {
  const content = await renderMessage({
    title: "Sua senha foi alterada",
    paragraphs: [
      "A senha da sua conta no Trama foi redefinida. As sessões anteriores foram encerradas.",
      "Se você não reconhece essa alteração, procure o suporte pelo link de contato do Trama.",
    ],
    actionLabel: "Entrar no Trama",
    actionUrl: `${getOrigin()}/login`,
  });
  await email.send({
    to: account.email,
    subject: "Sua senha do Trama foi alterada",
    ...content,
  });
}

const passwordRecovery = {
  validateRequest,
  request,
  reset,
  notifyPasswordChanged,
};
export default passwordRecovery;
