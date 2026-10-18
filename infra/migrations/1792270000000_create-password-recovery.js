export const up = (pgm) => {
  pgm.createTable("password_recovery_requests", {
    address_hash: { type: "text", primaryKey: true },
    requested_at: { type: "timestamptz", notNull: true },
    window_started_at: { type: "timestamptz", notNull: true },
    request_count: { type: "integer", notNull: true },
  });
  pgm.createTable("password_recovery_tokens", {
    token_hash: { type: "text", primaryKey: true },
    user_id: {
      type: "uuid",
      notNull: true,
      references: "users",
      onDelete: "CASCADE",
    },
    email: { type: "varchar(254)", notNull: true },
    password_fingerprint: { type: "text", notNull: true },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
    expires_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now()) + interval '15 minutes'"),
    },
    used_at: { type: "timestamptz" },
  });
  pgm.createIndex("password_recovery_tokens", "user_id");
};

exports.down = false;
