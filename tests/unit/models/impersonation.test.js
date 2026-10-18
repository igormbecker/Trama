import authentication from "models/authentication";
import session from "models/session";
import user from "models/user";

jest.mock("models/legalAcceptance", () => ({ assertAccepted: jest.fn() }));
jest.mock("models/session", () => ({ findOneValidByToken: jest.fn() }));
jest.mock("models/user", () => ({ findOneById: jest.fn() }));

beforeEach(() => jest.resetAllMocks());

test("Uses the represented account without inheriting administrator privileges", async () => {
  session.findOneValidByToken.mockResolvedValue({
    user_id: "actor",
    impersonated_user_id: "target",
    impersonation_expires_at: new Date(Date.now() + 60000),
  });
  user.findOneById.mockImplementation(async (id) => ({ id, is_admin: true }));
  await expect(
    authentication.authenticateSession("token"),
  ).resolves.toMatchObject({
    id: "target",
    is_admin: false,
    impersonation: { administrator_id: "actor" },
  });
  await expect(
    authentication.authenticateAdministrator("token"),
  ).rejects.toMatchObject({ name: "ForbiddenError" });
});

test.each(["expired", "demoted"])(
  "Rejects %s impersonation without silently restoring administrator permissions",
  async (state) => {
    session.findOneValidByToken.mockResolvedValue({
      user_id: "actor",
      impersonated_user_id: "target",
      impersonation_expires_at: new Date(
        Date.now() + (state === "expired" ? -60000 : 60000),
      ),
    });
    user.findOneById.mockImplementation(async (id) => ({
      id,
      is_admin: state !== "demoted",
    }));
    await expect(
      authentication.authenticateSession("token"),
    ).rejects.toMatchObject({ name: "UnauthorizedError" });
  },
);
