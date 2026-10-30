import voiceTranscription from "models/voiceTranscription";
import database from "infra/database";
import { transcribeAudio } from "infra/transcription";
jest.mock("infra/database", () => ({
  getNewClient: jest.fn(),
  query: jest.fn().mockResolvedValue({}),
}));
jest.mock("infra/transcription", () => ({ transcribeAudio: jest.fn() }));
const originalKey = process.env.GROQ_API_KEY;
afterEach(() => {
  if (originalKey === undefined) {
    delete process.env.GROQ_API_KEY;
  } else {
    process.env.GROQ_API_KEY = originalKey;
  }
  jest.clearAllMocks();
});
function setup(usage) {
  process.env.GROQ_API_KEY = "test-only";
  const client = {
    query: jest.fn().mockImplementation(async (input) => ({
      rows:
        typeof input === "object" && input.text.includes("account_seconds")
          ? [usage]
          : [],
    })),
    end: jest.fn(),
  };
  database.getNewClient.mockResolvedValue(client);
  transcribeAudio.mockResolvedValue({ text: "Texto.", duration: 10 });
  return client;
}
test("Reserves a shared slot before contacting Groq and closes the transaction", async () => {
  const client = setup({
    account_seconds: "0",
    hourly_attempts: "0",
    daily_attempts: "0",
  });
  expect(
    await voiceTranscription.create("user", Buffer.from("a"), "audio/webm"),
  ).toEqual({ text: "Texto." });
  expect(client.query).toHaveBeenCalledWith("COMMIT");
  expect(client.end).toHaveBeenCalled();
  expect(transcribeAudio).toHaveBeenCalledTimes(1);
});
test.each([
  {
    account_seconds: "0",
    minute_attempts: "15",
    hourly_attempts: "15",
    daily_attempts: "15",
  },
  { account_seconds: "1800", hourly_attempts: "2", daily_attempts: "2" },
  { account_seconds: "0", hourly_attempts: "50", daily_attempts: "50" },
  { account_seconds: "0", hourly_attempts: "0", daily_attempts: "200" },
])(
  "Rejects exhausted account or shared quota without contacting Groq",
  async (usage) => {
    const client = setup(usage);
    await expect(
      voiceTranscription.create("user", Buffer.from("a"), "audio/webm"),
    ).rejects.toThrow("limite");
    expect(transcribeAudio).not.toHaveBeenCalled();
    expect(client.query).toHaveBeenCalledWith("ROLLBACK");
    expect(client.end).toHaveBeenCalled();
  },
);

test("Short recordings settle only their measured duration instead of consuming a full attempt", async () => {
  setup({
    account_seconds: "600",
    minute_attempts: "0",
    hourly_attempts: "0",
    daily_attempts: "0",
  });
  await voiceTranscription.create("user", Buffer.from("a"), "audio/webm");
  const settlement = database.query.mock.calls.find(
    ([query]) => typeof query === "object" && query.text.includes("UPDATE"),
  );
  expect(settlement).toBeDefined();
  expect(settlement[0].values[1]).toBe(10);
});

test("Reserves four minutes and settles a three-minute recording without truncating its duration", async () => {
  const client = setup({
    account_seconds: "0",
    hourly_attempts: "0",
    daily_attempts: "0",
  });
  transcribeAudio.mockResolvedValue({ text: "Texto.", duration: 180 });
  await voiceTranscription.create("user", Buffer.from("a"), "audio/webm");
  const reservation = client.query.mock.calls.find(
    ([query]) =>
      typeof query === "object" && query.text.includes("INSERT INTO"),
  );
  expect(reservation[0].values[2]).toBe(240);
  expect(database.query.mock.calls[0][0].values[1]).toBe(180);
});
test.each([
  { account_seconds: "1561", hourly_attempts: "0", daily_attempts: "0" },
  {
    account_seconds: "0",
    hourly_seconds: "5761",
    hourly_attempts: "0",
    daily_attempts: "0",
  },
  {
    account_seconds: "0",
    daily_seconds: "23761",
    hourly_attempts: "0",
    daily_attempts: "0",
  },
])(
  "Rejects a reservation that would exceed account or shared audio budgets",
  async (usage) => {
    setup(usage);
    await expect(
      voiceTranscription.create("user", Buffer.from("a"), "audio/webm"),
    ).rejects.toMatchObject({ statusCode: 429 });
    expect(transcribeAudio).not.toHaveBeenCalled();
  },
);
