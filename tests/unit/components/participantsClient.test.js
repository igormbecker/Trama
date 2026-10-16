import { jest } from "@jest/globals";
import {
  copyInvitationLink,
  inviteOrganizer,
  cancelInvitation,
  removeParticipant,
  respondToInvitation,
  listMyInvitations,
  respondToMyInvitation,
} from "components/works/participantsClient.js";
afterEach(() => jest.restoreAllMocks());

test("Lists invitations for the session and responds without requiring the shared token", async () => {
  const mock = jest.spyOn(globalThis, "fetch").mockResolvedValue({
    status: 200,
    json: async () => [],
  });
  await expect(listMyInvitations()).resolves.toEqual([]);
  expect(mock).toHaveBeenLastCalledWith(
    "/api/v1/invitations",
    expect.objectContaining({
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    }),
  );
  await respondToMyInvitation("invitation-id", "decline");
  expect(mock).toHaveBeenLastCalledWith(
    "/api/v1/invitations",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({
        invitation_id: "invitation-id",
        action: "decline",
      }),
    }),
  );
});

test("Creates an organizer invitation using only the email and session cookie", async () => {
  const mock = jest.spyOn(globalThis, "fetch").mockResolvedValue({
    status: 201,
    json: async () => ({ token: "example" }),
  });
  await expect(
    inviteOrganizer("work-id", " guest@trama.test "),
  ).resolves.toEqual({ token: "example" });
  expect(mock).toHaveBeenCalledWith(
    "/api/v1/works/work-id/invitations",
    expect.objectContaining({
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      body: JSON.stringify({ email: "guest@trama.test" }),
    }),
  );
});
test("Cancels an invitation and removes only the selected participant", async () => {
  const mock = jest
    .spyOn(globalThis, "fetch")
    .mockResolvedValue({ status: 204 });
  await cancelInvitation("work-id", "invite-id");
  await removeParticipant("work-id", "user-id");
  expect(mock).toHaveBeenNthCalledWith(
    1,
    "/api/v1/works/work-id/invitations/invite-id",
    expect.objectContaining({ method: "DELETE" }),
  );
  expect(mock).toHaveBeenNthCalledWith(
    2,
    "/api/v1/works/work-id/participants/user-id",
    expect.objectContaining({ method: "DELETE" }),
  );
});
test.each(["accept", "decline"])(
  "Sends invitation action %s",
  async (action) => {
    const mock = jest.spyOn(globalThis, "fetch").mockResolvedValue({
      status: 200,
      json: async () => ({ status: "done" }),
    });
    await respondToInvitation("token", action);
    expect(mock).toHaveBeenCalledWith(
      "/api/v1/invitations/token",
      expect.objectContaining({ body: JSON.stringify({ action }) }),
    );
  },
);
test.each([
  [401, "Sua sessão expirou. Entre novamente."],
  [
    404,
    "Este convite, obra ou participante não está disponível para sua conta.",
  ],
  [500, "Não foi possível concluir a operação. Tente novamente."],
])("Explains HTTP %s", async (status, message) => {
  jest.spyOn(globalThis, "fetch").mockResolvedValue({ status });
  await expect(inviteOrganizer("id", "reader@trama.test")).rejects.toThrow(
    message,
  );
});
test("Explains existing membership and network failures", async () => {
  const mock = jest
    .spyOn(globalThis, "fetch")
    .mockResolvedValueOnce({
      status: 400,
      json: async () => ({
        message: "This account already participates in the work.",
      }),
    })
    .mockRejectedValueOnce(new Error("internal network details"));
  await expect(inviteOrganizer("id", "reader@trama.test")).rejects.toThrow(
    "Esta conta já participa da obra.",
  );
  await expect(inviteOrganizer("id", "reader@trama.test")).rejects.toThrow(
    "Não foi possível conectar. Tente novamente.",
  );
  expect(mock).toHaveBeenCalledTimes(2);
});

test("Copies the complete invitation link to the clipboard", async () => {
  const link = "http://localhost:3001/invitations/example-token";
  const clipboard = { writeText: jest.fn().mockResolvedValue(undefined) };
  await expect(copyInvitationLink(link, clipboard)).resolves.toBeUndefined();
  expect(clipboard.writeText).toHaveBeenCalledWith(link);
});
test.each([
  null,
  { writeText: jest.fn().mockRejectedValue(new Error("permission denied")) },
])(
  "Explains clipboard unavailability without reporting success",
  async (clipboard) => {
    await expect(
      copyInvitationLink("invitation-link", clipboard),
    ).rejects.toThrow(
      "Não foi possível copiar automaticamente. Selecione o link e copie manualmente.",
    );
  },
);

test("Copies over HTTP when the Clipboard API is unavailable and restores focus", async () => {
  const field = {
    value: "",
    style: {},
    setAttribute: jest.fn(),
    focus: jest.fn(),
    select: jest.fn(),
    remove: jest.fn(),
  };
  const previousFocus = { focus: jest.fn() };
  const documentObject = {
    createElement: jest.fn(() => field),
    body: { appendChild: jest.fn() },
    execCommand: jest.fn(() => true),
    activeElement: previousFocus,
  };
  await expect(
    copyInvitationLink(
      "http://192.168.1.20:3001/invitations/example",
      null,
      documentObject,
    ),
  ).resolves.toBeUndefined();
  expect(field.value).toBe("http://192.168.1.20:3001/invitations/example");
  expect(field.select).toHaveBeenCalled();
  expect(documentObject.execCommand).toHaveBeenCalledWith("copy");
  expect(field.remove).toHaveBeenCalled();
  expect(previousFocus.focus).toHaveBeenCalled();
});

test("Reports a failed HTTP fallback and removes the temporary field", async () => {
  const field = {
    style: {},
    setAttribute: jest.fn(),
    focus: jest.fn(),
    select: jest.fn(),
    remove: jest.fn(),
  };
  const documentObject = {
    createElement: () => field,
    body: { appendChild: jest.fn() },
    execCommand: jest.fn(() => false),
  };
  await expect(
    copyInvitationLink("link", null, documentObject),
  ).rejects.toThrow("Não foi possível copiar automaticamente.");
  expect(field.remove).toHaveBeenCalled();
});
