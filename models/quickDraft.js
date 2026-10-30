import { v5 as uuidv5 } from "uuid";
import database from "infra/database.js";
import { validateDocument } from "models/chapterDocument.js";
import { ConflictError, ValidationError } from "infra/errors.js";

function validateInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new ValidationError({ message: "Invalid quick draft data." });
  }

  const allowedFields = ["request_id", "time_zone", "initial_document"];
  const inputFields = Object.keys(input);
  const hasUnknownField = inputFields.some(
    (field) => !allowedFields.includes(field),
  );

  if (hasUnknownField) {
    throw new ValidationError({ message: "Invalid quick draft data." });
  }

  if (typeof input.request_id !== "string") {
    throw new ValidationError({ message: "Invalid quick draft data." });
  }

  const requestIdPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!requestIdPattern.test(input.request_id)) {
    throw new ValidationError({ message: "Invalid quick draft data." });
  }

  if (typeof input.time_zone !== "string") {
    throw new ValidationError({ message: "Invalid quick draft data." });
  }

  if (input.time_zone.length > 100) {
    throw new ValidationError({ message: "Invalid quick draft data." });
  }
}

function createDateFormatter(timeZone) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone,
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
  validateInput(input);
  const dateFormatter = createDateFormatter(input.time_zone);
  if (input.initial_document !== undefined) {
    validateDocument(input.initial_document);
  }

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
      text: `
        SELECT
          pg_advisory_xact_lock(hashtextextended($1, 0))
      `,
      values: [workId],
    });

    const existingWorkResult = await client.query({
      text: `
        SELECT
          owner_id,
          deleted_at
        FROM
          works
        WHERE
          id = $1
        FOR UPDATE
      `,
      values: [workId],
    });

    if (existingWorkResult.rowCount > 0) {
      const existingChapterResult = await client.query({
        text: `
          SELECT
            chapters.id
          FROM
            chapters
          JOIN
            work_parts ON work_parts.id = chapters.part_id
          WHERE
            chapters.id = $1
            AND work_parts.work_id = $2
            AND chapters.deleted_at IS NULL
            AND work_parts.deleted_at IS NULL
        `,
        values: [chapterId, workId],
      });
      const existingWork = existingWorkResult.rows[0];
      const belongsToOwner = existingWork.owner_id === ownerId;
      const isWorkDeleted = Boolean(existingWork.deleted_at);
      const hasActiveChapter = existingChapterResult.rowCount > 0;

      if (!belongsToOwner || isWorkDeleted || !hasActiveChapter) {
        throw new ConflictError("This draft is no longer available.");
      }

      await client.query("COMMIT");

      return { created: false, work_id: workId, chapter_id: chapterId };
    }

    const creationDateResult = await client.query(`
      SELECT
        now() AS created_at
    `);
    const createdAt = creationDateResult.rows[0].created_at;
    const dateParts = dateFormatter.formatToParts(createdAt);

    function getDatePart(partType) {
      const datePart = dateParts.find((part) => part.type === partType);
      return datePart.value;
    }

    const day = getDatePart("day");
    const month = getDatePart("month");
    const year = getDatePart("year");
    const hour = getDatePart("hour");
    const minute = getDatePart("minute");
    const title = `Rascunho sem título — ${day}/${month}/${year} às ${hour}h${minute}`;

    await client.query({
      text: `
        INSERT INTO
          works (
            id,
            owner_id,
            title,
            description,
            type
          )
        VALUES
          ($1, $2, $3, '', 'literary')
      `,
      values: [workId, ownerId, title],
    });
    await client.query({
      text: `
        INSERT INTO
          work_parts (
            id,
            work_id,
            title,
            position
          )
        VALUES
          ($1, $2, 'Parte 1', 1)
      `,
      values: [partId, workId],
    });
    await client.query({
      text: `
        INSERT INTO
          chapters (
            id,
            part_id,
            title,
            description,
            position
          )
        VALUES
          ($1, $2, 'Capítulo sem título', '', 1)
      `,
      values: [chapterId, partId],
    });

    if (input.initial_document !== undefined) {
      await client.query({
        text: `
          INSERT INTO
            chapter_drafts (
              chapter_id,
              document
            )
          VALUES
            ($1, $2)
        `,
        values: [chapterId, JSON.stringify(input.initial_document)],
      });
    }

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
