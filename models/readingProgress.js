import database from "infra/database.js";

export function validPosition(position, blockCount) {
  if (!position) {
    return false;
  }
  if (blockCount === undefined) {
    return Number.isInteger(position.index) && position.index >= 0;
  }
  return (
    Number.isInteger(position.block) &&
    position.block >= 0 &&
    position.block < blockCount &&
    Number.isFinite(position.seconds) &&
    position.seconds >= 0
  );
}

export async function readProgress(userId, workId) {
  const result = await database.query({
    text: `
      SELECT
        slot,
        chapter_id,
        position
      FROM
        reading_progress
      WHERE
        user_id = $1
        AND work_id = $2
    `,
    values: [userId, workId],
  });
  return Object.fromEntries(
    result.rows.map(({ slot, chapter_id, position }) => [
      slot,
      { ...position, chapterId: chapter_id },
    ]),
  );
}

export async function writeProgress(userId, workId, chapterId, slot, position) {
  if (position === null) {
    await database.query({
      text: `
        DELETE FROM
          reading_progress
        WHERE
          user_id = $1
          AND work_id = $2
          AND slot = $3
      `,
      values: [userId, workId, slot],
    });
    return;
  }
  await database.query({
    text: `
      INSERT INTO reading_progress (
        user_id,
        work_id,
        slot,
        chapter_id,
        position
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, work_id, slot)
      DO UPDATE SET
        chapter_id = EXCLUDED.chapter_id,
        position   = EXCLUDED.position
    `,
    values: [userId, workId, slot, chapterId, position],
  });
}
