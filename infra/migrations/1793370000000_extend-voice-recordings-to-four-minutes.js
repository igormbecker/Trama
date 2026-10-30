export const up = (pgm) => {
  pgm.dropConstraint(
    "voice_transcription_attempts",
    "voice_transcription_attempts_accounted_seconds_check",
  );
  pgm.addConstraint(
    "voice_transcription_attempts",
    "voice_transcription_attempts_accounted_seconds_check",
    {
      check: "accounted_seconds >= 0 AND accounted_seconds <= 240",
    },
  );
  pgm.alterColumn("voice_transcription_attempts", "accounted_seconds", {
    default: 240,
  });
};
exports.down = false;
