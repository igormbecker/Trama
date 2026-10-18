import database from "infra/database.js";
import session from "models/session.js";
import {
  ForbiddenError,
  UnauthorizedError,
  ValidationError,
} from "infra/errors.js";

async function record(context, event, details = {}, client = database) {
  await client.query({
    text: `INSERT INTO impersonation_audit (administrator_id, represented_user_id, session_id, event, method, path, status_code, expires_at, request_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    values: [
      context.user_id,
      context.impersonated_user_id,
      context.id,
      event,
      details.method || null,
      details.path || null,
      details.status_code || null,
      context.impersonation_expires_at,
      details.request_id || null,
    ],
  });
}

async function status(token) {
  const current = await session.findOneValidByToken(token);
  if (!current.impersonated_user_id) return { active: false };
  const result = await database.query({
    text: "SELECT id, name FROM users WHERE id = $1",
    values: [current.impersonated_user_id],
  });
  return {
    active: true,
    name: result.rows[0]?.name || "Conta indisponível",
    expires_at: current.impersonation_expires_at,
    expired: new Date(current.impersonation_expires_at) <= new Date(),
  };
}

async function change(token, targetId) {
  const stored = await session.findOneValidByToken(token);
  let client;
  try {
    client = await database.getNewClient();
    await client.query("BEGIN");
    const result = await client.query({
      text: "SELECT * FROM sessions WHERE id = $1 AND expires_at > now() FOR UPDATE",
      values: [stored.id],
    });
    const current = result.rows[0];
    if (!current) throw new UnauthorizedError();
    const actors = await client.query({
      text: "SELECT id, is_admin FROM users WHERE id = $1 FOR SHARE",
      values: [current.user_id],
    });
    if (!actors.rows[0]?.is_admin) throw new ForbiddenError();
    if (targetId !== undefined) {
      if (current.impersonated_user_id) throw new ForbiddenError();
      if (
        typeof targetId !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          targetId,
        )
      )
        throw new ValidationError({ message: "Choose a valid user." });
      const targets = await client.query({
        text: "SELECT id, is_admin FROM users WHERE id = $1 FOR SHARE",
        values: [targetId],
      });
      if (
        !targets.rows[0] ||
        targets.rows[0].is_admin ||
        targetId === current.user_id
      )
        throw new ForbiddenError();
      const updated = await client.query({
        text: `UPDATE sessions SET impersonated_user_id = $2,
        impersonation_expires_at = LEAST(expires_at, timezone('utc', now()) + interval '15 minutes'),
        updated_at = timezone('utc', now()) WHERE id = $1 RETURNING *`,
        values: [current.id, targetId],
      });
      await record(updated.rows[0], "started", {}, client);
    } else if (current.impersonated_user_id) {
      await record(current, "ended", {}, client);
      await client.query({
        text: "UPDATE sessions SET impersonated_user_id = NULL, impersonation_expires_at = NULL, updated_at = timezone('utc', now()) WHERE id = $1",
        values: [current.id],
      });
    }
    await client.query("COMMIT");
  } catch (error) {
    await client?.query("ROLLBACK");
    throw error;
  } finally {
    await client?.end();
  }
}

const impersonation = {
  status,
  start: (token, targetId) => change(token, targetId),
  stop: (token) => change(token),
  record,
};
export default impersonation;
