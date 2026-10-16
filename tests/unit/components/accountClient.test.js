import { jest } from "@jest/globals";
import { saveAccount } from "components/account/accountClient";
afterEach(() => jest.restoreAllMocks());
test("Updates the authenticated account with only personal profile fields", async () => {
  const mock = jest
    .spyOn(globalThis, "fetch")
    .mockResolvedValue({ status: 200, json: async () => ({ name: "Reader" }) });
  await saveAccount({
    name: " Reader ",
    username: " reader ",
    email: " reader@trama.test ",
    is_admin: true,
  });
  expect(mock).toHaveBeenCalledWith(
    "/api/v1/user",
    expect.objectContaining({
      method: "PATCH",
      credentials: "same-origin",
      body: JSON.stringify({
        name: "Reader",
        username: "reader",
        email: "reader@trama.test",
      }),
    }),
  );
});
test("Explains an expired session", async () => {
  jest.spyOn(globalThis, "fetch").mockResolvedValue({ status: 401 });
  await expect(
    saveAccount({
      name: "Reader",
      username: "reader",
      email: "reader@trama.test",
    }),
  ).rejects.toThrow("Sua sessão expirou. Entre novamente.");
});

test("Sends a matching password pair without trimming it", async () => {
  const mock = jest
    .spyOn(globalThis, "fetch")
    .mockResolvedValue({ status: 200, json: async () => ({ name: "Reader" }) });
  await saveAccount({
    name: "Reader",
    username: "reader",
    email: "reader@trama.test",
    password: " example-password ",
    password_confirmation: " example-password ",
  });
  expect(JSON.parse(mock.mock.calls[0][1].body)).toMatchObject({
    password: " example-password ",
    password_confirmation: " example-password ",
  });
});
test("Omits blank password fields when saving profile data", async () => {
  const mock = jest
    .spyOn(globalThis, "fetch")
    .mockResolvedValue({ status: 200, json: async () => ({ name: "Reader" }) });
  await saveAccount({
    name: "Reader",
    username: "reader",
    email: "reader@trama.test",
    password: "",
    password_confirmation: "",
  });
  const body = JSON.parse(mock.mock.calls[0][1].body);
  expect(body).not.toHaveProperty("password");
  expect(body).not.toHaveProperty("password_confirmation");
});
test.each([
  ["new-password", "different-password"],
  ["new-password", ""],
  ["", "confirmation-only"],
])("Does not submit mismatched passwords", async (password, confirmation) => {
  const mock = jest.spyOn(globalThis, "fetch");
  await expect(
    saveAccount({
      name: "Reader",
      username: "reader",
      email: "reader@trama.test",
      password,
      password_confirmation: confirmation,
    }),
  ).rejects.toThrow("As senhas não coincidem.");
  expect(mock).not.toHaveBeenCalled();
});
