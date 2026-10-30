export const up = (pgm) => {
  pgm.addColumns("voice_transcription_attempts", {
    accounted_seconds: {
      type: "integer",
      notNull: true,
      default: 120,
      check: "accounted_seconds >= 0 AND accounted_seconds <= 120",
    },
  });
};
exports.down = false;
