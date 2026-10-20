export const up = (pgm) => {
  pgm.addColumns("users", {
    email_verification_required: {
      type: "boolean",
      notNull: true,
      default: false,
    },
    email_verified_at: { type: "timestamptz" },
    email_verification_version: { type: "integer", notNull: true, default: 0 },
  });
  // Existing accounts are exempt, not falsely marked as verified.
  pgm.alterColumn("users", "email_verification_required", { default: true });
  pgm.sql(`CREATE FUNCTION reset_email_verification() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      IF LOWER(NEW.email) IS DISTINCT FROM LOWER(OLD.email) THEN
        NEW.email_verified_at := NULL;
        NEW.email_verification_required := true;
        NEW.email_verification_version := OLD.email_verification_version + 1;
      END IF;
      RETURN NEW;
    END;
  $$;
  CREATE TRIGGER users_reset_email_verification BEFORE UPDATE OF email ON users
    FOR EACH ROW EXECUTE FUNCTION reset_email_verification();`);
  pgm.createTable("email_verification_requests", {
    address_hash: { type: "text", primaryKey: true },
    requested_at: { type: "timestamptz", notNull: true },
    window_started_at: { type: "timestamptz", notNull: true },
    request_count: { type: "integer", notNull: true },
  });
  pgm.createTable("email_verification_tokens", {
    token_hash: { type: "text", primaryKey: true },
    user_id: {
      type: "uuid",
      notNull: true,
      references: "users",
      onDelete: "CASCADE",
    },
    email: { type: "varchar(254)", notNull: true },
    verification_version: { type: "integer", notNull: true },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
    expires_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now()) + interval '24 hours'"),
    },
    used_at: { type: "timestamptz" },
  });
  pgm.createIndex("email_verification_tokens", "user_id");
};
exports.down = false;
