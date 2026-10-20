import authentication from "models/authentication.js";
import user from "models/user.js";
import password from "models/password.js";
import { NotFoundError } from "infra/errors.js";

jest.mock("models/user.js", () => ({ findOneByEmail: jest.fn() }));
jest.mock("models/password.js", () => ({ compare: jest.fn() }));
beforeEach(() => jest.clearAllMocks());

test("Compares a password even for an unknown address and returns the same error", async () => {
  user.findOneByEmail.mockRejectedValue(new NotFoundError({}));
  password.compare.mockResolvedValue(false);
  await expect(
    authentication.authenticate("unknown@example.com", "wrong-password"),
  ).rejects.toMatchObject({
    name: "UnauthorizedError",
    message: "Invalid email or password.",
  });
  expect(password.compare).toHaveBeenCalledTimes(1);
});

test("Requires email verification only after valid credentials", async () => {
  user.findOneByEmail.mockResolvedValue({
    email_verification_required: true,
    email_verified_at: null,
    password: "hash",
  });
  password.compare.mockResolvedValue(true);
  await expect(
    authentication.authenticate("new@example.com", "valid-password"),
  ).rejects.toMatchObject({
    name: "EmailVerificationRequiredError",
    message: "Email verification required.",
  });
});
