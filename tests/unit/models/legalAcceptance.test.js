import database from "infra/database";
import legalAcceptance from "models/legalAcceptance";
jest.mock("infra/database", () => ({
  query: jest.fn(),
  getNewClient: jest.fn(),
}));
beforeEach(() => jest.resetAllMocks());

test("Requires the exact current release rather than any previous acceptance", async () => {
  database.query.mockResolvedValue({ rowCount: 0, rows: [] });
  await expect(
    legalAcceptance.assertAccepted("account", { enabled: true }),
  ).rejects.toMatchObject({
    name: "LegalAcceptanceRequiredError",
    statusCode: 403,
  });
});
test("Does not query acceptance when enforcement is disabled", async () => {
  await expect(
    legalAcceptance.assertAccepted("account", { enabled: false }),
  ).resolves.toBeUndefined();
  expect(database.query).not.toHaveBeenCalled();
});
test.each([
  {},
  { accepted: false },
  { accepted: true, release_id: "outdated" },
])("Rejects incomplete or obsolete acceptance", async (input) => {
  await expect(
    legalAcceptance.accept({ id: "account" }, input),
  ).rejects.toMatchObject({ name: "ValidationError" });
  expect(database.getNewClient).not.toHaveBeenCalled();
});
test("An administrator cannot accept on behalf of a represented user", async () => {
  await expect(
    legalAcceptance.accept(
      { id: "account", impersonation: { administrator_id: "admin" } },
      { accepted: true, release_id: legalAcceptance.currentRelease.id },
    ),
  ).rejects.toMatchObject({ name: "ForbiddenError" });
});
