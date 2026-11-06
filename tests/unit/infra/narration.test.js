import { createHmac } from "node:crypto";
import { getVercelOidcToken } from "@vercel/functions/oidc";
import { synthesizeNarration } from "infra/narration.js";

jest.mock("@vercel/functions/oidc", () => ({ getVercelOidcToken: jest.fn() }));
const originalFetch = global.fetch;
const originalEnvironment = { ...process.env };
beforeEach(() => {
  process.env.VERCEL_URL = "trama-preview.vercel.app";
  process.env.TRAMA_NARRATION_SECRET =
    "test-secret-with-at-least-32-characters";
  getVercelOidcToken.mockResolvedValue("test-oidc");
  global.fetch = jest.fn().mockResolvedValue(
    new Response(Buffer.from("RIFFtestWAVE"), {
      headers: { "Content-Type": "audio/wav" },
    }),
  );
});
afterEach(() => {
  global.fetch = originalFetch;
  process.env = { ...originalEnvironment };
  jest.clearAllMocks();
});
test("signs the exact body and targets the current deployment with its OIDC identity", async () => {
  const audio = await synthesizeNarration("Olá.", "pf_dora");
  expect(audio.toString()).toBe("RIFFtestWAVE");
  const [url, options] = fetch.mock.calls[0];
  expect(url).toBe("https://trama-preview.vercel.app/api/internal/narration");
  expect(options.headers["x-vercel-trusted-oidc-idp-token"]).toBe("test-oidc");
  const timestamp = options.headers["x-trama-timestamp"];
  const signature = createHmac("sha256", process.env.TRAMA_NARRATION_SECRET)
    .update(`${timestamp}.${options.body}`)
    .digest("hex");
  expect(options.headers["x-trama-signature"]).toBe(signature);
  expect(JSON.parse(options.body)).toEqual({ text: "Olá.", voice: "pf_dora" });
  expect(options.redirect).toBe("error");
});
test("returns busy without interpreting HTML as audio", async () => {
  fetch.mockResolvedValue(new Response("", { status: 503 }));
  await expect(synthesizeNarration("Olá.", "pf_dora")).resolves.toBeNull();
});
test("rejects protected deployment login pages and invalid audio", async () => {
  fetch.mockResolvedValue(new Response("<html>login</html>"));
  await expect(synthesizeNarration("Olá.", "pf_dora")).rejects.toThrow();
  fetch.mockResolvedValue(
    new Response("invalid", { headers: { "Content-Type": "audio/wav" } }),
  );
  await expect(synthesizeNarration("Olá.", "pf_dora")).rejects.toThrow();
});
test("propagates caller cancellation", async () => {
  const abort = new AbortController();
  abort.abort();
  await expect(
    synthesizeNarration("Olá.", "pf_dora", abort.signal),
  ).rejects.toThrow();
  expect(fetch).not.toHaveBeenCalled();
});
test("fails closed without a signing secret", async () => {
  delete process.env.TRAMA_NARRATION_SECRET;
  await expect(synthesizeNarration("Olá.", "pf_dora")).rejects.toThrow();
  expect(fetch).not.toHaveBeenCalled();
});
