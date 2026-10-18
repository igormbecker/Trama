import database from "infra/database.js";
import email from "infra/email.js";
import passwordRecovery from "models/passwordRecovery.js";

jest.mock("infra/database.js", () => ({ query: jest.fn() }));
jest.mock("infra/email.js", () => ({ send: jest.fn() }));
jest.mock("models/transactional/index.js", () => ({
  renderMessage: jest
    .fn()
    .mockResolvedValue({ html: "<p>Recovery</p>", text: "Recovery" }),
}));

const originalEnvironment = { ...process.env };

beforeEach(() => jest.clearAllMocks());
afterEach(() => {
  process.env = { ...originalEnvironment };
});

test("Removes an undeliverable token and does not expose the provider error", async () => {
  database.query
    .mockResolvedValueOnce({ rowCount: 1 })
    .mockResolvedValueOnce({
      rows: [
        {
          id: "account-id",
          email: "reader@example.com",
          password: "stored-hash",
        },
      ],
    })
    .mockResolvedValueOnce({ rowCount: 1 })
    .mockResolvedValueOnce({ rowCount: 1 });
  email.send.mockRejectedValue(new Error("private provider message"));
  await expect(
    passwordRecovery.request({ email: "reader@example.com" }),
  ).rejects.toMatchObject({
    name: "ServiceError",
    message: "Recovery email could not be sent.",
  });
  expect(database.query).toHaveBeenLastCalledWith(
    expect.objectContaining({
      text: "DELETE FROM password_recovery_tokens WHERE token_hash = $1",
    }),
  );
});

test("Does not send or create tokens when an address is throttled", async () => {
  database.query.mockResolvedValueOnce({ rowCount: 0 });
  await passwordRecovery.request({ email: "reader@example.com" });
  expect(database.query).toHaveBeenCalledTimes(1);
  expect(email.send).not.toHaveBeenCalled();
});

test("Does not send or create tokens for an unknown account", async () => {
  database.query
    .mockResolvedValueOnce({ rowCount: 1 })
    .mockResolvedValueOnce({ rows: [] });
  await passwordRecovery.request({ email: "unknown@example.com" });
  expect(database.query).toHaveBeenCalledTimes(2);
  expect(email.send).not.toHaveBeenCalled();
});

test("Rejects untrusted preview origin configuration before accessing account data", async () => {
  process.env.NODE_ENV = "production";
  process.env.VERCEL_ENV = "preview";
  process.env.VERCEL_URL = "untrusted.invalid/path";
  delete process.env.TRAMA_TEST_SERVER;
  await expect(
    passwordRecovery.request({ email: "reader@example.com" }),
  ).rejects.toMatchObject({ name: "ServiceError" });
  expect(database.query).not.toHaveBeenCalled();
});
