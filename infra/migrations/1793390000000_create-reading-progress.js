export const up = (pgm) => {
  pgm.createTable("reading_progress", {
    user_id: {
      type: "uuid",
      notNull: true,
      references: "users",
      onDelete: "CASCADE",
    },
    work_id: {
      type: "uuid",
      notNull: true,
      references: "works",
      onDelete: "CASCADE",
    },
    chapter_id: {
      type: "uuid",
      notNull: true,
      references: "chapters",
      onDelete: "CASCADE",
    },
    slot: { type: "text", notNull: true },
    position: { type: "jsonb", notNull: true },
  });
  pgm.addConstraint("reading_progress", "reading_progress_pkey", {
    primaryKey: ["user_id", "work_id", "slot"],
  });
};
exports.down = false;
