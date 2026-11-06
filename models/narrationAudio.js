import { createHash } from "node:crypto";
import { get, put } from "@vercel/blob";

export async function cachedNarration(context, generate) {
  const storageEnabled = Boolean(
    process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID,
  );
  if (!storageEnabled) {
    return generate();
  }
  const { workId, chapterId, voice, text } = context;
  const environment = process.env.VERCEL_ENV || "development";
  const digest = createHash("sha256").update(text).digest("hex");
  const pathname = `narration/${environment}/${workId}/${chapterId}/${voice}/kokoro-v1-${digest}.wav`;
  const existing = await get(pathname, { access: "private" });
  if (existing) {
    const response = new Response(existing.stream);
    return Buffer.from(await response.arrayBuffer());
  }
  const audio = await generate();
  if (audio) {
    await put(pathname, audio, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "audio/wav",
    });
  }
  return audio;
}
