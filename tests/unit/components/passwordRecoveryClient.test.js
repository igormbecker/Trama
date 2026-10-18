import { jest } from "@jest/globals";
import {
  requestPasswordRecovery,
  resetPassword,
} from "components/auth/passwordRecoveryClient.js";

afterEach(() => jest.restoreAllMocks());

test("Requests a link with the session context and without caching the response", async () => {
  const mock = jest
    .spyOn(globalThis, "fetch")
    .mockResolvedValue({ status: 202 });
  await requestPasswordRecovery(" reader@example.com ");
  expect(mock).toHaveBeenCalledWith(
    "/api/v1/password-recovery",
    expect.objectContaining({
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      body: JSON.stringify({ email: "reader@example.com" }),
    }),
  );
});

test("Keeps the reset token out of the URL and sends confirmation in the body", async () => {
  const mock = jest
    .spyOn(globalThis, "fetch")
    .mockResolvedValue({ status: 204 });
  await resetPassword("token", "password123", "password123");
  expect(mock).toHaveBeenCalledWith(
    "/api/v1/password-recovery",
    expect.objectContaining({
      method: "PATCH",
      body: JSON.stringify({
        token: "token",
        password: "password123",
        password_confirmation: "password123",
      }),
    }),
  );
});

test.each([
  [
    400,
    "Invalid or expired recovery link.",
    "Este link é inválido ou expirou. Peça um novo link de recuperação.",
  ],
  [
    400,
    "Password confirmation does not match.",
    "As senhas precisam ser iguais.",
  ],
  [403, "", "Encerre a personificação antes de recuperar uma senha."],
  [500, "", "Não foi possível concluir agora. Tente novamente."],
])("Explains recovery failure %s", async (status, message, expected) => {
  jest
    .spyOn(globalThis, "fetch")
    .mockResolvedValue({ status, json: async () => ({ message }) });
  await expect(
    resetPassword("token", "password123", "password123"),
  ).rejects.toThrow(expected);
});

test("Explains network errors without exposing the submitted data", async () => {
  jest.spyOn(globalThis, "fetch").mockRejectedValue(new Error("private"));
  await expect(requestPasswordRecovery("reader@example.com")).rejects.toThrow(
    "Não foi possível conectar. Verifique sua conexão e tente novamente.",
  );
});
