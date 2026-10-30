import { randomUUID } from "node:crypto";
import database from "infra/database.js";
import { ValidationError } from "infra/errors.js";
import { transcribeAudio } from "infra/transcription.js";

async function create(userId, audio, contentType) {
  if (!process.env.GROQ_API_KEY) {
    throw new ValidationError({
      message: "A transcrição ainda não está configurada no Trama.",
    });
  }
  const attemptId = randomUUID();
  let client;
  try {
    client = await database.getNewClient();
    await client.query("BEGIN");
    await client.query(`
      SELECT
        pg_advisory_xact_lock(hashtextextended('trama:voice-transcription', 0))
    `);
    const usageResult = await client.query({
      text: `
        SELECT
          coalesce(sum(accounted_seconds) FILTER (WHERE user_id = $1), 0) AS account_seconds,
          count(*) FILTER (
            WHERE created_at > timezone('utc', now()) - interval '1 minute'
          ) AS minute_attempts,
          count(*) FILTER (
            WHERE created_at > timezone('utc', now()) - interval '1 hour'
          ) AS hourly_attempts,
          count(*) AS daily_attempts
        FROM
          voice_transcription_attempts
        WHERE
          created_at > timezone('utc', now()) - interval '24 hours'
      `,
      values: [userId],
    });
    const usage = usageResult.rows[0];
    // Reserve the longest allowed recording while requests are in flight.
    if (
      Number(usage.account_seconds) + 120 > 1800 ||
      Number(usage.minute_attempts) >= 15 ||
      Number(usage.hourly_attempts) >= 50 ||
      Number(usage.daily_attempts) >= 200
    ) {
      const error = new ValidationError({
        message:
          "O limite de transcrição foi atingido ou não há saldo para reservar até 2 minutos. Preserve seu áudio e tente mais tarde.",
      });
      error.statusCode = 429;
      throw error;
    }
    await client.query({
      text: `
        INSERT INTO
          voice_transcription_attempts (id, user_id, accounted_seconds)
        VALUES
          ($1, $2, 120)
      `,
      values: [attemptId, userId],
    });
    await client.query("COMMIT");
  } catch (error) {
    await client?.query("ROLLBACK");
    throw error;
  } finally {
    await client?.end();
  }
  const result = await transcribeAudio(audio, contentType, {
    includeDuration: true,
  });
  const hasDuration = Number.isFinite(result.duration) && result.duration > 0;
  // Groq has a minimum billed duration of ten seconds per request.
  const accountedSeconds = hasDuration
    ? Math.max(10, Math.min(120, Math.ceil(result.duration)))
    : 120;
  await database.query({
    text: `
      UPDATE
        voice_transcription_attempts
      SET
        accounted_seconds = $2
      WHERE
        id = $1
    `,
    values: [attemptId, accountedSeconds],
  });
  return { text: result.text };
}
const voiceTranscription = { create };
export default voiceTranscription;
