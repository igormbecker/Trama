import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import database from "infra/database.js";

async function reserve(request, email) {
  const onVercel = process.env.VERCEL === "1";
  const secret = process.env.LOGIN_RATE_LIMIT_SECRET;
  const address = onVercel
    ? request.headers["x-vercel-forwarded-for"]
    : request.socket.remoteAddress;

  if ((process.env.NODE_ENV === "production" && !secret) || !isIP(address)) {
    throw new Error("Login rate limit configuration is unavailable.");
  }

  const keySecret = secret || "trama-local-login-rate-limit";

  if (!(await reserveAttempt("ip", address, 30, keySecret))) {
    return false;
  }

  if (typeof email !== "string" || email.length > 254) {
    return true;
  }

  return reserveAttempt("email", email.trim().toLowerCase(), 5, keySecret);
}

async function reserveAttempt(scope, identifier, limit, secret) {
  const key = createHmac("sha256", secret)
    .update(`${scope}:${identifier}`)
    .digest("hex");

  const result = await database.query({
    text: `
      WITH reservation AS (
        INSERT INTO login_attempt_limits (key, attempts, expires_at)
        VALUES ($1, 1, statement_timestamp() + interval '5 minutes')
        ON CONFLICT (key) DO UPDATE SET
          attempts = CASE
            WHEN login_attempt_limits.expires_at <= statement_timestamp() THEN 1
            ELSE login_attempt_limits.attempts + 1
          END,
          expires_at = CASE
            WHEN login_attempt_limits.expires_at <= statement_timestamp()
              THEN EXCLUDED.expires_at
            ELSE login_attempt_limits.expires_at
          END
        WHERE login_attempt_limits.expires_at <= statement_timestamp()
           OR login_attempt_limits.attempts < $2
        RETURNING key
      ),
      expired_keys AS (
        SELECT key
        FROM login_attempt_limits
        WHERE expires_at <= statement_timestamp()
          AND key <> $1
          AND EXISTS (SELECT 1 FROM reservation)
        ORDER BY expires_at
        LIMIT 50
        FOR UPDATE SKIP LOCKED
      ),
      cleanup AS (
        DELETE FROM login_attempt_limits
        WHERE key IN (SELECT key FROM expired_keys)
      )
      SELECT key FROM reservation;
    `,
    values: [key, limit],
  });

  return result.rowCount === 1;
}

export default { reserve };
