import { get, put } from "@vercel/blob";
import { cachedNarration } from "models/narrationAudio.js";
jest.mock("@vercel/blob", () => ({ get: jest.fn(), put: jest.fn() }));
const context = {
  workId: "work",
  chapterId: "chapter",
  voice: "pf_dora",
  text: "Olá.",
};
beforeEach(() => {
  jest.clearAllMocks();
  process.env.BLOB_READ_WRITE_TOKEN = "test-token";
  process.env.VERCEL_ENV = "preview";
});
afterEach(() => {
  delete process.env.BLOB_READ_WRITE_TOKEN;
  delete process.env.VERCEL_ENV;
});
test("reuses private audio without synthesizing again", async () => {
  get.mockResolvedValue({ stream: new Blob(["saved audio"]).stream() });
  const generate = jest.fn();
  await expect(cachedNarration(context, generate)).resolves.toEqual(
    Buffer.from("saved audio"),
  );
  expect(generate).not.toHaveBeenCalled();
  expect(get).toHaveBeenCalledWith(
    expect.stringContaining("narration/preview/work/chapter/pf_dora/"),
    { access: "private" },
  );
});
test("stores audio privately and separates text revisions", async () => {
  get.mockResolvedValue(null);
  const generate = jest.fn().mockResolvedValue(Buffer.from("new audio"));
  await cachedNarration(context, generate);
  const firstPath = put.mock.calls[0][0];
  await cachedNarration({ ...context, text: "Texto alterado." }, generate);
  expect(put.mock.calls[1][0]).not.toBe(firstPath);
  expect(put).toHaveBeenCalledWith(
    firstPath,
    Buffer.from("new audio"),
    expect.objectContaining({
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
    }),
  );
});
test("does not generate on storage authentication failures", async () => {
  get.mockRejectedValue(new Error("Forbidden"));
  const generate = jest.fn();
  await expect(cachedNarration(context, generate)).rejects.toThrow("Forbidden");
  expect(generate).not.toHaveBeenCalled();
});
test("keeps development synthesis working without remote storage", async () => {
  delete process.env.BLOB_READ_WRITE_TOKEN;
  const generate = jest.fn().mockResolvedValue(null);
  await expect(cachedNarration(context, generate)).resolves.toBeNull();
  expect(get).not.toHaveBeenCalled();
  expect(put).not.toHaveBeenCalled();
});
