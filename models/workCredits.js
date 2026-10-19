import database from "infra/database";
import work from "models/work";
import { ValidationError } from "infra/errors";

const groups = ["authors", "contributors", "reviewers"];
const emptyCredits = () => ({ authors: [], contributors: [], reviewers: [] });
function validate(input) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.keys(input).length !== 3 ||
    Object.keys(input).some((key) => !groups.includes(key))
  )
    throw new ValidationError({ message: "Invalid work credits." });
  const credits = emptyCredits();
  for (const group of groups) {
    if (
      !Array.isArray(input[group]) ||
      input[group].length > 50 ||
      input[group].some(
        (line) =>
          typeof line !== "string" ||
          !line.trim() ||
          line.length > (group === "authors" ? 255 : 1000) ||
          Array.from(line).some((character) => character.charCodeAt(0) < 32),
      )
    )
      throw new ValidationError({
        message:
          "Use up to 50 credit lines per group, with up to 255 characters per author and 1000 per contribution or review.",
      });
    credits[group] = [...new Set(input[group].map((line) => line.trim()))];
  }
  return credits;
}
async function findConfirmed(workId) {
  const result = await database.query({
    text: "SELECT document FROM work_credits WHERE work_id = $1",
    values: [workId],
  });
  return result.rows[0]?.document || emptyCredits();
}
async function read(workId, userId) {
  await work.requireOwner(workId, userId);
  const credits = await findConfirmed(workId);
  const result = await database.query({
    text: `SELECT DISTINCT r.kind, u.name, c.title FROM chapter_requests r
      JOIN users u ON u.id = r.assignee_user_id JOIN chapters c ON c.id = r.chapter_id
      JOIN work_parts p ON p.id = c.part_id WHERE p.work_id = $1
      AND r.status = 'approved' AND (r.kind = 'review' OR r.restored_at IS NULL)
      ORDER BY u.name, c.title`,
    values: [workId],
  });
  const suggestions = emptyCredits();
  for (const row of result.rows)
    suggestions[row.kind === "review" ? "reviewers" : "contributors"].push(
      `${row.name} — ${row.title}`,
    );
  return { credits, suggestions };
}
async function update(workId, userId, input) {
  await work.requireOwner(workId, userId);
  const credits = validate(input);
  await database.query({
    text: "INSERT INTO work_credits (work_id, document) VALUES ($1, $2) ON CONFLICT (work_id) DO UPDATE SET document = EXCLUDED.document, updated_at = timezone('utc', now())",
    values: [workId, JSON.stringify(credits)],
  });
  return credits;
}
const workCredits = { read, update, findConfirmed };
export default workCredits;
