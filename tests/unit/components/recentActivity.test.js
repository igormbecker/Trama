import {
  recordAccess,
  readActivity,
  recentWorks,
} from "components/home/recentActivity";

function storage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
  };
}

test("Keeps recency by account, deduplicates works and remembers the last chapter", () => {
  const store = storage();
  recordAccess(store, "alice", "one", "chapter");
  recordAccess(store, "alice", "two");
  recordAccess(store, "alice", "one");
  expect(readActivity(store, "alice")).toEqual({
    works: ["one", "two"],
    chapter: { workId: "one", chapterId: "chapter" },
  });
  expect(readActivity(store, "bob")).toEqual({ works: [], chapter: null });
});

test("Shows at most five currently accessible works in access order", () => {
  const works = Array.from({ length: 8 }, (_, index) => ({ id: `${index}` }));
  expect(
    recentWorks(
      { works: ["removed", "6", "5", "4", "3", "2", "1"] },
      works,
    ).map((work) => work.id),
  ).toEqual(["6", "5", "4", "3", "2"]);
});

test("Storage failures and malformed history never block navigation", () => {
  const store = {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("blocked");
    },
  };
  expect(readActivity(store, "alice")).toEqual({ works: [], chapter: null });
  expect(() => recordAccess(store, "alice", "one")).not.toThrow();
  expect(readActivity({ getItem: () => '{"works":false}' }, "alice")).toEqual({
    works: [],
    chapter: null,
  });
});
