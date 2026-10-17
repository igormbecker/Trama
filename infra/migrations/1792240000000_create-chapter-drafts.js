export const up = (pgm) => {
  pgm.createTable("chapter_drafts", {
    chapter_id: {
      type: "uuid",
      primaryKey: true,
      references: "chapters",
      onDelete: "RESTRICT",
    },
    document: {
      type: "jsonb",
      notNull: true,
      default: pgm.func(
        `'{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb`,
      ),
    },
    revision: {
      type: "integer",
      notNull: true,
      default: 0,
      check: "revision >= 0",
    },
    lease_token: { type: "uuid" },
    lease_expires_at: { type: "timestamptz" },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });
};
exports.down = false;
