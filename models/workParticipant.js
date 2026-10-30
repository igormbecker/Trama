import database from "infra/database.js";
import work from "models/work.js";
import { NotFoundError, ValidationError } from "infra/errors.js";

async function findAll(workId, ownerId) {
  await work.requireOwner(workId, ownerId);
  const result = await database.query({
    text: `
      SELECT
        p.user_id,
        p.role,
        p.created_at,
        u.name
      FROM
        work_participants p
      JOIN
        users u ON u.id = p.user_id
      WHERE
        p.work_id = $1
        AND p.removed_at IS NULL
      ORDER BY
        LOWER(u.name),
        p.id
    `,
    values: [workId],
  });
  return result.rows;
}
async function remove(workId, userId, ownerId) {
  await work.requireOwner(workId, ownerId);
  work.validateId(userId);
  if (userId === ownerId) {
    throw new ValidationError({ message: "The owner cannot be removed." });
  }
  let client;
  try {
    client = await database.getNewClient();
    await client.query("BEGIN");
    const locked = await client.query({
      text: `
        SELECT
          id
        FROM
          works
        WHERE
          id = $1
          AND deleted_at IS NULL
        FOR UPDATE
      `,
      values: [workId],
    });
    if (!locked.rowCount) {
      throw new NotFoundError({ message: "Work not found." });
    }
    const result = await client.query({
      text: `
        UPDATE
          work_participants
        SET
          removed_at = now()
        WHERE
          work_id = $1
          AND user_id = $2
          AND removed_at IS NULL
        RETURNING
          id
      `,
      values: [workId, userId],
    });
    if (!result.rowCount) {
      throw new NotFoundError({ message: "Participant not found." });
    }
    await client.query("COMMIT");
  } catch (error) {
    await client?.query("ROLLBACK");
    throw error;
  } finally {
    await client?.end();
  }
}
const workParticipant = { findAll, remove };
export default workParticipant;
