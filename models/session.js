import { randomBytes } from "node:crypto";
import database from "infra/database.js";
import { UnauthorizedError } from "infra/errors.js";

const SESSION_EXPIRATION_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

async function create(userId) {
  const token = randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_EXPIRATION_IN_MILLISECONDS);

  const results = await database.query({
    text: `
      INSERT INTO
        sessions (token, user_id, expires_at)
      VALUES
        ($1, $2, $3)
      RETURNING
        *
      ;
    `,
    values: [token, userId, expiresAt],
  });

  return results.rows[0];
}

async function findOneValidByToken(token) {
  if (typeof token !== "string" || !/^[a-f0-9]{96}$/.test(token)) {
    throw new UnauthorizedError();
  }

  const results = await database.query({
    text: `
      SELECT
        *
      FROM
        sessions
      WHERE
        token = $1
        AND expires_at > now()
      LIMIT
        1
      ;
    `,
    values: [token],
  });

  if (results.rowCount === 0) {
    throw new UnauthorizedError();
  }

  return results.rows[0];
}

async function expireByToken(token) {
  if (typeof token !== "string" || !/^[a-f0-9]{96}$/.test(token)) {
    return;
  }

  await database.query({
    text: `
      UPDATE
        sessions
      SET
        expires_at = now(),
        updated_at = now()
      WHERE
        token = $1
        AND expires_at > now()
      ;
    `,
    values: [token],
  });
}

const session = {
  create,
  findOneValidByToken,
  expireByToken,
};

export default session;
