import { randomBytes, createHash } from "node:crypto";
import database from "infra/database.js";
import work from "models/work.js";
import { NotFoundError, ValidationError } from "infra/errors.js";

function notFound() {
  return new NotFoundError({ message: "Invitation not found or unavailable." });
}
function hashToken(token) {
  if (typeof token !== "string" || !/^[a-f0-9]{96}$/.test(token))
    throw notFound();
  return createHash("sha256").update(token).digest("hex");
}
function toPublic(invitation) {
  const { token_hash, ...values } = invitation;
  void token_hash;
  return {
    ...values,
    status:
      values.status === "pending" &&
      new Date(values.expires_at).getTime() <= Date.now()
        ? "expired"
        : values.status,
  };
}
async function transaction(operation) {
  let client;
  try {
    client = await database.getNewClient();
    await client.query("BEGIN");
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client?.query("ROLLBACK");
    throw error;
  } finally {
    await client?.end();
  }
}
async function lockWork(client, workId) {
  await client.query({
    text: "SELECT id FROM works WHERE id = $1 FOR UPDATE",
    values: [workId],
  });
}
async function create(workId, ownerId, input) {
  await work.requireOwner(workId, ownerId);
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.keys(input).some((key) => key !== "email") ||
    typeof input.email !== "string"
  ) {
    throw new ValidationError({ message: "Invalid invitation email." });
  }
  const email = input.email.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ValidationError({ message: "Invalid invitation email." });
  }
  return transaction(async (client) => {
    await lockWork(client, workId);
    const existing = await client.query({
      text: `SELECT u.id FROM users u WHERE LOWER(u.email) = $2 AND
        (u.id = $3 OR EXISTS (SELECT 1 FROM work_participants p WHERE p.work_id = $1 AND p.user_id = u.id AND p.removed_at IS NULL))`,
      values: [workId, email, ownerId],
    });
    if (existing.rowCount)
      throw new ValidationError({
        message: "This account already participates in the work.",
      });
    await client.query({
      text: "UPDATE work_invitations SET status = 'canceled', updated_at = now() WHERE work_id = $1 AND email = $2 AND status = 'pending'",
      values: [workId, email],
    });
    const token = randomBytes(48).toString("hex");
    const result = await client.query({
      text: "INSERT INTO work_invitations (work_id, email, token_hash) VALUES ($1, $2, $3) RETURNING *",
      values: [workId, email, hashToken(token)],
    });
    return { ...toPublic(result.rows[0]), token };
  });
}
async function findAll(workId, ownerId) {
  await work.requireOwner(workId, ownerId);
  const result = await database.query({
    text: "SELECT * FROM work_invitations WHERE work_id = $1 ORDER BY created_at DESC, id",
    values: [workId],
  });
  return result.rows.map(toPublic);
}
async function findForUser(token, userId, executor = database, lock = false) {
  return findPendingForUser(
    "token_hash",
    hashToken(token),
    userId,
    executor,
    lock,
  );
}
async function findByIdForUser(id, userId, executor = database, lock = false) {
  if (
    typeof id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
    throw notFound();
  return findPendingForUser("id", id, userId, executor, lock);
}
async function findPendingForUser(column, value, userId, executor, lock) {
  const result = await executor.query({
    text: `SELECT i.*, w.title AS work_title FROM work_invitations i JOIN works w ON w.id = i.work_id
      JOIN users u ON LOWER(u.email) = i.email
      WHERE i.${column} = $1 AND u.id = $2 AND i.status = 'pending' AND i.expires_at > clock_timestamp()
      ${lock ? "FOR UPDATE OF i" : ""}`,
    values: [value, userId],
  });
  if (!result.rowCount) throw notFound();
  return toPublic(result.rows[0]);
}
async function findPendingForAccount(userId) {
  const result = await database.query({
    text: `SELECT i.id, i.work_id, w.title AS work_title, 'organizer' AS role, i.created_at, i.expires_at
      FROM work_invitations i JOIN works w ON w.id = i.work_id
      JOIN users u ON LOWER(u.email) = i.email
      WHERE u.id = $1 AND i.status = 'pending' AND i.expires_at > clock_timestamp()
      ORDER BY i.created_at DESC, i.id DESC`,
    values: [userId],
  });
  return result.rows;
}
async function respond(token, userId, input) {
  return respondToReference(token, userId, input, findForUser);
}
async function respondById(id, userId, input) {
  return respondToReference(id, userId, input, findByIdForUser);
}
async function respondToReference(reference, userId, input, findInvitation) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.keys(input).length !== 1 ||
    !["accept", "decline"].includes(input.action)
  ) {
    throw new ValidationError({ message: "Invalid invitation action." });
  }
  const invitation = await findInvitation(reference, userId);
  return transaction(async (client) => {
    await lockWork(client, invitation.work_id);
    await findInvitation(reference, userId, client, true);
    if (input.action === "accept") {
      await client.query({
        text: `INSERT INTO work_participants (work_id, user_id) VALUES ($1, $2)
          ON CONFLICT (work_id, user_id) DO UPDATE SET removed_at = NULL`,
        values: [invitation.work_id, userId],
      });
    }
    const result = await client.query({
      text: "UPDATE work_invitations SET status = $2, updated_at = now() WHERE id = $1 RETURNING *",
      values: [
        invitation.id,
        input.action === "accept" ? "accepted" : "declined",
      ],
    });
    return toPublic(result.rows[0]);
  });
}
async function cancel(workId, invitationId, ownerId) {
  await work.requireOwner(workId, ownerId);
  work.validateId(invitationId);
  return transaction(async (client) => {
    await lockWork(client, workId);
    const result = await client.query({
      text: "UPDATE work_invitations SET status = 'canceled', updated_at = now() WHERE id = $1 AND work_id = $2 AND status = 'pending' RETURNING id",
      values: [invitationId, workId],
    });
    if (!result.rowCount) throw notFound();
  });
}
const workInvitation = {
  create,
  findAll,
  findForUser,
  findPendingForAccount,
  respond,
  respondById,
  cancel,
};
export default workInvitation;
