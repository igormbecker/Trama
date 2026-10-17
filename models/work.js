import database from "infra/database.js";
import { ValidationError, NotFoundError } from "infra/errors.js";

function validateInput(input) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.keys(input).some(
      (field) => !["title", "description"].includes(field),
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
  return { title, description };
}

async function create(ownerId, input) {
  const { title, description } = validateInput(input);
  const result = await database.query({
    text: "INSERT INTO works (owner_id, title, description) VALUES ($1, $2, $3) RETURNING *",
    values: [ownerId, title, description],
  });
  return result.rows[0];
}

async function update(id, userId, input) {
  validateId(id);
  const { title, description } = validateInput(input);
  const result = await database.query({
    text: `UPDATE works SET title = $3, description = $4, updated_at = timezone('utc', now())
      WHERE id = $1 AND owner_id = $2 RETURNING *`,
    values: [id, userId, title, description],
  });
  if (!result.rowCount) throw new NotFoundError({ message: "Work not found." });
  return result.rows[0];
}

async function findAllForUser(userId) {
  const result = await database.query({
    text: `SELECT w.* FROM works w WHERE w.owner_id = $1 OR EXISTS
      (SELECT 1 FROM work_participants p WHERE p.work_id = w.id AND p.user_id = $1 AND p.removed_at IS NULL)
      ORDER BY w.created_at DESC, w.id DESC`,
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
    text: `SELECT w.* FROM works w WHERE w.id = $1 AND (w.owner_id = $2 OR EXISTS
      (SELECT 1 FROM work_participants p WHERE p.work_id = w.id AND p.user_id = $2 AND p.removed_at IS NULL))`,
    values: [id, userId],
  });
  if (!result.rowCount) throw new NotFoundError({ message: "Work not found." });
  return result.rows[0];
}
async function requireOwner(id, userId) {
  const storedWork = await findOneById(id, userId);
  if (storedWork.owner_id !== userId)
    throw new NotFoundError({ message: "Work not found." });
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
