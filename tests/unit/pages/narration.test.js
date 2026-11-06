import { createServer } from "node:http";
import { apiResolver } from "next/dist/server/api-utils/node/api-resolver";
import handler from "pages/api/v1/works/[id]/narration.js";
import authentication from "models/authentication.js";
import workReading from "models/workReading.js";
import { cachedNarration } from "models/narrationAudio.js";
import { isNarrationEnabled, narrate } from "models/chapterNarration.js";

jest.mock("models/authentication.js", () => ({
  authenticateSession: jest.fn(),
}));
jest.mock("models/workReading.js", () => ({ read: jest.fn() }));
jest.mock("models/narrationAudio.js", () => ({ cachedNarration: jest.fn() }));
jest.mock("models/chapterNarration.js", () => ({
  ...jest.requireActual("models/chapterNarration.js"),
  isNarrationEnabled: jest.fn(),
  narrate: jest.fn(),
}));
jest.mock("infra/controller.js", () => ({
  withImpersonationAudit: (handler) => handler,
  errorHandlers: {
    onError: (error, request, response) =>
      response.status(error.statusCode || 500).json({ message: error.message }),
    onNoMatch: (request, response) => response.status(405).end(),
  },
}));
import { narrationBlocks, narrationRevision } from "models/chapterNarration.js";
const document = {
  content: [{ type: "paragraph", content: [{ type: "text", text: "Olá." }] }],
};
let server;
let url;
beforeAll(async () => {
  server = createServer((request, response) =>
    apiResolver(request, response, { id: "work" }, handler, {}, false),
  );
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  url = `http://127.0.0.1:${server.address().port}/api/v1/works/work/narration`;
});
afterAll(() => new Promise((resolve) => server.close(resolve)));
beforeEach(() => {
  jest.clearAllMocks();
  authentication.authenticateSession.mockResolvedValue({
    id: "user",
    is_admin: true,
  });
  isNarrationEnabled.mockReturnValue(true);
  workReading.read.mockResolvedValue({
    parts: [{ chapters: [{ id: "chapter", title: "Título", document }] }],
  });
  cachedNarration.mockResolvedValue(Buffer.from("audio"));
});
async function request(body = {}) {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chapterId: "chapter",
      revision: narrationRevision(narrationBlocks("Título", document)),
      ...body,
    }),
  });
}
test("checks the session before reading or generating cached audio", async () => {
  authentication.authenticateSession.mockRejectedValue({
    statusCode: 401,
    message: "Unauthorized",
  });
  expect((await request()).status).toBe(401);
  expect(workReading.read).not.toHaveBeenCalled();
  expect(cachedNarration).not.toHaveBeenCalled();
});
test("keeps the administrator restriction even when cached audio exists", async () => {
  authentication.authenticateSession.mockResolvedValue({
    id: "user",
    is_admin: false,
  });
  expect((await request()).status).toBe(404);
  expect(cachedNarration).not.toHaveBeenCalled();
});
test("never serves cached audio for an inaccessible or deleted chapter", async () => {
  workReading.read.mockResolvedValue({ parts: [] });
  expect((await request()).status).toBe(404);
  expect(cachedNarration).not.toHaveBeenCalled();
});
test("rejects outdated revisions before accessing storage", async () => {
  expect((await request({ revision: "old" })).status).toBe(409);
  expect(cachedNarration).not.toHaveBeenCalled();
});
test("delivers private audio through the authorized route", async () => {
  const response = await request();
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.get("content-type")).toBe("audio/wav");
  expect(await response.text()).toBe("audio");
  expect(cachedNarration).toHaveBeenCalledWith(
    {
      workId: "work",
      chapterId: "chapter",
      voice: "pf_dora",
      text: "Título\nOlá.",
    },
    expect.any(Function),
  );
  expect(narrate).not.toHaveBeenCalled();
});
