export const up = (pgm) => {
  pgm.createTable("voice_transcription_attempts", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    user_id: {
      type: "uuid",
      notNull: true,
      references: "users",
      onDelete: "CASCADE",
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });
  pgm.createIndex("voice_transcription_attempts", ["created_at"]);
  pgm.createIndex("voice_transcription_attempts", ["user_id", "created_at"]);
};
exports.down = false;
