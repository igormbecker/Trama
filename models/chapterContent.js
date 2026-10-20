import { randomUUID } from "node:crypto";
import database from "infra/database.js";
import work from "models/work.js";
import { NotFoundError, ValidationError, ConflictError } from "infra/errors.js";
import { emptyDocument, validateDocument } from "models/chapterDocument.js";

async function findChapter(workId, chapterId, executor = database) {
  work.validateId(chapterId);
  const result = await executor.query({
    text: `SELECT c.*, p.title AS part_title, p.position AS part_position
    FROM chapters c JOIN work_parts p ON p.id = c.part_id WHERE c.id = $1 AND p.work_id = $2 AND c.deleted_at IS NULL AND p.deleted_at IS NULL`,
    values: [chapterId, workId],
  });
  if (!result.rowCount)
    throw new NotFoundError({ message: "Chapter not found." });
  return result.rows[0];
}

async function read(workId, chapterId, userId) {
  await work.findOneById(workId, userId);
  const chapter = await findChapter(workId, chapterId);
  const result = await database.query({
    text: "SELECT document, revision, updated_at FROM chapter_drafts WHERE chapter_id = $1",
    values: [chapterId],
  });
  return {
    chapter,
    ...(result.rows[0] || {
      document: emptyDocument,
      revision: 0,
      updated_at: null,
    }),
  };
}

function validateInput(input, fields) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.keys(input).some((key) => !fields.includes(key))
  )
    throw new ValidationError({ message: "Invalid draft data." });
  if (
    input.token !== undefined &&
    (typeof input.token !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        input.token,
      ))
  )
    throw new ValidationError({ message: "Invalid editing token." });
}

async function mutate(workId, chapterId, userId, operation) {
  await work.requireOwner(workId, userId);
  let client;
  try {
    client = await database.getNewClient();
    await client.query("BEGIN");
    const locked = await client.query({
      text: "SELECT id FROM works WHERE id = $1 AND owner_id = $2 AND deleted_at IS NULL FOR UPDATE",
      values: [workId, userId],
    });
    if (!locked.rowCount)
      throw new NotFoundError({ message: "Work not found." });
    await findChapter(workId, chapterId, client);
    await client.query({
      text: "INSERT INTO chapter_drafts (chapter_id) VALUES ($1) ON CONFLICT DO NOTHING",
      values: [chapterId],
    });
    const result = await client.query({
      text: "SELECT *, lease_expires_at > clock_timestamp() AS lease_active FROM chapter_drafts WHERE chapter_id = $1 FOR UPDATE",
      values: [chapterId],
    });
    const response = await operation(client, result.rows[0]);
    await client.query("COMMIT");
    return response;
  } catch (error) {
    await client?.query("ROLLBACK");
    throw error;
  } finally {
    await client?.end();
  }
}

async function reserve(workId, chapterId, userId, input) {
  await work.requireOwner(workId, userId);
  validateInput(input, ["token"]);
  return mutate(workId, chapterId, userId, async (client, draft) => {
    if (draft.lease_active && draft.lease_token !== input.token)
      throw new ConflictError("This chapter is being edited in another tab.");
    // An expired token cannot silently reclaim a lease that may have changed hands.
    if (
      input.token &&
      (!draft.lease_active || draft.lease_token !== input.token)
    )
      throw new ConflictError(
        "The editing reservation expired. Reopen the editor.",
      );
    const token = input.token || randomUUID();
    const result = await client.query({
      text: "UPDATE chapter_drafts SET lease_token = $2, lease_expires_at = clock_timestamp() + interval '90 seconds' WHERE chapter_id = $1 RETURNING lease_expires_at",
      values: [chapterId, token],
    });
    return { token, expires_at: result.rows[0].lease_expires_at };
  });
}

async function save(workId, chapterId, userId, input) {
  await work.requireOwner(workId, userId);
  validateInput(input, ["document", "revision", "token"]);
  if (
    !input.token ||
    !Number.isSafeInteger(input.revision) ||
    input.revision < 0
  )
    throw new ValidationError({
      message: "Invalid revision or editing token.",
    });
  validateDocument(input.document);
  return mutate(workId, chapterId, userId, async (client, draft) => {
    if (
      !draft.lease_active ||
      draft.lease_token !== input.token ||
      draft.revision !== input.revision
    )
      throw new ConflictError(
        "The chapter changed or its editing reservation expired. Your pending text must be recovered before continuing.",
      );
    const result = await client.query({
      text: `UPDATE chapter_drafts SET document = $2, revision = revision + 1,
      updated_at = timezone('utc', now()), lease_expires_at = clock_timestamp() + interval '90 seconds'
      WHERE chapter_id = $1 RETURNING revision, updated_at`,
      values: [chapterId, JSON.stringify(input.document)],
    });
    return result.rows[0];
  });
}

async function release(workId, chapterId, userId, input) {
  await work.requireOwner(workId, userId);
  validateInput(input, ["token"]);
  if (!input.token)
    throw new ValidationError({ message: "Editing token required." });
  return mutate(workId, chapterId, userId, async (client) => {
    await client.query({
      text: "UPDATE chapter_drafts SET lease_token = NULL, lease_expires_at = NULL WHERE chapter_id = $1 AND lease_token = $2",
      values: [chapterId, input.token],
    });
  });
}

const chapterContent = { read, reserve, save, release };
export default chapterContent;
