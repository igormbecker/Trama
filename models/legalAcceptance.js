import { createHash } from "node:crypto";
import database from "infra/database.js";
import release from "infra/legal/2026-10-18-v1.json";
import {
  ValidationError,
  ForbiddenError,
  LegalAcceptanceRequiredError,
  NotFoundError,
} from "infra/errors.js";

const digest = (text) =>
  createHash("sha256").update(text, "utf8").digest("hex");
const currentRelease = {
  ...release,
  terms_hash: digest(release.terms),
  privacy_hash: digest(release.privacy),
};
function isEnabled() {
  return process.env.LEGAL_ACCEPTANCE_ENABLED === undefined
    ? currentRelease.enabled
    : process.env.LEGAL_ACCEPTANCE_ENABLED === "true";
}
async function status(userId) {
  const result = await database.query({
    text: `
      SELECT
        a.accepted_at
      FROM
        legal_acceptances a
      JOIN
        legal_document_releases r ON r.id = a.release_id
      WHERE
        a.user_id = $1
        AND a.release_id = $2
        AND r.terms_hash = $3
        AND r.privacy_hash = $4
    `,
    values: [
      userId,
      currentRelease.id,
      currentRelease.terms_hash,
      currentRelease.privacy_hash,
    ],
  });
  return {
    enabled: isEnabled(),
    required: isEnabled() && !result.rowCount,
    release_id: currentRelease.id,
    accepted_at: result.rows[0]?.accepted_at?.toISOString() || null,
  };
}
async function assertAccepted(userId, { enabled = isEnabled() } = {}) {
  if (!enabled) {
    return;
  }
  if ((await status(userId)).accepted_at === null) {
    throw new LegalAcceptanceRequiredError();
  }
}
async function accept(currentUser, input) {
  if (currentUser.impersonation) {
    throw new ForbiddenError();
  }
  if (
    !input ||
    input.accepted !== true ||
    input.release_id !== currentRelease.id ||
    Object.keys(input).some((key) => !["accepted", "release_id"].includes(key))
  ) {
    throw new ValidationError({
      message: "Review and explicitly accept the current documents.",
    });
  }
  let client;
  try {
    client = await database.getNewClient();
    await client.query("BEGIN");
    await client.query({
      text: `
        INSERT INTO
          legal_document_releases (
            id,
            terms,
            privacy,
            terms_hash,
            privacy_hash
          )
        VALUES
          ($1, $2, $3, $4, $5)
        ON CONFLICT
          (id) DO NOTHING
      `,
      values: [
        currentRelease.id,
        currentRelease.terms,
        currentRelease.privacy,
        currentRelease.terms_hash,
        currentRelease.privacy_hash,
      ],
    });
    const stored = await client.query({
      text: `
        SELECT
          terms_hash,
          privacy_hash
        FROM
          legal_document_releases
        WHERE
          id = $1
      `,
      values: [currentRelease.id],
    });
    if (
      stored.rows[0].terms_hash !== currentRelease.terms_hash ||
      stored.rows[0].privacy_hash !== currentRelease.privacy_hash
    ) {
      throw new ValidationError({
        message: "This release is immutable. Publish a new version.",
      });
    }
    await client.query({
      text: `
        INSERT INTO
          legal_acceptances (
            user_id,
            release_id
          )
        VALUES
          ($1, $2)
        ON CONFLICT
          (user_id, release_id) DO NOTHING
      `,
      values: [currentUser.id, currentRelease.id],
    });
    await client.query("COMMIT");
    return await status(currentUser.id);
  } catch (error) {
    await client?.query("ROLLBACK");
    throw error;
  } finally {
    await client?.end();
  }
}
async function document(kind, version = currentRelease.id) {
  if (
    !["terms", "privacy"].includes(kind) ||
    typeof version !== "string" ||
    version.length > 100
  ) {
    throw new NotFoundError({ message: "Document not found." });
  }
  if (version === currentRelease.id) {
    return { id: version, content: currentRelease[kind] };
  }
  const result = await database.query({
    text: `
      SELECT
        id,
        terms,
        privacy
      FROM
        legal_document_releases
      WHERE
        id = $1
    `,
    values: [version],
  });
  if (!result.rowCount) {
    throw new NotFoundError({ message: "Document not found." });
  }
  return { id: version, content: result.rows[0][kind] };
}
const legalAcceptance = {
  currentRelease,
  isEnabled,
  status,
  assertAccepted,
  accept,
  document,
};
export default legalAcceptance;
