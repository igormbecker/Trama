import { jest } from "@jest/globals";
import { signIn, signOut, signUp } from "components/auth/authClient.js";

afterEach(() => {
  jest.restoreAllMocks();
});

describe("Sign in", () => {
  test("Identifies pending verification only from the authenticated login response", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue({
      status: 403,
      json: async () => ({ name: "EmailVerificationRequiredError" }),
    });
    await expect(
      signIn("reader@trama.test", "validpassword"),
    ).rejects.toMatchObject({ verificationRequired: true });
  });
  test("Sends credentials to the session API and relies on its cookie", async () => {
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({ status: 201 });
    await expect(
      signIn(" reader@trama.test ", "example-password"),
    ).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/sessions", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "reader@trama.test",
        password: "example-password",
      }),
    });
  });

  test("Explains invalid credentials in Portuguese", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue({ status: 401 });
    await expect(signIn("reader@trama.test", "incorrect")).rejects.toThrow(
      "E-mail ou senha não conferem.",
    );
  });

  test("Does not expose server errors to the user", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue({ status: 500 });
    await expect(
      signIn("reader@trama.test", "example-password"),
    ).rejects.toThrow("Não foi possível entrar agora. Tente novamente.");
  });

  test("Explains connection failures without exposing internal details", async () => {
    jest
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("internal network details"));
    await expect(
      signIn("reader@trama.test", "example-password"),
    ).rejects.toThrow(
      "Não foi possível conectar. Verifique sua conexão e tente novamente.",
    );
  });
});

describe("Sign out", () => {
  test("Waits for the session API to confirm logout", async () => {
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({ status: 204 });
    await expect(signOut()).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/sessions", {
      method: "DELETE",
      credentials: "same-origin",
    });
  });

  test("Does not report success when logout fails", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue({ status: 500 });
    await expect(signOut()).rejects.toThrow(
      "Não foi possível sair agora. Tente novamente.",
    );
  });

  test("Keeps the user informed if the connection fails during logout", async () => {
    jest
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("internal details"));
    await expect(signOut()).rejects.toThrow(
      "Não foi possível conectar. Verifique sua conexão e tente novamente.",
    );
  });
});

describe("Sign up", () => {
  const input = {
    name: " Pessoa Leitora ",
    username: " leitora ",
    email: " reader@trama.test ",
    password: "example-password",
  };

  test("Sends trimmed profile fields while preserving the password", async () => {
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({ status: 201 });
    await expect(signUp(input)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/users", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Pessoa Leitora",
        username: "leitora",
        email: "reader@trama.test",
        password: input.password,
      }),
    });
  });

  test.each([
    [
      "The informed username is already in use.",
      "Este nome de usuário já está em uso. Escolha outro.",
    ],
    [
      "The informed e-mail is already in use.",
      "Este e-mail já está cadastrado. Entre na sua conta ou use outro e-mail.",
    ],
    [
      "Invalid registration data.",
      "Confira os dados do cadastro e tente novamente.",
    ],
  ])("Explains validation error: %s", async (message, expected) => {
    jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({ status: 400, json: async () => ({ message }) });
    await expect(signUp(input)).rejects.toThrow(expected);
  });

  test("Hides unexpected server details", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue({ status: 500 });
    await expect(signUp(input)).rejects.toThrow(
      "Não foi possível criar sua conta agora. Tente novamente.",
    );
  });

  test("Explains connection failures", async () => {
    jest
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("internal details"));
    await expect(signUp(input)).rejects.toThrow(
      "Não foi possível conectar. Verifique sua conexão e tente novamente.",
    );
  });
});
