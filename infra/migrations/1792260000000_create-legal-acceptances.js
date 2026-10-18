export const up = (pgm) => {
  pgm.createTable("legal_document_releases", {
    id: { type: "text", primaryKey: true },
    terms: { type: "text", notNull: true },
    privacy: { type: "text", notNull: true },
    terms_hash: { type: "text", notNull: true },
    privacy_hash: { type: "text", notNull: true },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });
  pgm.createTable("legal_acceptances", {
    user_id: {
      type: "uuid",
      notNull: true,
      references: "users",
      onDelete: "CASCADE",
    },
    release_id: {
      type: "text",
      notNull: true,
      references: "legal_document_releases",
      onDelete: "RESTRICT",
    },
    accepted_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });
  pgm.addConstraint("legal_acceptances", "legal_acceptances_pkey", {
    primaryKey: ["user_id", "release_id"],
  });
};
exports.down = false;
