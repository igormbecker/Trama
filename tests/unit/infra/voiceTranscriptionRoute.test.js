import { Readable } from "node:stream";
import handler from "pages/api/v1/voice-transcriptions";
import authentication from "models/authentication";
import voiceTranscription from "models/voiceTranscription";
import { UnauthorizedError } from "infra/errors";
jest.mock("models/authentication", () => ({ authenticateSession: jest.fn() }));
jest.mock("models/voiceTranscription", () => ({ create: jest.fn() }));
beforeEach(() => {
  jest.clearAllMocks();
  authentication.authenticateSession.mockResolvedValue({ id: "user" });
  voiceTranscription.create.mockResolvedValue({ text: "Texto." });
});
async function call({
  headers = {},
  data = Buffer.from("audio"),
  method = "POST",
} = {}) {
  const request = Readable.from([data]);
  Object.assign(request, {
    method,
    url: "/api/v1/voice-transcriptions",
    cookies: {},
    headers: { "content-type": "audio/webm", "x-trama-voice": "1", ...headers },
  });
  const response = { setHeader: jest.fn(), status: jest.fn(), json: jest.fn() };
  response.status.mockReturnValue(response);
  await handler(request, response);
  return response;
}
test("Authenticates, sends only audio to the model and forbids cache", async () => {
  const response = await call();
  expect(response.status).toHaveBeenCalledWith(200);
  expect(response.setHeader).toHaveBeenCalledWith(
    "Cache-Control",
    "private, no-store",
  );
  expect(voiceTranscription.create).toHaveBeenCalledWith(
    "user",
    Buffer.from("audio"),
    "audio/webm",
  );
});
test("Rejects an expired session before reading audio", async () => {
  authentication.authenticateSession.mockRejectedValue(new UnauthorizedError());
  const response = await call();
  expect(response.status).toHaveBeenCalledWith(401);
  expect(voiceTranscription.create).not.toHaveBeenCalled();
});
test.each([
  { headers: { "sec-fetch-site": "cross-site" } },
  { headers: { "x-trama-voice": "" } },
  { headers: { "content-type": "text/html" } },
  { data: Buffer.alloc(0) },
])("Rejects invalid input before consuming quota", async (input) => {
  const response = await call(input);
  expect(response.status).toHaveBeenCalledWith(400);
  expect(voiceTranscription.create).not.toHaveBeenCalled();
});
test("Rejects oversized audio before consuming quota", async () => {
  const response = await call({ data: Buffer.alloc(4 * 1024 * 1024 + 1) });
  expect(response.status).toHaveBeenCalledWith(413);
  expect(voiceTranscription.create).not.toHaveBeenCalled();
});
test("Rejects unsupported methods after authentication", async () => {
  const response = await call({ method: "GET" });
  expect(response.status).toHaveBeenCalledWith(405);
});
