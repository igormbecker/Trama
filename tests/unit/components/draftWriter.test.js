import { createDraftWriter } from "components/works/draftWriter.js";

test("Serializes saves and preserves changes made during a pending request", async () => {
  let finish;
  const calls = [];
  const writer = createDraftWriter({
    revision: 0,
    save: (document, revision) => {
      calls.push({ document, revision });
      return new Promise((resolve) => {
        finish = resolve;
      });
    },
  });
  writer.change("first");
  const saving = writer.flush();
  writer.change("second");
  await writer.flush();
  expect(calls).toEqual([{ document: "first", revision: 0 }]);
  finish({ revision: 1 });
  await saving;
  expect(writer.pending()).toBe(true);
  const next = writer.flush();
  expect(calls[1]).toEqual({ document: "second", revision: 1 });
  finish({ revision: 2 });
  await next;
  expect(writer.pending()).toBe(false);
});

test("Failed saves retain the draft and retry the same revision", async () => {
  let fail = true;
  const revisions = [];
  const writer = createDraftWriter({
    revision: 3,
    save: async (_, revision) => {
      revisions.push(revision);
      if (fail) throw new Error("offline");
      return { revision: 4 };
    },
  });
  writer.change("pending");
  await expect(writer.flush()).rejects.toThrow("offline");
  expect(writer.pending()).toBe(true);
  fail = false;
  await writer.flush();
  expect(revisions).toEqual([3, 3]);
  expect(writer.pending()).toBe(false);
});
