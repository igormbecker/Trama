import database from "infra/database.js";
import work from "models/work.js";
import { NotFoundError, ValidationError } from "infra/errors.js";

const editorialProgressJoin = `LEFT JOIN LATERAL (
  SELECT jsonb_build_object(
    'kind', r.kind, 'status', r.status, 'review_verdict', r.review_verdict,
    'assignee_name', u.name, 'adjustments_requested', r.adjustment_message IS NOT NULL
  ) AS editorial_request
  FROM chapter_requests r LEFT JOIN users u ON u.id = r.assignee_user_id
  WHERE r.chapter_id = c.id
  ORDER BY CASE WHEN r.status IN ('writing', 'waiting') THEN 0 ELSE 1 END,
    r.created_at DESC, r.id DESC LIMIT 1
) editorial ON true`;

function validateInput(input, isChapter, partial = false) {
  const fields = isChapter ? ["title", "description"] : ["title"];
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    !Object.keys(input).length ||
    Object.keys(input).some((key) => !fields.includes(key)) ||
    (!partial && !Object.hasOwn(input, "title"))
  ) {
    throw new ValidationError({ message: "Invalid structure data." });
  }
  const values = {};
  for (const field of Object.keys(input)) {
    if (typeof input[field] !== "string")
      throw new ValidationError({ message: "Invalid structure data." });
    values[field] = input[field].trim();
    if (
      (field === "title" && (!values[field] || values[field].length > 255)) ||
      (field === "description" && values[field].length > 5000)
    )
      throw new ValidationError({ message: "Invalid structure data." });
  }
  return values;
}
async function findPart(workId, partId, executor = database) {
  work.validateId(partId);
  const result = await executor.query({
    text: "SELECT * FROM work_parts WHERE id = $1 AND work_id = $2",
    values: [partId, workId],
  });
  if (!result.rowCount) throw new NotFoundError({ message: "Part not found." });
  return result.rows[0];
}
async function transaction(workId, userId, operation) {
  await work.requireOwner(workId, userId);
  let client;
  try {
    client = await database.getNewClient();
    await client.query("BEGIN");
    const locked = await client.query({
      text: "SELECT id FROM works WHERE id = $1 AND owner_id = $2 FOR UPDATE",
      values: [workId, userId],
    });
    if (!locked.rowCount)
      throw new NotFoundError({ message: "Work not found." });
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
async function listParts(workId, userId) {
  await work.findOneById(workId, userId);
  return (
    await database.query({
      text: "SELECT * FROM work_parts WHERE work_id = $1 ORDER BY position, id",
      values: [workId],
    })
  ).rows;
}
async function listChapters(workId, partId, userId) {
  await work.findOneById(workId, userId);
  await findPart(workId, partId);
  return (
    await database.query({
      text: `SELECT c.*, editorial.editorial_request FROM chapters c ${editorialProgressJoin} WHERE c.part_id = $1 ORDER BY c.position, c.id`,
      values: [partId],
    })
  ).rows;
}
async function findAll(workId, userId) {
  const parts = await listParts(workId, userId);
  const chapters = await database.query({
    text: `SELECT c.*, editorial.editorial_request FROM chapters c JOIN work_parts p ON p.id = c.part_id ${editorialProgressJoin} WHERE p.work_id = $1 ORDER BY c.position, c.id`,
    values: [workId],
  });
  return parts.map((part) => ({
    ...part,
    chapters: chapters.rows.filter((chapter) => chapter.part_id === part.id),
  }));
}
async function createPart(workId, userId, input) {
  return transaction(workId, userId, async (client) => {
    const values = validateInput(input, false);
    return (
      await client.query({
        text: "INSERT INTO work_parts (work_id, title, position) SELECT $1, $2, COALESCE(MAX(position), 0) + 1 FROM work_parts WHERE work_id = $1 RETURNING *",
        values: [workId, values.title],
      })
    ).rows[0];
  });
}
async function updatePart(workId, partId, userId, input) {
  return transaction(workId, userId, async (client) => {
    await findPart(workId, partId, client);
    const values = validateInput(input, false, true);
    return (
      await client.query({
        text: "UPDATE work_parts SET title = $2, updated_at = timezone('utc', now()) WHERE id = $1 RETURNING *",
        values: [partId, values.title],
      })
    ).rows[0];
  });
}
async function createChapter(workId, partId, userId, input) {
  return transaction(workId, userId, async (client) => {
    await findPart(workId, partId, client);
    const values = validateInput(input, true);
    return (
      await client.query({
        text: "INSERT INTO chapters (part_id, title, description, position) SELECT $1, $2, $3, COALESCE(MAX(position), 0) + 1 FROM chapters WHERE part_id = $1 RETURNING *",
        values: [partId, values.title, values.description || ""],
      })
    ).rows[0];
  });
}
async function updateChapter(workId, partId, chapterId, userId, input) {
  return transaction(workId, userId, async (client) => {
    await findPart(workId, partId, client);
    work.validateId(chapterId);
    const existing = await client.query({
      text: "SELECT * FROM chapters WHERE id = $1 AND part_id = $2",
      values: [chapterId, partId],
    });
    if (!existing.rowCount)
      throw new NotFoundError({ message: "Chapter not found." });
    const values = validateInput(input, true, true);
    return (
      await client.query({
        text: "UPDATE chapters SET title = $2, description = $3, updated_at = timezone('utc', now()) WHERE id = $1 RETURNING *",
        values: [
          chapterId,
          values.title ?? existing.rows[0].title,
          values.description ?? existing.rows[0].description,
        ],
      })
    ).rows[0];
  });
}
async function reorder(workId, userId, input, partId) {
  return transaction(workId, userId, async (client) => {
    if (partId !== undefined) await findPart(workId, partId, client);
    const table = partId === undefined ? "work_parts" : "chapters";
    const parentColumn = partId === undefined ? "work_id" : "part_id";
    const parentId = partId === undefined ? workId : partId;
    const current = await client.query({
      text: `SELECT id FROM ${table} WHERE ${parentColumn} = $1`,
      values: [parentId],
    });
    if (
      !input ||
      typeof input !== "object" ||
      Array.isArray(input) ||
      Object.keys(input).length !== 1 ||
      !Array.isArray(input.ids) ||
      input.ids.length !== current.rowCount ||
      new Set(input.ids).size !== input.ids.length ||
      input.ids.some((id) => !current.rows.some((row) => row.id === id))
    ) {
      throw new ValidationError({ message: "Invalid structure order." });
    }
    for (const [index, id] of input.ids.entries()) {
      await client.query({
        text: `UPDATE ${table} SET position = $2, updated_at = timezone('utc', now()) WHERE id = $1`,
        values: [id, index + 1],
      });
    }
    return (
      await client.query({
        text: `SELECT * FROM ${table} WHERE ${parentColumn} = $1 ORDER BY position, id`,
        values: [parentId],
      })
    ).rows;
  });
}
const workStructure = {
  findAll,
  listParts,
  listChapters,
  createPart,
  updatePart,
  createChapter,
  updateChapter,
  reorder,
};
export default workStructure;
