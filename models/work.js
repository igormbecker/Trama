import database from "infra/database.js";
import { ValidationError, NotFoundError } from "infra/errors.js";
import groupAssignmentStructure from "models/groupAssignmentStructure.js";

function validateInput(input, { allowType = false } = {}) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.keys(input).some(
      (field) =>
        !["title", "description", ...(allowType ? ["type"] : [])].includes(
          field,
        ),
    ) ||
    typeof input.title !== "string" ||
    (input.description !== undefined && typeof input.description !== "string")
  ) {
    throw new ValidationError({ message: "Invalid work data." });
  }
  const title = input.title.trim();
  const description = input.description?.trim() || "";
  if (!title || title.length > 255 || description.length > 5000) {
    throw new ValidationError({ message: "Invalid work data." });
  }
  const type = input.type === undefined ? "literary" : input.type;
  if (allowType && !["literary", "group_assignment"].includes(type)) {
    throw new ValidationError({ message: "Invalid project type." });
  }
  return { title, description, type };
}

async function create(ownerId, input) {
  const { title, description, type } = validateInput(input, {
    allowType: true,
  });
  if (type === "group_assignment") {
    let client;
    try {
      client = await database.getNewClient();
      await client.query("BEGIN");
      const result = await client.query({
        text: `
          INSERT INTO
            works (
              owner_id,
              title,
              description,
              type
            )
          VALUES
            ($1, $2, $3, $4)
          RETURNING
            *
        `,
        values: [ownerId, title, description, type],
      });
      const created = result.rows[0];
      for (const [partIndex, part] of groupAssignmentStructure.entries()) {
        const inserted = await client.query({
          text: `
            INSERT INTO
              work_parts (
                work_id,
                title,
                position
              )
            VALUES
              ($1, $2, $3)
            RETURNING
              id
          `,
          values: [created.id, part.title, partIndex + 1],
        });
        for (const [sectionIndex, section] of part.sections.entries())
          await client.query({
            text: `
              INSERT INTO
                chapters (
                  part_id,
                  title,
                  description,
                  position
                )
              VALUES
                ($1, $2, $3, $4)
            `,
            values: [
              inserted.rows[0].id,
              section.title,
              section.description,
              sectionIndex + 1,
            ],
          });
      }
      await client.query("COMMIT");
      return created;
    } catch (error) {
      await client?.query("ROLLBACK");
      throw error;
    } finally {
      await client?.end();
    }
  }
  const result = await database.query({
    text: `
      INSERT INTO
        works (
          owner_id,
          title,
          description,
          type
        )
      VALUES
        ($1, $2, $3, $4)
      RETURNING
        *
    `,
    values: [ownerId, title, description, type],
  });
  return result.rows[0];
}

async function update(id, userId, input) {
  validateId(id);
  const { title, description } = validateInput(input);
  const result = await database.query({
    text: `
      UPDATE
        works
      SET
        title = $3,
        description = $4,
        updated_at = timezone('utc', now())
      WHERE
        id = $1
        AND owner_id = $2
        AND deleted_at IS NULL
      RETURNING
        *
    `,
    values: [id, userId, title, description],
  });
  if (!result.rowCount) {
    throw new NotFoundError({ message: "Work not found." });
  }
  return result.rows[0];
}

async function findAllForUser(userId) {
  const result = await database.query({
    text: `
      SELECT
        w.*
      FROM
        works w
      WHERE
        w.deleted_at IS NULL
        AND (w.owner_id = $1
            OR EXISTS (
              SELECT
                1
              FROM
                work_participants p
              WHERE
                p.work_id = w.id
                AND p.user_id = $1
                AND p.removed_at IS NULL
            ))
      ORDER BY
        w.created_at DESC,
        w.id DESC
    `,
    values: [userId],
  });
  return result.rows;
}
function validateId(id) {
  if (
    typeof id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    throw new NotFoundError({ message: "Work not found." });
  }
}
async function findOneById(id, userId) {
  validateId(id);
  const result = await database.query({
    text: `
      SELECT
        w.*
      FROM
        works w
      WHERE
        w.id = $1
        AND w.deleted_at IS NULL
        AND (w.owner_id = $2
            OR EXISTS (
              SELECT
                1
              FROM
                work_participants p
              WHERE
                p.work_id = w.id
                AND p.user_id = $2
                AND p.removed_at IS NULL
            ))
    `,
    values: [id, userId],
  });
  if (!result.rowCount) {
    throw new NotFoundError({ message: "Work not found." });
  }
  return result.rows[0];
}
async function requireOwner(id, userId) {
  const storedWork = await findOneById(id, userId);
  if (storedWork.owner_id !== userId) {
    throw new NotFoundError({ message: "Work not found." });
  }
  return storedWork;
}
const work = {
  create,
  update,
  findAllForUser,
  findOneById,
  requireOwner,
  validateId,
};
export default work;
