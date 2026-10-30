import database from "infra/database.js";
import work from "models/work.js";

async function read(workId, userId) {
  const storedWork = await work.findOneById(workId, userId);
  const result = await database.query({
    text: `
      SELECT
        p.id AS part_id,
        p.title AS part_title,
        p.position AS part_position,
        c.id,
        c.title,
        c.position,
        d.document
      FROM
        work_parts p
      JOIN
        chapters c ON c.part_id = p.id
      JOIN
        chapter_drafts d ON d.chapter_id = c.id
      WHERE
        p.work_id = $1
        AND p.deleted_at IS NULL
        AND c.deleted_at IS NULL
        AND d.revision > 0
      ORDER BY
        p.position,
        c.position
    `,
    values: [workId],
  });
  const parts = [];
  for (const row of result.rows) {
    let part = parts[parts.length - 1];
    if (!part || part.id !== row.part_id) {
      part = {
        id: row.part_id,
        title: row.part_title,
        position: row.part_position,
        chapters: [],
      };
      parts.push(part);
    }
    part.chapters.push({
      id: row.id,
      title: row.title,
      position: row.position,
      document: row.document,
    });
  }
  return { work: storedWork, parts };
}
const workReading = { read };
export default workReading;
