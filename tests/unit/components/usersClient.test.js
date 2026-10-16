import { jest } from "@jest/globals";
import {
  listUsers,
  saveUser,
  removeUser,
} from "components/users/usersClient.js";

afterEach(() => jest.restoreAllMocks());

test("Loads the protected user list without caching", async () => {
  const entries = [{ id: "example", username: "reader" }];
  const mock = jest
    .spyOn(globalThis, "fetch")
    .mockResolvedValue({ status: 200, json: async () => entries });
  await expect(listUsers()).resolves.toEqual(entries);
  expect(mock).toHaveBeenCalledWith(
    "/api/v1/users",
    expect.objectContaining({ credentials: "same-origin", cache: "no-store" }),
  );
});
test("Creates an ordinary account with only the form fields", async () => {
  const mock = jest.spyOn(globalThis, "fetch").mockResolvedValue({
    status: 201,
    json: async () => ({ username: "reader" }),
  });
  await saveUser({
    name: " Reader ",
    username: " reader ",
    email: " reader@trama.test ",
    password: "example-password",
  });
  expect(mock).toHaveBeenCalledWith(
    "/api/v1/users",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({
        name: "Reader",
        username: "reader",
        email: "reader@trama.test",
        password: "example-password",
      }),
    }),
  );
});
test("Updates the original username and omits an empty optional password", async () => {
  const mock = jest.spyOn(globalThis, "fetch").mockResolvedValue({
    status: 200,
    json: async () => ({ username: "new-reader" }),
  });
  await saveUser(
    {
      name: "Reader",
      username: "new-reader",
      email: "reader@trama.test",
      password: "",
    },
    "old.reader",
  );
  expect(mock).toHaveBeenCalledWith(
    "/api/v1/users/old.reader",
    expect.objectContaining({
      method: "PATCH",
      body: JSON.stringify({
        name: "Reader",
        username: "new-reader",
        email: "reader@trama.test",
      }),
    }),
  );
});
test("Deletes only the selected account", async () => {
  const mock = jest
    .spyOn(globalThis, "fetch")
    .mockResolvedValue({ status: 204 });
  await expect(removeUser("reader")).resolves.toBeUndefined();
  expect(mock).toHaveBeenCalledWith(
    "/api/v1/users/reader",
    expect.objectContaining({ method: "DELETE" }),
  );
});
test.each([
  [401, "Sua sessão expirou. Entre novamente."],
  [403, "Somente administradores podem gerenciar usuários."],
  [500, "Não foi possível concluir a operação. Tente novamente."],
])("Explains status %s", async (status, message) => {
  jest.spyOn(globalThis, "fetch").mockResolvedValue({ status });
  await expect(listUsers()).rejects.toThrow(message);
});
test("Explains duplicate emails", async () => {
  jest.spyOn(globalThis, "fetch").mockResolvedValue({
    status: 400,
    json: async () => ({ message: "The informed e-mail is already in use." }),
  });
  await expect(
    saveUser({
      name: "Reader",
      username: "reader",
      email: "reader@trama.test",
      password: "example-password",
    }),
  ).rejects.toThrow("Este e-mail já está cadastrado.");
});
test("Explains network errors", async () => {
  jest
    .spyOn(globalThis, "fetch")
    .mockRejectedValue(new Error("private details"));
  await expect(listUsers()).rejects.toThrow(
    "Não foi possível conectar. Tente novamente.",
  );
});

test("Sends an explicit role change only when editing an existing user", async () => {
  const mock = jest
    .spyOn(globalThis, "fetch")
    .mockResolvedValue({ status: 200, json: async () => ({ is_admin: true }) });
  await saveUser(
    {
      name: "Reader",
      username: "reader",
      email: "reader@trama.test",
      password: "",
      is_admin: true,
    },
    "reader",
  );
  expect(JSON.parse(mock.mock.calls[0][1].body).is_admin).toBe(true);
});

test("Includes confirmation when an administrator changes an existing password", async () => {
  const mock = jest
    .spyOn(globalThis, "fetch")
    .mockResolvedValue({ status: 200, json: async () => ({}) });
  await saveUser(
    {
      name: "Reader",
      username: "reader",
      email: "reader@trama.test",
      password: "new-password",
      password_confirmation: "new-password",
    },
    "reader",
  );
  expect(JSON.parse(mock.mock.calls[0][1].body)).toMatchObject({
    password: "new-password",
    password_confirmation: "new-password",
  });
});
test.each([
  ["new-password", "different-password"],
  ["new-password", ""],
  ["", "confirmation-only"],
])(
  "Does not submit a mismatched administrative password pair",
  async (password, confirmation) => {
    const mock = jest.spyOn(globalThis, "fetch");
    await expect(
      saveUser(
        {
          name: "Reader",
          username: "reader",
          email: "reader@trama.test",
          password,
          password_confirmation: confirmation,
        },
        "reader",
      ),
    ).rejects.toThrow("As senhas não coincidem.");
    expect(mock).not.toHaveBeenCalled();
  },
);

test("Explains why an account responsible for works cannot be removed", async () => {
  jest.spyOn(globalThis, "fetch").mockResolvedValue({
    status: 400,
    json: async () => ({
      message:
        "Transfer responsibility for your works before deleting this account.",
    }),
  });
  await expect(removeUser("owner")).rejects.toThrow(
    "Esta conta é responsável por obras e não pode ser removida.",
  );
});
