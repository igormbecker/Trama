import { narrationRevision, isNarrationEnabled } from "models/chapterNarration";
import { synthesizeNarration } from "infra/narration";
jest.mock("infra/narration", () => ({ synthesizeNarration: jest.fn() }));
import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";
import {
  narrate,
  narrationBlocks,
  narrationText,
} from "models/chapterNarration";

test("preserves inline dialogue and separates paragraphs and list items", () => {
  const text = (value) => ({ type: "text", text: value });
  const paragraph = (...content) => ({ type: "paragraph", content });
  const document = {
    type: "doc",
    content: [
      paragraph(text("— Você "), text("voltou?")),
      {
        type: "bulletList",
        content: [
          { type: "listItem", content: [paragraph(text("Chaves"))] },
          { type: "listItem", content: [paragraph(text("Cartas"))] },
        ],
      },
    ],
  };
  expect(narrationText(document)).toBe("— Você voltou?\nChaves\nCartas");
});

jest.mock("node:child_process", () => ({ spawn: jest.fn() }));

test("reuses an in-progress synthesis for identical text and voice", async () => {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stdin = new EventEmitter();
  child.stdin.end = jest.fn();
  spawn.mockReturnValueOnce(child);

  const first = narrate("Um capítulo.", "pf_dora");
  const retry = narrate("Um capítulo.", "pf_dora");
  child.stdout.emit("data", Buffer.from("audio"));
  child.emit("close", 0);

  await expect(first).resolves.toEqual(Buffer.from("audio"));
  await expect(retry).resolves.toEqual(Buffer.from("audio"));
  expect(spawn).toHaveBeenCalledTimes(1);
});

test("stops synthesis when its only listener cancels", async () => {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stdin = new EventEmitter();
  child.stdin.end = jest.fn();
  child.kill = jest.fn(() => child.emit("close", null));
  spawn.mockReturnValueOnce(child);
  const request = new AbortController();
  const audio = narrate("Cancelar.", "pf_dora", request.signal);

  request.abort();
  await expect(audio).rejects.toThrow();
  expect(child.kill).toHaveBeenCalledWith("SIGKILL");
});

test("groups short paragraphs and skips empty blocks", () => {
  const document = {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "Primeiro." }] },
      { type: "paragraph" },
      { type: "paragraph", content: [{ type: "text", text: "Segundo." }] },
    ],
  };
  expect(narrationBlocks("Título", document)).toEqual([
    "Título\nPrimeiro.\nSegundo.",
  ]);
});

test("splits a long paragraph at sentence boundaries near the target", () => {
  const sentence = `A ${"sala ".repeat(55)}estava vazia.`;
  const document = {
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: `${sentence} ${sentence}` }],
      },
      { type: "paragraph", content: [{ type: "text", text: "Silêncio." }] },
    ],
  };
  expect(narrationBlocks("Título", document)).toEqual([
    `Título\n${sentence}`,
    `${sentence}\nSilêncio.`,
  ]);
});

test("invalidates saved progress when the chapter or block layout changes", () => {
  expect(narrationRevision(["Uma frase.", "Outra."])).not.toBe(
    narrationRevision(["Uma frase. Outra."]),
  );
});

test("bounds very long sentences so remote audio fits function responses", () => {
  const document = {
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "a".repeat(11000) }],
      },
    ],
  };
  const blocks = narrationBlocks("Title", document);
  expect(Math.max(...blocks.map((text) => text.length))).toBeLessThanOrEqual(
    1000,
  );
  expect(blocks.join("").replace("Title", "").replaceAll("\n", "")).toBe(
    "a".repeat(11000),
  );
});

test("uses the remote generator only inside a configured Vercel deployment", async () => {
  const previous = { ...process.env };
  try {
    process.env.VERCEL = "1";
    process.env.VERCEL_URL = "trama-preview.vercel.app";
    process.env.TRAMA_NARRATION_SECRET =
      "test-secret-with-at-least-32-characters";
    expect(isNarrationEnabled()).toBe(true);
    synthesizeNarration.mockResolvedValueOnce(Buffer.from("remote"));
    await expect(narrate("Remoto.", "pf_dora")).resolves.toEqual(
      Buffer.from("remote"),
    );
    expect(synthesizeNarration).toHaveBeenCalledWith(
      "Remoto.",
      "pf_dora",
      expect.any(AbortSignal),
    );
  } finally {
    process.env = previous;
  }
});

test("splits long sentences without cutting ordinary words", () => {
  const document = {
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "palavra ".repeat(300) }],
      },
    ],
  };
  const blocks = narrationBlocks("Title", document);
  const words = blocks.join(" ").replace("Title", "").trim().split(/\s+/u);
  expect(words).toHaveLength(300);
  expect(words.every((word) => word === "palavra")).toBe(true);
});
