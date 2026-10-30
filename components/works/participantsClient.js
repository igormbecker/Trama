async function request(path, method, body) {
  let response;
  try {
    response = await fetch(path, {
      method,
      credentials: "same-origin",
      cache: "no-store",
      ...(body === undefined
        ? {}
        : {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }),
    });
  } catch {
    throw new Error("Não foi possível conectar. Tente novamente.");
  }
  const expectedStatus =
    method === "DELETE"
      ? 204
      : method === "POST" && path.includes("/works/")
        ? 201
        : 200;
  if (response.status !== expectedStatus) {
    const data = await response.json?.().catch(() => ({}));
    const messages = {
      "Invalid invitation email.": "Informe um e-mail válido.",
      "This account already participates in the work.":
        "Esta conta já participa da obra.",
      "The owner cannot be removed.": "O responsável não pode ser removido.",
    };
    const message =
      response.status === 401
        ? "Sua sessão expirou. Entre novamente."
        : response.status === 404
          ? "Este convite, obra ou participante não está disponível para sua conta."
          : messages[data?.message] ||
            "Não foi possível concluir a operação. Tente novamente.";
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return response.status === 204 ? undefined : response.json();
}
export function inviteOrganizer(workId, email) {
  return request(
    `/api/v1/works/${encodeURIComponent(workId)}/invitations`,
    "POST",
    { email: email.trim() },
  );
}
export function cancelInvitation(workId, invitationId) {
  return request(
    `/api/v1/works/${encodeURIComponent(workId)}/invitations/${encodeURIComponent(invitationId)}`,
    "DELETE",
  );
}
export function removeParticipant(workId, userId) {
  return request(
    `/api/v1/works/${encodeURIComponent(workId)}/participants/${encodeURIComponent(userId)}`,
    "DELETE",
  );
}
export function respondToInvitation(token, action) {
  return request(`/api/v1/invitations/${encodeURIComponent(token)}`, "POST", {
    action,
  });
}

export function listMyInvitations() {
  return request("/api/v1/invitations", "GET");
}

export function respondToMyInvitation(invitationId, action) {
  return request("/api/v1/invitations", "POST", {
    invitation_id: invitationId,
    action,
  });
}

export async function copyInvitationLink(
  link,
  clipboard = globalThis.navigator?.clipboard,
  documentObject = globalThis.document,
) {
  if (clipboard?.writeText) {
    try {
      await clipboard.writeText(link);
      return;
    } catch {
      // Some browsers deny Clipboard API access; try selection-based copying.
    }
  }
  let field;
  const previousFocus = documentObject?.activeElement;
  try {
    if (!documentObject?.execCommand) {
      throw new Error("Clipboard unavailable");
    }
    field = documentObject.createElement("textarea");
    field.value = link;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.left = "-9999px";
    field.style.top = "0";
    field.style.fontSize = "16px";
    documentObject.body.appendChild(field);
    field.focus();
    field.select();
    if (!documentObject.execCommand("copy")) {
      throw new Error("Copy failed");
    }
  } catch {
    throw new Error(
      "Não foi possível copiar automaticamente. Selecione o link e copie manualmente.",
    );
  } finally {
    field?.remove();
    previousFocus?.focus({ preventScroll: true });
  }
}
