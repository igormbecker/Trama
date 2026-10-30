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
