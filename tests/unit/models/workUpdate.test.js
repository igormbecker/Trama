import work from "models/work";
import database from "infra/database";

jest.mock("infra/database", () => ({ query: jest.fn() }));
const id = "98ea9191-aa8b-4c48-bc01-9ed32870b232";
beforeEach(() => database.query.mockReset());

test("Updates only the owner's title and description with normalized values", async () => {
  database.query.mockResolvedValue({
    rowCount: 1,
    rows: [{ id, title: "New", description: "Summary" }],
  });
  expect(
    await work.update(id, "owner", {
      title: " New ",
      description: " Summary ",
    }),
  ).toMatchObject({ id, title: "New" });
  expect(database.query).toHaveBeenCalledWith(
    expect.objectContaining({ values: [id, "owner", "New", "Summary"] }),
  );
  expect(database.query.mock.calls[0][0].text).toContain("owner_id = $2");
});

test("Rejects updates when the account does not own the work", async () => {
  database.query.mockResolvedValue({ rowCount: 0, rows: [] });
  await expect(
    work.update(id, "organizer", { title: "New" }),
  ).rejects.toMatchObject({ name: "NotFoundError" });
});

test.each([
  { title: "" },
  { title: "a".repeat(256) },
  { title: "New", description: "a".repeat(5001) },
  { title: "New", owner_id: "other" },
  { title: "New", description: null },
])("Rejects invalid or privileged update fields", async (input) => {
  await expect(work.update(id, "owner", input)).rejects.toMatchObject({
    name: "ValidationError",
  });
  expect(database.query).not.toHaveBeenCalled();
});
