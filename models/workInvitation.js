import { randomBytes, createHash } from "node:crypto";
import database from "infra/database.js";
import work from "models/work.js";
import email from "infra/email.js";
import { renderMessage } from "models/transactional/index.js";
import { validateRegistrationInput } from "models/user.js";
import password from "models/password.js";
import { NotFoundError, ValidationError, ServiceError } from "infra/errors.js";

const superseded = Symbol("superseded invitations");

function invitationOrigin() {
  if (
    process.env.TRAMA_TEST_SERVER === "true" ||
    process.env.NODE_ENV === "test"
  )
    return "http://127.0.0.1:3002";
  if (process.env.NODE_ENV === "development") return "http://localhost:3001";
  if (process.env.VERCEL_ENV === "production")
    return "https://trama.bectec.com.br";
  if (
    process.env.VERCEL_ENV === "preview" &&
    /^[a-z0-9-]+\.vercel\.app$/i.test(process.env.VERCEL_URL || "")
  )
    return `https://${process.env.VERCEL_URL}`;
  throw new ServiceError({ message: "Invitation origin is not configured." });
}

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
  const locked = await client.query({
    text: "SELECT id FROM works WHERE id = $1 AND deleted_at IS NULL FOR UPDATE",
    values: [workId],
  });
  if (!locked.rowCount) throw notFound();
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
    const previous = await client.query({
      text: "UPDATE work_invitations SET status = 'canceled', updated_at = now() WHERE work_id = $1 AND email = $2 AND status = 'pending' RETURNING id",
      values: [workId, email],
    });
    const token = randomBytes(48).toString("hex");
    const result = await client.query({
      text: "INSERT INTO work_invitations (work_id, email, token_hash) VALUES ($1, $2, $3) RETURNING *",
      values: [workId, email, hashToken(token)],
    });
    const invitation = { ...toPublic(result.rows[0]), token };
    Object.defineProperty(invitation, superseded, {
      value: previous.rows.map((row) => row.id),
    });
    return invitation;
  });
}
async function undoFailedDelivery(workId, invitation) {
  return transaction(async (client) => {
    await lockWork(client, workId);
    const canceled = await client.query({
      text: "UPDATE work_invitations SET status = 'canceled', updated_at = now() WHERE id = $1 AND status = 'pending' RETURNING id",
      values: [invitation.id],
    });
    if (!canceled.rowCount || !invitation[superseded]?.length) return;
    const pending = await client.query({
      text: "SELECT id FROM work_invitations WHERE work_id = $1 AND email = $2 AND status = 'pending'",
      values: [workId, invitation.email],
    });
    if (pending.rowCount) return;
    await client.query({
      text: "UPDATE work_invitations SET status = 'pending', updated_at = now() WHERE id = ANY($1::uuid[]) AND status = 'canceled' AND expires_at > clock_timestamp()",
      values: [invitation[superseded]],
    });
  });
}
async function createAndSend(workId, ownerId, input) {
  const origin = invitationOrigin();
  const invitedWork = await work.requireOwner(workId, ownerId);
  const projectName =
    invitedWork.type === "group_assignment"
      ? "um trabalho em grupo"
      : "uma obra";
  const projectReference =
    invitedWork.type === "group_assignment" ? "do trabalho" : "da obra";
  const invitation = await create(workId, ownerId, input);
  try {
    const content = await renderMessage({
      title: `Convite para participar de ${projectName}`,
      highlight: invitedWork.title,
      paragraphs: [
        `Você recebeu um convite para participar ${projectReference} ${invitedWork.title} como organizador no Trama.`,
        "O convite vale por sete dias. Se ainda não tiver conta, você poderá criá-la pelo link. Se não esperava este convite, ignore a mensagem.",
      ],
      actionLabel: "Abrir convite",
      actionUrl: `${origin}/invitations/${invitation.token}`,
    });
    await email.send({
      to: invitation.email,
      subject: `Convite para participar de ${projectName} no Trama`,
      ...content,
      idempotencyKey: `invitation/${invitation.id}`,
    });
    const { token, ...publicInvitation } = invitation;
    void token;
    return publicInvitation;
  } catch {
    await undoFailedDelivery(workId, invitation);
    throw new ServiceError({ message: "Invitation email could not be sent." });
  }
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
async function findForRegistration(token, executor = database, lock = false) {
  const result = await executor.query({
    text: `SELECT i.id, i.email, i.work_id, i.expires_at, w.title AS work_title
      FROM work_invitations i JOIN works w ON w.id = i.work_id
      WHERE i.token_hash = $1 AND w.deleted_at IS NULL AND i.status = 'pending' AND i.expires_at > clock_timestamp()
      ${lock ? "FOR UPDATE OF i" : ""}`,
    values: [hashToken(token)],
  });
  if (!result.rowCount) throw notFound();
  return result.rows[0];
}
async function register(token, input) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.keys(input).some(
      (key) =>
        !["name", "username", "password", "password_confirmation"].includes(
          key,
        ),
    ) ||
    input.password !== input.password_confirmation
  )
    throw new ValidationError({ message: "Invalid registration data." });
  const invitation = await findForRegistration(token);
  const values = validateRegistrationInput({
    ...input,
    email: invitation.email,
  });
  const passwordHash = await password.hash(values.password);
  try {
    return await transaction(async (client) => {
      await lockWork(client, invitation.work_id);
      const current = await findForRegistration(token, client, true);
      const existing = await client.query({
        text: "SELECT id FROM users WHERE LOWER(email) = $1",
        values: [current.email],
      });
      if (existing.rowCount) return { email: current.email };
      const created = await client.query({
        text: `INSERT INTO users (name, username, email, password)
          VALUES ($1, $2, $3, $4)
          RETURNING id, name, username, email, created_at, updated_at`,
        values: [values.name, values.username, current.email, passwordHash],
      });
      return { email: created.rows[0].email };
    });
  } catch (error) {
    if (error.code === "23505") {
      const existing = await database.query({
        text: "SELECT id FROM users WHERE LOWER(email) = $1",
        values: [invitation.email],
      });
      if (existing.rowCount) return { email: invitation.email };
      throw new ValidationError({
        message: "Username already in use.",
      });
    }
    throw error;
  }
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
      WHERE i.${column} = $1 AND u.id = $2 AND w.deleted_at IS NULL AND i.status = 'pending' AND i.expires_at > clock_timestamp()
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
      WHERE u.id = $1 AND w.deleted_at IS NULL AND i.status = 'pending' AND i.expires_at > clock_timestamp()
      ORDER BY i.created_at DESC, i.id DESC`,
    values: [userId],
  });
  return result.rows;
}
async function findSentForOwner(userId) {
  const result = await database.query({
    text: `SELECT i.id, i.work_id, i.email, i.status, i.created_at, i.expires_at, i.updated_at, w.title AS work_title
      FROM work_invitations i JOIN works w ON w.id = i.work_id
      WHERE w.owner_id = $1 AND w.deleted_at IS NULL ORDER BY i.created_at DESC, i.id DESC`,
    values: [userId],
  });
  return result.rows.map(toPublic);
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
  createAndSend,
  findAll,
  findForUser,
  findForRegistration,
  register,
  findPendingForAccount,
  findSentForOwner,
  respond,
  respondById,
  cancel,
};
export default workInvitation;
