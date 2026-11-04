import { createHash } from "node:crypto";
import { spawn } from "node:child_process";

const voices = ["pf_dora", "pm_alex", "pm_santa"];
export const defaultNarrationVoice = voices[0];
export { voices as narrationVoices };

export function narrationText(node) {
  if (node.type === "text") {
    return node.text;
  }
  if (node.type === "hardBreak") {
    return "\n";
  }
  const separator = ["paragraph", "heading", "codeBlock"].includes(node.type)
    ? ""
    : "\n";
  return (node.content ?? []).map(narrationText).join(separator);
}

export function narrationBlocks(title, document) {
  const targetLength = 500;
  const sentences = new Intl.Segmenter("pt-BR", { granularity: "sentence" });
  const paragraphs = (document.content ?? [])
    .map((block) => narrationText(block).trim())
    .filter(Boolean);
  if (!paragraphs.length) {
    return [];
  }

  const blocks = [];
  let current = title;
  for (const paragraph of paragraphs) {
    const segments =
      paragraph.length > targetLength
        ? Array.from(sentences.segment(paragraph), ({ segment }) =>
            segment.trim(),
          )
        : [paragraph];

    for (const [index, segment] of segments.entries()) {
      const separator = index === 0 ? "\n" : " ";
      const combined = `${current}${separator}${segment}`;
      if (combined.length > targetLength && current !== title) {
        blocks.push(current);
        current = segment;
      } else {
        current = combined;
      }
    }
  }
  blocks.push(current);
  return blocks;
}

export function narrationRevision(blocks) {
  return createHash("sha256").update(JSON.stringify(blocks)).digest("hex");
}

let activeNarration;

export function isNarrationEnabled() {
  return Boolean(process.env.TRAMA_KOKORO_PYTHON);
}

export async function narrate(text, voice, signal) {
  signal?.throwIfAborted();
  if (activeNarration) {
    if (
      activeNarration.stopping ||
      activeNarration.text !== text ||
      activeNarration.voice !== voice
    ) {
      return null;
    }
  } else {
    activeNarration = startNarration(text, voice);
  }

  const narration = activeNarration;
  narration.listeners++;
  function cancel() {
    narration.listeners--;
    if (narration.listeners === 0) {
      narration.stop();
    }
  }

  signal?.addEventListener("abort", cancel, { once: true });
  try {
    const audio = await narration.audio;
    signal?.throwIfAborted();
    return audio;
  } finally {
    signal?.removeEventListener("abort", cancel);
    if (!signal?.aborted) {
      narration.listeners--;
    }
    if (activeNarration === narration) {
      activeNarration = undefined;
    }
  }
}

function startNarration(text, voice) {
  const child = spawn(
    process.env.TRAMA_KOKORO_PYTHON,
    ["infra/scripts/narrate-chapter.py", voice],
    { stdio: ["pipe", "pipe", "ignore"] },
  );
  const narration = {
    text,
    voice,
    listeners: 0,
    stopping: false,
    stop() {
      narration.stopping = true;
      child.kill("SIGKILL");
    },
  };
  narration.audio = new Promise((resolve, reject) => {
    const chunks = [];
    const timeout = setTimeout(narration.stop, 120_000);
    child.stdout.on("data", (chunk) => chunks.push(chunk));
    child.stdin.on("error", () => {});
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code === 0 && chunks.length) {
        resolve(Buffer.concat(chunks));
      } else {
        reject(new Error("Chapter narration failed."));
      }
    });
    child.stdin.end(text);
  });
  return narration;
}
