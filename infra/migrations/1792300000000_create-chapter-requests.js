export const up = (pgm) => {
  pgm.createTable("chapter_requests", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    chapter_id: {
      type: "uuid",
      notNull: true,
      references: "chapters",
      onDelete: "RESTRICT",
    },
    assignee_user_id: {
      type: "uuid",
      references: "users",
      onDelete: "SET NULL",
    },
    kind: {
      type: "varchar(20)",
      notNull: true,
      check: "kind IN ('contribution', 'review')",
    },
    instructions: { type: "text", notNull: true },
    status: {
      type: "varchar(20)",
      notNull: true,
      default: "writing",
      check: "status IN ('writing', 'waiting', 'approved', 'canceled')",
    },
    working_document: { type: "jsonb", notNull: true },
    working_revision: {
      type: "integer",
      notNull: true,
      default: 0,
      check: "working_revision >= 0",
    },
    base_chapter_revision: { type: "integer", notNull: true },
    submitted_document: { type: "jsonb" },
    submitted_at: { type: "timestamptz" },
    adjustment_message: { type: "text" },
    previous_document: { type: "jsonb" },
    previous_revision: { type: "integer" },
    approved_at: { type: "timestamptz" },
    restored_at: { type: "timestamptz" },
    canceled_at: { type: "timestamptz" },
    lease_token: { type: "uuid" },
    lease_expires_at: { type: "timestamptz" },
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
  pgm.createIndex("chapter_requests", "chapter_id", {
    unique: true,
    where: "status IN ('writing', 'waiting')",
    name: "chapter_requests_one_active",
  });
  pgm.createIndex("chapter_requests", ["chapter_id", "created_at"]);
  pgm.createTable("chapter_request_events", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    request_id: {
      type: "uuid",
      notNull: true,
      references: "chapter_requests",
      onDelete: "RESTRICT",
    },
    actor_user_id: { type: "uuid", references: "users", onDelete: "SET NULL" },
    action: {
      type: "varchar(20)",
      notNull: true,
      check:
        "action IN ('submitted', 'adjusted', 'approved', 'canceled', 'restored')",
    },
    message: { type: "text" },
    document: { type: "jsonb" },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });
  pgm.createIndex("chapter_request_events", ["request_id", "created_at"]);
};
exports.down = false;
