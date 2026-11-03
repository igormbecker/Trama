export const up = (pgm) => {
  pgm.createTable("login_attempt_limits", {
    key: { type: "text", primaryKey: true },
    attempts: { type: "integer", notNull: true },
    expires_at: { type: "timestamptz", notNull: true },
  });
  pgm.createIndex("login_attempt_limits", "expires_at");
};
