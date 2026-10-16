export const up = (pgm) => {
  pgm.createTable("work_participants", {
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
    user_id: { type: "uuid", references: "users", onDelete: "SET NULL" },
    role: {
      type: "varchar(20)",
      notNull: true,
      default: "organizer",
      check: "role = 'organizer'",
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
    removed_at: { type: "timestamptz" },
  });
  pgm.addConstraint("work_participants", "work_participants_work_user_unique", {
    unique: ["work_id", "user_id"],
  });
  pgm.createIndex("work_participants", "user_id");
  pgm.createTable("work_invitations", {
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
    email: { type: "varchar(254)", notNull: true },
    token_hash: { type: "varchar(64)", notNull: true, unique: true },
    status: {
      type: "varchar(20)",
      notNull: true,
      default: "pending",
      check: "status IN ('pending', 'accepted', 'declined', 'canceled')",
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
    expires_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now()) + interval '7 days'"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });
  pgm.createIndex("work_invitations", "work_id");
  pgm.createIndex("work_invitations", ["work_id", "email"], {
    unique: true,
    where: "status = 'pending'",
  });
};
exports.down = false;
