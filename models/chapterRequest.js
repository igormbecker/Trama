import { randomUUID } from "node:crypto";
import database from "infra/database.js";
import work from "models/work.js";
import chapterContent from "models/chapterContent.js";
import { validateDocument } from "models/chapterDocument.js";
import { ConflictError, NotFoundError, ValidationError } from "infra/errors.js";

function invalid() {
  return new ValidationError({ message: "Invalid editorial request data." });
}
function unavailable() {
  return new NotFoundError({ message: "Editorial request not found." });
}
function exactInput(input, allowed) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.keys(input).some((key) => !allowed.includes(key))
  )
    throw invalid();
}
function validToken(token) {
  return (
    typeof token === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      token,
    )
  );
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
async function chapterExists(client, workId, chapterId) {
  work.validateId(chapterId);
  const result = await client.query({
    text: "SELECT c.id FROM chapters c JOIN work_parts p ON p.id = c.part_id WHERE c.id = $1 AND p.work_id = $2",
    values: [chapterId, workId],
  });
  if (!result.rowCount) throw unavailable();
}
async function findCurrent(client, chapterId, lock = false) {
  const result = await client.query({
    text: `SELECT * FROM chapter_requests WHERE chapter_id = $1
      ORDER BY CASE WHEN status IN ('writing', 'waiting') THEN 0 ELSE 1 END, created_at DESC, id DESC LIMIT 1 ${lock ? "FOR UPDATE" : ""}`,
    values: [chapterId],
  });
  return result.rows[0] || null;
}
async function assertAccess(workId, chapterId, userId, client, lock = false) {
  work.validateId(workId);
  const access = await client.query({
    text: `SELECT w.owner_id FROM works w WHERE w.id = $1 AND
      (w.owner_id = $2 OR EXISTS (SELECT 1 FROM work_participants p
      WHERE p.work_id = w.id AND p.user_id = $2 AND p.removed_at IS NULL))
      ${lock ? "FOR UPDATE OF w" : ""}`,
    values: [workId, userId],
  });
  if (!access.rowCount) throw unavailable();
  const authorizedWork = access.rows[0];
  await chapterExists(client, workId, chapterId);
  const current = await findCurrent(client, chapterId, lock);
  if (!current) return { authorizedWork, current: null };
  const isOwner = authorizedWork.owner_id === userId;
  if (
    !isOwner &&
    (current.assignee_user_id !== userId ||
      !["writing", "waiting"].includes(current.status))
  )
    throw unavailable();
  return { authorizedWork, current };
}
async function read(workId, chapterId, userId, selectedId) {
  const { authorizedWork, current } = await assertAccess(
    workId,
    chapterId,
    userId,
    database,
  );
  const isOwner = authorizedWork.owner_id === userId;
  let selected = current;
  if (selectedId !== undefined) {
    if (!isOwner) throw unavailable();
    work.validateId(selectedId);
    const result = await database.query({
      text: "SELECT * FROM chapter_requests WHERE id = $1 AND chapter_id = $2",
      values: [selectedId, chapterId],
    });
    if (!result.rowCount) throw unavailable();
    selected = result.rows[0];
  }
  const chapter = await chapterContent.read(workId, chapterId, userId);
  const history = isOwner
    ? (
        await database.query({
          text: "SELECT id, kind, status, created_at, approved_at, restored_at FROM chapter_requests WHERE chapter_id = $1 ORDER BY created_at DESC, id DESC",
          values: [chapterId],
        })
      ).rows
    : [];
  if (!selected) return { chapter: chapter.chapter, request: null, history };
  const events = await database.query({
    text: "SELECT action, message, created_at FROM chapter_request_events WHERE request_id = $1 ORDER BY created_at, id",
    values: [selected.id],
  });
  const { lease_token, ...visible } = selected;
  void lease_token;
  return {
    chapter: chapter.chapter,
    request: { ...visible, events: events.rows },
    document: selected.working_document,
    revision: selected.working_revision,
    history,
    is_owner: isOwner,
  };
}
async function create(workId, chapterId, ownerId, input) {
  exactInput(input, ["assignee_user_id", "kind", "instructions"]);
  work.validateId(input.assignee_user_id);
  if (
    !["contribution", "review"].includes(input.kind) ||
    typeof input.instructions !== "string" ||
    !input.instructions.trim() ||
    input.instructions.length > 5000
  )
    throw invalid();
  await work.requireOwner(workId, ownerId);
  try {
    return await transaction(async (client) => {
      await client.query({
        text: "SELECT id FROM works WHERE id = $1 FOR UPDATE",
        values: [workId],
      });
      await chapterExists(client, workId, chapterId);
      const participant = await client.query({
        text: "SELECT id FROM work_participants WHERE work_id = $1 AND user_id = $2 AND removed_at IS NULL",
        values: [workId, input.assignee_user_id],
      });
      if (!participant.rowCount) throw invalid();
      await client.query({
        text: "INSERT INTO chapter_drafts (chapter_id) VALUES ($1) ON CONFLICT DO NOTHING",
        values: [chapterId],
      });
      const draft = await client.query({
        text: "SELECT document, revision FROM chapter_drafts WHERE chapter_id = $1 FOR UPDATE",
        values: [chapterId],
      });
      const result = await client.query({
        text: `INSERT INTO chapter_requests (chapter_id, assignee_user_id, kind, instructions, working_document, base_chapter_revision)
          VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        values: [
          chapterId,
          input.assignee_user_id,
          input.kind,
          input.instructions.trim(),
          JSON.stringify(draft.rows[0].document),
          draft.rows[0].revision,
        ],
      });
      return result.rows[0];
    });
  } catch (error) {
    if (error.code === "23505")
      throw new ConflictError(
        "This chapter already has an active editorial request.",
      );
    throw error;
  }
}
async function mutate(workId, chapterId, userId, operation) {
  return transaction(async (client) => {
    const { authorizedWork, current } = await assertAccess(
      workId,
      chapterId,
      userId,
      client,
      true,
    );
    if (!current) throw unavailable();
    const result = await operation(
      client,
      current,
      authorizedWork.owner_id === userId,
    );
    return result;
  });
}
async function reserve(workId, chapterId, userId, input) {
  exactInput(input, ["token"]);
  if (input.token !== undefined && !validToken(input.token)) throw invalid();
  return mutate(workId, chapterId, userId, async (client, current, isOwner) => {
    if (isOwner || current.status !== "writing") throw unavailable();
    const active =
      current.lease_expires_at &&
      new Date(current.lease_expires_at) > new Date();
    if (active && current.lease_token !== input.token)
      throw new ConflictError("The editorial draft is open in another tab.");
    if (input.token && (!active || current.lease_token !== input.token))
      throw new ConflictError("The editing reservation expired.");
    const token = input.token || randomUUID();
    const result = await client.query({
      text: "UPDATE chapter_requests SET lease_token = $2, lease_expires_at = clock_timestamp() + interval '90 seconds' WHERE id = $1 RETURNING lease_expires_at",
      values: [current.id, token],
    });
    return { token, expires_at: result.rows[0].lease_expires_at };
  });
}
async function save(workId, chapterId, userId, input) {
  exactInput(input, ["document", "revision", "token"]);
  if (
    !validToken(input.token) ||
    !Number.isSafeInteger(input.revision) ||
    input.revision < 0
  )
    throw invalid();
  validateDocument(input.document);
  return mutate(workId, chapterId, userId, async (client, current, isOwner) => {
    if (isOwner || current.status !== "writing")
      throw new ConflictError("This request is not editable.");
    if (
      current.lease_token !== input.token ||
      !current.lease_expires_at ||
      new Date(current.lease_expires_at) <= new Date() ||
      current.working_revision !== input.revision
    )
      throw new ConflictError(
        "The editorial draft changed or its editing reservation expired.",
      );
    const result = await client.query({
      text: `UPDATE chapter_requests SET working_document = $2, working_revision = working_revision + 1,
        lease_expires_at = clock_timestamp() + interval '90 seconds', updated_at = timezone('utc', now())
        WHERE id = $1 RETURNING working_revision AS revision, updated_at`,
      values: [current.id, JSON.stringify(input.document)],
    });
    return result.rows[0];
  });
}
async function release(workId, chapterId, userId, input) {
  exactInput(input, ["token"]);
  if (!validToken(input.token)) throw invalid();
  return mutate(workId, chapterId, userId, async (client, current, isOwner) => {
    if (isOwner) throw unavailable();
    await client.query({
      text: "UPDATE chapter_requests SET lease_token = NULL, lease_expires_at = NULL WHERE id = $1 AND lease_token = $2",
      values: [current.id, input.token],
    });
  });
}
async function act(workId, chapterId, userId, input) {
  exactInput(input, [
    "action",
    "message",
    "expected_chapter_revision",
    "confirm_conflict",
  ]);
  if (
    !["submit", "adjust", "approve", "cancel", "restore"].includes(input.action)
  )
    throw invalid();
  return mutate(workId, chapterId, userId, async (client, current, isOwner) => {
    if (input.action === "submit") {
      if (isOwner || current.status !== "writing") throw unavailable();
      const result = await client.query({
        text: `UPDATE chapter_requests SET status = 'waiting', submitted_document = working_document,
          submitted_at = timezone('utc', now()), lease_token = NULL, lease_expires_at = NULL,
          adjustment_message = NULL, updated_at = timezone('utc', now()) WHERE id = $1 RETURNING *`,
        values: [current.id],
      });
      await client.query({
        text: "INSERT INTO chapter_request_events (request_id, actor_user_id, action, document) VALUES ($1, $2, 'submitted', $3)",
        values: [current.id, userId, JSON.stringify(current.working_document)],
      });
      return result.rows[0];
    }
    if (!isOwner) throw unavailable();
    if (input.action === "adjust") {
      if (
        current.status !== "waiting" ||
        typeof input.message !== "string" ||
        !input.message.trim() ||
        input.message.length > 5000
      )
        throw invalid();
      const message = input.message.trim();
      const result = await client.query({
        text: "UPDATE chapter_requests SET status = 'writing', adjustment_message = $2, updated_at = timezone('utc', now()) WHERE id = $1 RETURNING *",
        values: [current.id, message],
      });
      await client.query({
        text: "INSERT INTO chapter_request_events (request_id, actor_user_id, action, message) VALUES ($1, $2, 'adjusted', $3)",
        values: [current.id, userId, message],
      });
      return result.rows[0];
    }
    if (input.action === "cancel") {
      if (!["writing", "waiting"].includes(current.status)) throw invalid();
      const result = await client.query({
        text: "UPDATE chapter_requests SET status = 'canceled', canceled_at = timezone('utc', now()), lease_token = NULL, lease_expires_at = NULL, updated_at = timezone('utc', now()) WHERE id = $1 RETURNING *",
        values: [current.id],
      });
      await client.query({
        text: "INSERT INTO chapter_request_events (request_id, actor_user_id, action) VALUES ($1, $2, 'canceled')",
        values: [current.id, userId],
      });
      return result.rows[0];
    }
    if (
      !(input.action === "approve"
        ? current.status === "waiting"
        : current.status === "approved" &&
          current.previous_document &&
          !current.restored_at) ||
      !Number.isSafeInteger(input.expected_chapter_revision) ||
      input.expected_chapter_revision < 0
    )
      throw invalid();
    await client.query({
      text: "INSERT INTO chapter_drafts (chapter_id) VALUES ($1) ON CONFLICT DO NOTHING",
      values: [chapterId],
    });
    const chapter = await client.query({
      text: "SELECT document, revision, lease_expires_at FROM chapter_drafts WHERE chapter_id = $1 FOR UPDATE",
      values: [chapterId],
    });
    const draft = chapter.rows[0];
    if (
      draft.revision !== input.expected_chapter_revision ||
      (draft.lease_expires_at && new Date(draft.lease_expires_at) > new Date())
    )
      throw new ConflictError(
        "The chapter changed or is currently being edited. Review it before approving.",
      );
    if (input.action === "restore") {
      if (
        draft.revision !== current.previous_revision + 1 &&
        input.confirm_conflict !== true
      )
        throw new ConflictError(
          "The chapter changed since approval. Review it before restoring the earlier text.",
        );
      await client.query({
        text: "UPDATE chapter_drafts SET document = $2, revision = revision + 1, updated_at = timezone('utc', now()) WHERE chapter_id = $1",
        values: [chapterId, JSON.stringify(current.previous_document)],
      });
      const restored = await client.query({
        text: "UPDATE chapter_requests SET restored_at = timezone('utc', now()), updated_at = timezone('utc', now()) WHERE id = $1 RETURNING *",
        values: [current.id],
      });
      await client.query({
        text: "INSERT INTO chapter_request_events (request_id, actor_user_id, action, document) VALUES ($1, $2, 'restored', $3)",
        values: [current.id, userId, JSON.stringify(current.previous_document)],
      });
      return restored.rows[0];
    }
    if (
      draft.revision !== current.base_chapter_revision &&
      input.confirm_conflict !== true
    )
      throw new ConflictError(
        "The chapter changed since this request began. Review both texts and confirm replacement.",
      );
    await client.query({
      text: "UPDATE chapter_drafts SET document = $2, revision = revision + 1, updated_at = timezone('utc', now()) WHERE chapter_id = $1",
      values: [chapterId, JSON.stringify(current.submitted_document)],
    });
    const result = await client.query({
      text: "UPDATE chapter_requests SET status = 'approved', previous_document = $2, previous_revision = $3, approved_at = timezone('utc', now()), updated_at = timezone('utc', now()) WHERE id = $1 RETURNING *",
      values: [current.id, JSON.stringify(draft.document), draft.revision],
    });
    await client.query({
      text: "INSERT INTO chapter_request_events (request_id, actor_user_id, action, document) VALUES ($1, $2, 'approved', $3)",
      values: [current.id, userId, JSON.stringify(current.submitted_document)],
    });
    return result.rows[0];
  });
}

const chapterRequest = { read, create, reserve, save, release, act };
export default chapterRequest;
