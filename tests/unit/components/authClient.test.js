import { jest } from "@jest/globals";
import { signIn, signOut } from "components/auth/authClient.js";

afterEach(() => {
  jest.restoreAllMocks();
});

describe("Sign in", () => {
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
