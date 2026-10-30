import { v5 as uuidv5 } from "uuid";
import database from "infra/database.js";
import { ConflictError, ValidationError } from "infra/errors.js";

function validateInput(input) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.keys(input).some(
      (key) => !["request_id", "time_zone"].includes(key),
    ) ||
    typeof input.request_id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      input.request_id,
    ) ||
    typeof input.time_zone !== "string" ||
    input.time_zone.length > 100
  ) {
    throw new ValidationError({ message: "Invalid quick draft data." });
  }
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: input.time_zone,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
  } catch {
    throw new ValidationError({ message: "Invalid time zone." });
  }
}

async function create(ownerId, input) {
  const formatter = validateInput(input);
  // Stable UUIDs make retries account-specific without adding draft-only schema.
  const workId = uuidv5(input.request_id.toLowerCase(), ownerId);
  const partId = uuidv5("part", workId);
  const chapterId = uuidv5("chapter", workId);
  let client;
  try {
    client = await database.getNewClient();
    await client.query("BEGIN");
    // Serialize the first insert too: a row lock alone cannot lock an absent work.
    await client.query({
      text: "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
      values: [workId],
    });
    const existing = await client.query({
      text: "SELECT owner_id, deleted_at FROM works WHERE id = $1 FOR UPDATE",
      values: [workId],
    });
    if (existing.rowCount) {
      const chapter = await client.query({
        text: `SELECT c.id FROM chapters c JOIN work_parts p ON p.id = c.part_id
          WHERE c.id = $1 AND p.work_id = $2 AND c.deleted_at IS NULL AND p.deleted_at IS NULL`,
        values: [chapterId, workId],
      });
      if (
        existing.rows[0].owner_id !== ownerId ||
        existing.rows[0].deleted_at ||
        !chapter.rowCount
      )
        throw new ConflictError("This draft is no longer available.");
      await client.query("COMMIT");
      return { created: false, work_id: workId, chapter_id: chapterId };
    }
    const date = (await client.query("SELECT now() AS created_at")).rows[0]
      .created_at;
    const parts = formatter.formatToParts(date);
    const value = (type) => parts.find((part) => part.type === type).value;
    const title = `Rascunho sem título — ${value("day")}/${value("month")}/${value("year")} às ${value("hour")}h${value("minute")}`;
    await client.query({
      text: "INSERT INTO works (id, owner_id, title, description, type) VALUES ($1, $2, $3, '', 'literary')",
      values: [workId, ownerId, title],
    });
    await client.query({
      text: "INSERT INTO work_parts (id, work_id, title, position) VALUES ($1, $2, 'Parte 1', 1)",
      values: [partId, workId],
    });
    await client.query({
      text: "INSERT INTO chapters (id, part_id, title, description, position) VALUES ($1, $2, 'Capítulo sem título', '', 1)",
      values: [chapterId, partId],
    });
    await client.query("COMMIT");
    return { created: true, work_id: workId, chapter_id: chapterId };
  } catch (error) {
    await client?.query("ROLLBACK");
    throw error;
  } finally {
    await client?.end();
  }
}
const quickDraft = { create };
export default quickDraft;
