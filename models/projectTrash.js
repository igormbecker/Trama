import database from "infra/database.js";
import work from "models/work.js";
import workStructure from "models/workStructure.js";
import { NotFoundError, ValidationError } from "infra/errors.js";

const missing = () => new NotFoundError({ message: "Trash item not found." });
function validateKind(kind) {
  if (!["work", "part", "chapter"].includes(kind)) {
    throw new ValidationError({ message: "Invalid trash item." });
  }
}

async function list(userId) {
  const result = await database.query({
    text: `
      SELECT
        'work' AS kind,
        w.id,
        w.title,
        w.id AS work_id,
        w.title AS work_title,
        w.type AS project_type,
        NULL::text AS parent_title,
        w.deleted_at
      FROM
        works w
      WHERE
        w.owner_id = $1
        AND w.deleted_at IS NOT NULL
      UNION ALL
      SELECT
        'part',
        p.id,
        p.title,
        w.id,
        w.title,
        w.type,
        w.title,
        p.deleted_at
      FROM
        work_parts p
      JOIN
        works w ON w.id = p.work_id
      WHERE
        w.owner_id = $1
        AND w.deleted_at IS NULL
        AND p.deleted_at IS NOT NULL
      UNION ALL
      SELECT
        'chapter',
        c.id,
        c.title,
        w.id,
        w.title,
        w.type,
        p.title,
        c.deleted_at
      FROM
        chapters c
      JOIN
        work_parts p ON p.id = c.part_id
      JOIN
        works w ON w.id = p.work_id
      WHERE
        w.owner_id = $1
        AND w.deleted_at IS NULL
        AND p.deleted_at IS NULL
        AND c.deleted_at IS NOT NULL
      ORDER BY
        deleted_at DESC,
        id
    `,
    values: [userId],
  });
  return result.rows;
}

async function transaction(operation) {
  let client;
  try {
    client = await database.getNewClient();
    await client.query("BEGIN");
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client?.query("ROLLBACK");
    throw error;
  } finally {
    await client?.end();
  }
}

async function mutate(workId, userId, kind, id, restoring, partId) {
  validateKind(kind);
  work.validateId(workId);
  work.validateId(id);
  if (kind === "work" && id !== workId) {
    throw missing();
  }
  return transaction(async (client) => {
    const projects = await client.query({
      text: `
        SELECT
          *
        FROM
          works
        WHERE
          id = $1
          AND owner_id = $2
        FOR UPDATE
      `,
      values: [workId, userId],
    });
    const project = projects.rows[0];
    if (!project || (kind !== "work" && project.deleted_at)) {
      throw missing();
    }
    let item = project;
    if (kind === "part") {
      item = (
        await client.query({
          text: `
            SELECT
              *
            FROM
              work_parts
            WHERE
              id = $1
              AND work_id = $2
          `,
          values: [id, workId],
        })
      ).rows[0];
    } else if (kind === "chapter") {
      item = (
        await client.query({
          text: `
            SELECT
              c.*
            FROM
              chapters c
            JOIN
              work_parts p ON p.id = c.part_id
            WHERE
              c.id = $1
              AND p.work_id = $2
              AND p.deleted_at IS NULL
              AND ($3::uuid IS NULL
                  OR p.id = $3)
          `,
          values: [id, workId, partId || null],
        })
      ).rows[0];
    }
    if (!item || Boolean(item.deleted_at) !== restoring) {
      throw missing();
    }
    const table =
      kind === "work" ? "works" : kind === "part" ? "work_parts" : "chapters";
    await client.query({
      text: `
        UPDATE
          ${table}
        SET
          deleted_at = ${restoring ? "NULL" : "timezone('utc', now())"},
          updated_at = timezone('utc', now())
        WHERE
          id = $1
      `,
      values: [id],
    });
    if (!restoring) {
      // Invalidate both kinds of leases: restoration requires a fresh reservation.
      const chapters = await client.query({
        text: `
          SELECT
            c.id
          FROM
            chapters c
          JOIN
            work_parts p ON p.id = c.part_id
          WHERE
            p.work_id = $1
            AND ($2::uuid IS NULL
                OR p.id = $2)
            AND ($3::uuid IS NULL
                OR c.id = $3)
        `,
        values: [
          workId,
          kind === "part" ? id : null,
          kind === "chapter" ? id : null,
        ],
      });
      const ids = chapters.rows.map((row) => row.id);
      await client.query({
        text: `
          UPDATE
            chapter_drafts
          SET
            lease_token = NULL,
            lease_expires_at = NULL
          WHERE
            chapter_id = ANY($1::uuid [ ])
        `,
        values: [ids],
      });
      await client.query({
        text: `
          UPDATE
            chapter_requests
          SET
            lease_token = NULL,
            lease_expires_at = NULL
          WHERE
            chapter_id = ANY($1::uuid [ ])
        `,
        values: [ids],
      });
    }
    if (kind !== "work") {
      await workStructure.normalizePositions(
        client,
        kind,
        kind === "part" ? workId : item.part_id,
      );
    }
    return { id, kind, work_id: workId };
  });
}

async function restore(userId, input) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.keys(input).length !== 2 ||
    !Object.hasOwn(input, "id") ||
    !Object.hasOwn(input, "kind")
  ) {
    throw new ValidationError({ message: "Invalid trash item." });
  }
  validateKind(input.kind);
  work.validateId(input.id);
  // Resolve the parent without exposing its metadata; authorization is checked under the work lock.
  const result = await database.query({
    text:
      input.kind === "work"
        ? `
          SELECT
            id AS work_id
          FROM
            works
          WHERE
            id = $1
        `
        : input.kind === "part"
          ? `
            SELECT
              work_id
            FROM
              work_parts
            WHERE
              id = $1
          `
          : `
            SELECT
              p.work_id
            FROM
              chapters c
            JOIN
              work_parts p ON p.id = c.part_id
            WHERE
              c.id = $1
          `,
    values: [input.id],
  });
  if (!result.rowCount) {
    throw missing();
  }
  return mutate(result.rows[0].work_id, userId, input.kind, input.id, true);
}

async function removePermanently(userId, input) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.keys(input).length !== 3 ||
    !["kind", "id", "confirmation"].every((key) => Object.hasOwn(input, key)) ||
    typeof input.confirmation !== "string"
  ) {
    throw new ValidationError({
      message: "Confirm the item title before permanent deletion.",
    });
  }
  validateKind(input.kind);
  work.validateId(input.id);
  const parent = await database.query({
    text:
      input.kind === "work"
        ? `
          SELECT
            id AS work_id
          FROM
            works
          WHERE
            id = $1
        `
        : input.kind === "part"
          ? `
            SELECT
              work_id
            FROM
              work_parts
            WHERE
              id = $1
          `
          : `
            SELECT
              p.work_id
            FROM
              chapters c
            JOIN
              work_parts p ON p.id = c.part_id
            WHERE
              c.id = $1
          `,
    values: [input.id],
  });
  if (!parent.rowCount) {
    throw missing();
  }
  const workId = parent.rows[0].work_id;
  return transaction(async (client) => {
    const projects = await client.query({
      text: `
        SELECT
          *
        FROM
          works
        WHERE
          id = $1
          AND owner_id = $2
        FOR UPDATE
      `,
      values: [workId, userId],
    });
    const project = projects.rows[0];
    if (!project || (input.kind !== "work" && project.deleted_at)) {
      throw missing();
    }
    let item = project;
    if (input.kind === "part") {
      item = (
        await client.query({
          text: `
            SELECT
              *
            FROM
              work_parts
            WHERE
              id = $1
              AND work_id = $2
          `,
          values: [input.id, workId],
        })
      ).rows[0];
    }
    if (input.kind === "chapter") {
      item = (
        await client.query({
          text: `
            SELECT
              c.*
            FROM
              chapters c
            JOIN
              work_parts p ON p.id = c.part_id
            WHERE
              c.id = $1
              AND p.work_id = $2
              AND p.deleted_at IS NULL
          `,
          values: [input.id, workId],
        })
      ).rows[0];
    }
    if (!item?.deleted_at) {
      throw missing();
    }
    if (input.confirmation !== item.title) {
      throw new ValidationError({
        message: "Confirm the item title before permanent deletion.",
      });
    }
    const chapters = await client.query({
      text: `
        SELECT
          c.id
        FROM
          chapters c
        JOIN
          work_parts p ON p.id = c.part_id
        WHERE
          p.work_id = $1
          AND ($2::uuid IS NULL
              OR p.id = $2)
          AND ($3::uuid IS NULL
              OR c.id = $3)
      `,
      values: [
        workId,
        input.kind === "part" ? input.id : null,
        input.kind === "chapter" ? input.id : null,
      ],
    });
    const ids = chapters.rows.map((chapter) => chapter.id);
    await client.query({
      text: `
          DELETE
        FROM
          chapter_request_events
        WHERE
          request_id IN (
        SELECT
          id
        FROM
          chapter_requests
        WHERE
          chapter_id = ANY($1::uuid[]))
      `,
      values: [ids],
    });
    await client.query({
      text: `
        DELETE FROM
          chapter_requests
        WHERE
          chapter_id = ANY($1::uuid [ ])
      `,
      values: [ids],
    });
    await client.query({
      text: `
        DELETE FROM
          chapter_drafts
        WHERE
          chapter_id = ANY($1::uuid [ ])
      `,
      values: [ids],
    });
    await client.query({
      text: `
        DELETE FROM
          chapters
        WHERE
          id = ANY($1::uuid [ ])
      `,
      values: [ids],
    });
    if (input.kind !== "chapter") {
      await client.query({
        text: `
          DELETE FROM
            work_parts
          WHERE
            work_id = $1
            AND ($2::uuid IS NULL
                OR id = $2)
        `,
        values: [workId, input.kind === "part" ? input.id : null],
      });
    }
    if (input.kind === "work") {
      await client.query({
        text: `
          DELETE FROM
            work_invitations
          WHERE
            work_id = $1
        `,
        values: [workId],
      });
      await client.query({
        text: `
          DELETE FROM
            work_participants
          WHERE
            work_id = $1
        `,
        values: [workId],
      });
      await client.query({
        text: `
          DELETE FROM
            works
          WHERE
            id = $1
        `,
        values: [workId],
      });
    } else {
      await workStructure.normalizePositions(
        client,
        input.kind,
        input.kind === "part" ? workId : item.part_id,
      );
    }
  });
}

const projectTrash = {
  removePermanently,
  list,
  restore,
  move: (workId, userId, kind, id = workId, partId) =>
    mutate(workId, userId, kind, id, false, partId),
};
export default projectTrash;
