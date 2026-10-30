import { createHash, randomBytes } from "node:crypto";
import database from "infra/database.js";
import email from "infra/email.js";
import { renderMessage } from "models/transactional/index.js";
import passwordRecovery from "models/passwordRecovery.js";
import { ServiceError, ValidationError } from "infra/errors.js";

const digest = (value) => createHash("sha256").update(value).digest("hex");
const validateRequest = passwordRecovery.validateRequest;

function origin() {
  if (
    process.env.NODE_ENV === "test" ||
    process.env.TRAMA_TEST_SERVER === "true"
  ) {
    return "http://127.0.0.1:3002";
  }
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3001";
  }
  if (process.env.VERCEL_ENV === "production") {
    return "https://trama.bectec.com.br";
  }
  if (
    process.env.VERCEL_ENV === "preview" &&
    /^[a-z0-9-]+\.vercel\.app$/i.test(process.env.VERCEL_URL || "")
  ) {
    return `https://${process.env.VERCEL_URL}`;
  }
  throw new ServiceError({ message: "Verification origin is not configured." });
}

async function request(input) {
  const address = validateRequest(input);
  const base = origin();
  const allowed = await database.query({
    text: `
      INSERT INTO
        email_verification_requests (
          address_hash,
          requested_at,
          window_started_at,
          request_count
        )
      VALUES
        ($1, now(), now(), 1)
      ON CONFLICT
        (address_hash)
      DO UPDATE
      SET
        requested_at = now(),
        window_started_at = CASE WHEN email_verification_requests.window_started_at < now() - interval '1 hour' THEN now() ELSE email_verification_requests.window_started_at END,
        request_count = CASE WHEN email_verification_requests.window_started_at < now() - interval '1 hour' THEN 1 ELSE email_verification_requests.request_count + 1 END
      WHERE
        email_verification_requests.requested_at < now() - interval '1 minute'
        AND (email_verification_requests.window_started_at < now() - interval '1 hour'
            OR email_verification_requests.request_count < 5)
      RETURNING
        address_hash
    `,
    values: [digest(address)],
  });
  if (!allowed.rowCount) {
    return;
  }
  const accounts = await database.query({
    text: `
      SELECT
        id,
        email,
        email_verification_version
      FROM
        users
      WHERE
        LOWER(email) = $1
        AND email_verification_required
        AND email_verified_at IS NULL
    `,
    values: [address],
  });
  const account = accounts.rows[0];
  if (!account) {
    return;
  }
  const token = randomBytes(48).toString("hex");
  const hash = digest(token);
  await database.query({
    text: `
      INSERT INTO
        email_verification_tokens (
          token_hash,
          user_id,
          email,
          verification_version
        )
      VALUES
        ($1, $2, $3, $4)
    `,
    values: [
      hash,
      account.id,
      account.email.toLowerCase(),
      account.email_verification_version,
    ],
  });
  try {
    const content = await renderMessage({
      title: "Confirme seu e-mail",
      paragraphs: [
        "Confirme este endereço para acessar sua conta no Trama.",
        "O link vale por 24 horas e só pode ser usado uma vez. Se você não reconhece este cadastro, ignore esta mensagem.",
      ],
      actionLabel: "Confirmar meu e-mail",
      actionUrl: `${base}/verify-email#token=${token}`,
    });
    await email.send({
      to: account.email,
      subject: "Confirme seu e-mail no Trama",
      ...content,
      idempotencyKey: `verification/${hash}`,
    });
  } catch {
    await database.query({
      text: `
        DELETE FROM
          email_verification_tokens
        WHERE
          token_hash = $1
      `,
      values: [hash],
    });
    throw new ServiceError({
      message: "Verification email could not be sent.",
    });
  }
}

const invalidLink = () =>
  new ValidationError({ message: "Invalid or expired verification link." });

async function confirm(input) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.keys(input).length !== 1 ||
    typeof input.token !== "string" ||
    !/^[a-f0-9]{96}$/.test(input.token)
  ) {
    throw invalidLink();
  }
  const hash = digest(input.token);
  const lookup = await database.query({
    text: `
      SELECT
        user_id
      FROM
        email_verification_tokens
      WHERE
        token_hash = $1
    `,
    values: [hash],
  });
  if (!lookup.rowCount) {
    throw invalidLink();
  }
  let client;
  try {
    client = await database.getNewClient();
    await client.query("BEGIN");
    const accounts = await client.query({
      text: `
        SELECT
          *
        FROM
          users
        WHERE
          id = $1
        FOR UPDATE
      `,
      values: [lookup.rows[0].user_id],
    });
    const tokens = await client.query({
      text: `
        SELECT
          *
        FROM
          email_verification_tokens
        WHERE
          token_hash = $1
          AND used_at IS NULL
          AND expires_at > clock_timestamp()
        FOR UPDATE
      `,
      values: [hash],
    });
    const account = accounts.rows[0];
    const token = tokens.rows[0];
    if (
      !account ||
      !token ||
      account.email_verified_at ||
      account.email.toLowerCase() !== token.email ||
      account.email_verification_version !== token.verification_version
    ) {
      throw invalidLink();
    }
    await client.query({
      text: `
        UPDATE
          users
        SET
          email_verified_at = timezone('utc', now()),
          updated_at = timezone('utc', now())
        WHERE
          id = $1
      `,
      values: [account.id],
    });
    await client.query({
      text: `
        UPDATE
          email_verification_tokens
        SET
          used_at = timezone('utc', now())
        WHERE
          user_id = $1
          AND used_at IS NULL
      `,
      values: [account.id],
    });
    await client.query("COMMIT");
  } catch (error) {
    await client?.query("ROLLBACK");
    throw error;
  } finally {
    await client?.end();
  }
}

function queue(address, waitUntil) {
  waitUntil(
    request({ email: address }).catch(() =>
      console.error("Could not complete email verification delivery."),
    ),
  );
}

const emailVerification = { request, confirm, validateRequest, queue };
export default emailVerification;
