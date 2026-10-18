export const up = (pgm) => {
  pgm.addColumns("sessions", {
    // No target foreign key: deleting the target must not restore administrator access.
    impersonated_user_id: { type: "uuid" },
    impersonation_expires_at: { type: "timestamptz" },
  });
  pgm.addConstraint("sessions", "sessions_impersonation_pair", {
    check:
      "(impersonated_user_id IS NULL) = (impersonation_expires_at IS NULL)",
  });
  pgm.createTable("impersonation_audit", {
    id: { type: "bigserial", primaryKey: true },
    administrator_id: { type: "uuid", notNull: true },
    represented_user_id: { type: "uuid", notNull: true },
    session_id: { type: "uuid", notNull: true },
    event: { type: "text", notNull: true },
    request_id: { type: "uuid" },
    method: { type: "text" },
    path: { type: "text" },
    status_code: { type: "integer" },
    expires_at: { type: "timestamptz" },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });
};
exports.down = false;
