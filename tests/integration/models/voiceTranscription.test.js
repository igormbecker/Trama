import orchestrator from "tests/orchestrator";
import database from "infra/database";
import voiceTranscription from "models/voiceTranscription";
import { transcribeAudio } from "infra/transcription";
jest.mock("infra/transcription", () => ({ transcribeAudio: jest.fn() }));
const originalKey = process.env.GROQ_API_KEY;
beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDataBase();
  await orchestrator.runPendingMigrations();
  process.env.GROQ_API_KEY = "synthetic-key";
});
afterAll(() => {
  if (originalKey === undefined) {
    delete process.env.GROQ_API_KEY;
  } else {
    process.env.GROQ_API_KEY = originalKey;
  }
});
beforeEach(() => {
  transcribeAudio
    .mockReset()
    .mockResolvedValue({ text: "Ideia.", duration: 10 });
});
test("Allows multiple short transcriptions and accounts for their actual duration", async () => {
  const account = await orchestrator.createUser({});
  for (let index = 0; index < 4; index++) {
    await voiceTranscription.create(
      account.id,
      Buffer.from("synthetic"),
      "audio/webm",
    );
  }
  const result = await database.query({
    text: `
      SELECT
        count(*) AS attempts,
        sum(accounted_seconds) AS seconds
      FROM
        voice_transcription_attempts
      WHERE
        user_id = $1
    `,
    values: [account.id],
  });
  expect(Number(result.rows[0].attempts)).toBe(4);
  expect(Number(result.rows[0].seconds)).toBe(40);
});
test("Concurrent reservations cannot exceed thirty minutes per account", async () => {
  const account = await orchestrator.createUser({});
  await database.query({
    text: `
      INSERT INTO
        voice_transcription_attempts (user_id, accounted_seconds, created_at)
      SELECT
        $1,
        120,
        timezone('utc', now()) - interval '2 hours'
      FROM
        generate_series(1, 14)
    `,
    values: [account.id],
  });
  let release;
  const waiting = new Promise((resolve) => {
    release = resolve;
  });
  transcribeAudio.mockImplementation(async () => {
    await waiting;
    return { text: "Ideia.", duration: 120 };
  });
  const first = voiceTranscription.create(
    account.id,
    Buffer.from("synthetic"),
    "audio/webm",
  );
  // Wait until the first call has committed its reservation.
  while (!transcribeAudio.mock.calls.length) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  const second = await Promise.allSettled([
    voiceTranscription.create(
      account.id,
      Buffer.from("synthetic"),
      "audio/webm",
    ),
  ]);
  release();
  await first;
  expect(second[0].status).toBe("rejected");
  expect(second[0].reason.statusCode).toBe(429);
});
test("Provider failures remain charged against the attempt limit", async () => {
  const account = await orchestrator.createUser({});
  transcribeAudio.mockRejectedValue(new Error("Synthetic outage"));
  await expect(
    voiceTranscription.create(
      account.id,
      Buffer.from("synthetic"),
      "audio/mp4",
    ),
  ).rejects.toThrow("Synthetic outage");
  const stored = await database.query({
    text: `
      SELECT
        count(*)
      FROM
        voice_transcription_attempts
      WHERE
        user_id = $1
    `,
    values: [account.id],
  });
  expect(Number(stored.rows[0].count)).toBe(1);
});
test("Recent shared usage blocks another account before the provider call", async () => {
  const account = await orchestrator.createUser({});
  await database.query({
    text: `
      INSERT INTO
        voice_transcription_attempts (id, user_id)
      SELECT
        gen_random_uuid(),
        $1
      FROM
        generate_series(1, 15)
    `,
    values: [account.id],
  });
  const another = await orchestrator.createUser({});
  await expect(
    voiceTranscription.create(
      another.id,
      Buffer.from("synthetic"),
      "audio/webm",
    ),
  ).rejects.toMatchObject({ statusCode: 429 });
  expect(transcribeAudio).not.toHaveBeenCalled();
});
