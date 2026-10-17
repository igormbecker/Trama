export const up = (pgm) => {
  pgm.createTable("work_parts", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    work_id: {
      type: "uuid",
      notNull: true,
      references: "works",
      onDelete: "RESTRICT",
    },
    title: {
      type: "varchar(255)",
      notNull: true,
      check: "length(trim(title)) > 0",
    },
    position: { type: "integer", notNull: true, check: "position > 0" },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });
  pgm.createTable("chapters", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    part_id: {
      type: "uuid",
      notNull: true,
      references: "work_parts",
      onDelete: "RESTRICT",
    },
    title: {
      type: "varchar(255)",
      notNull: true,
      check: "length(trim(title)) > 0",
    },
    description: { type: "varchar(5000)", notNull: true, default: "" },
    position: { type: "integer", notNull: true, check: "position > 0" },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });
  pgm.sql(
    "ALTER TABLE work_parts ADD CONSTRAINT work_parts_position_unique UNIQUE (work_id, position) DEFERRABLE INITIALLY DEFERRED",
  );
  pgm.sql(
    "ALTER TABLE chapters ADD CONSTRAINT chapters_position_unique UNIQUE (part_id, position) DEFERRABLE INITIALLY DEFERRED",
  );
};
exports.down = false;
