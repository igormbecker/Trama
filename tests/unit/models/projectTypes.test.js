import work from "models/work.js";
import database from "infra/database.js";

jest.mock("infra/database.js", () => ({
  query: jest.fn(),
  getNewClient: jest.fn(),
}));
beforeEach(() => jest.resetAllMocks());

test("Creates a group assignment using the existing work permissions", async () => {
  const client = {
    query: jest.fn().mockResolvedValue({ rows: [{ id: "part" }] }),
    end: jest.fn(),
  };
  client.query.mockResolvedValueOnce({}).mockResolvedValueOnce({
    rows: [{ id: "work", type: "group_assignment" }],
  });
  database.getNewClient.mockResolvedValue(client);
  await expect(
    work.create("owner", { title: "Research", type: "group_assignment" }),
  ).resolves.toMatchObject({ type: "group_assignment" });
  expect(client.query.mock.calls[1][0].values).toEqual([
    "owner",
    "Research",
    "",
    "group_assignment",
  ]);
  expect(client.query).toHaveBeenLastCalledWith("COMMIT");
});

test("Defaults new works to literary and rejects unsupported project types", async () => {
  database.query.mockResolvedValue({ rows: [{}] });
  await work.create("owner", { title: "Story" });
  expect(database.query.mock.calls[0][0].values[3]).toBe("literary");
  await expect(
    work.create("owner", { title: "Story", type: "unknown" }),
  ).rejects.toMatchObject({ name: "ValidationError" });
});

test("Rolls back the project when its initial structure cannot be created", async () => {
  const client = { query: jest.fn(), end: jest.fn() };
  client.query
    .mockResolvedValueOnce({})
    .mockResolvedValueOnce({ rows: [{ id: "work" }] })
    .mockRejectedValueOnce(new Error("structure failed"))
    .mockResolvedValueOnce({});
  database.getNewClient.mockResolvedValue(client);
  await expect(
    work.create("owner", { title: "Group", type: "group_assignment" }),
  ).rejects.toThrow("structure failed");
  expect(client.query).toHaveBeenLastCalledWith("ROLLBACK");
  expect(client.end).toHaveBeenCalledTimes(1);
});
