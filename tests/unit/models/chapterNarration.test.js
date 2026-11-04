import { narrationRevision } from "models/chapterNarration";
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
