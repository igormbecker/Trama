import { createHmac } from "node:crypto";
import { getVercelOidcToken } from "@vercel/functions/oidc";

export async function synthesizeNarration(text, voice, signal) {
  signal?.throwIfAborted();
  const secret = process.env.TRAMA_NARRATION_SECRET;
  const hostname = process.env.VERCEL_URL;
  if (
    !secret ||
    secret.length < 32 ||
    !hostname ||
    !/^[a-z0-9-]+\.vercel\.app$/u.test(hostname)
  ) {
    throw new Error("Remote narration is not configured.");
  }
  const body = JSON.stringify({ text, voice });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");
  const requestSignal = signal
    ? AbortSignal.any([signal, AbortSignal.timeout(125_000)])
    : AbortSignal.timeout(125_000);
  const response = await fetch(`https://${hostname}/api/internal/narration`, {
    method: "POST",
    redirect: "error",
    headers: {
      "Content-Type": "application/json",
      "x-trama-timestamp": timestamp,
      "x-trama-signature": signature,
      "x-vercel-trusted-oidc-idp-token": await getVercelOidcToken(),
    },
    body,
    signal: requestSignal,
  });
  if (response.status === 503) {
    return null;
  }
  if (
    !response.ok ||
    !response.headers.get("content-type")?.startsWith("audio/wav")
  ) {
    throw new Error(`Remote narration failed (${response.status}).`);
  }
  const audio = Buffer.from(await response.arrayBuffer());
  if (
    audio.length > 4_000_000 ||
    audio.toString("ascii", 0, 4) !== "RIFF" ||
    audio.toString("ascii", 8, 12) !== "WAVE"
  ) {
    throw new Error("Remote narration returned invalid audio.");
  }
  return audio;
}
