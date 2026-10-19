export const up = (pgm) => {
  pgm.createTable("work_credits", {
    work_id: {
      type: "uuid",
      primaryKey: true,
      references: "works",
      onDelete: "CASCADE",
    },
    document: { type: "jsonb", notNull: true },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });
};
exports.down = false;
