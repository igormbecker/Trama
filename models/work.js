import database from "infra/database.js";
import { ValidationError, NotFoundError } from "infra/errors.js";

async function create(ownerId, input) {
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
  const result = await database.query({
    text: "INSERT INTO works (owner_id, title, description) VALUES ($1, $2, $3) RETURNING *",
    values: [ownerId, title, description],
  });
  return result.rows[0];
}

async function findAllByOwner(ownerId) {
  const result = await database.query({
    text: "SELECT * FROM works WHERE owner_id = $1 ORDER BY created_at DESC, id DESC",
    values: [ownerId],
  });
  return result.rows;
}

async function findOneById(id, ownerId) {
  if (
    typeof id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    throw new NotFoundError({ message: "Work not found." });
  }
  const result = await database.query({
    text: "SELECT * FROM works WHERE id = $1 AND owner_id = $2",
    values: [id, ownerId],
  });
  if (!result.rowCount) {
    throw new NotFoundError({ message: "Work not found." });
  }
  return result.rows[0];
}

const work = { create, findAllByOwner, findOneById };

export default work;
