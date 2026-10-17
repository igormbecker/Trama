import workReading from "models/workReading";
import work from "models/work";
import database from "infra/database";
jest.mock("models/work", () => ({ findOneById: jest.fn() }));
jest.mock("infra/database", () => ({ query: jest.fn() }));
beforeEach(() => jest.clearAllMocks());

test("Loads only saved chapter documents in editorial order without exposing lease tokens", async () => {
  work.findOneById.mockResolvedValue({ id: "work", title: "Book" });
  database.query.mockResolvedValue({
    rows: [
      {
        part_id: "part",
        part_title: "Part",
        part_position: 1,
        id: "chapter",
        title: "Chapter",
        position: 1,
        document: { type: "doc", content: [] },
      },
    ],
  });
  const result = await workReading.read("work", "reader");
  expect(work.findOneById).toHaveBeenCalledWith("work", "reader");
  expect(result.parts).toEqual([
    {
      id: "part",
      title: "Part",
      position: 1,
      chapters: [
        {
          id: "chapter",
          title: "Chapter",
          position: 1,
          document: { type: "doc", content: [] },
        },
      ],
    },
  ]);
  const query = database.query.mock.calls[0][0];
  expect(query.values).toEqual(["work"]);
  expect(query.text).toContain("d.revision > 0");
  expect(query.text).toContain("ORDER BY p.position, c.position");
  expect(query.text).not.toContain("lease_token");
});

test("Does not load documents when access to the work is denied", async () => {
  work.findOneById.mockRejectedValue(new Error("denied"));
  await expect(workReading.read("work", "other")).rejects.toThrow("denied");
  expect(database.query).not.toHaveBeenCalled();
});
