async function sendRecoveryRequest(method, body, successStatus) {
  let response;
  try {
    response = await fetch("/api/v1/password-recovery", {
      method,
      credentials: "same-origin",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      "Não foi possível conectar. Verifique sua conexão e tente novamente.",
    );
  }
  if (response.status === successStatus) {
    return;
  }
  if (response.status === 403) {
    throw new Error("Encerre a personificação antes de recuperar uma senha.");
  }
  if (response.status === 400) {
    const result = await response.json().catch(() => ({}));
    const messages = {
      "Provide a valid email address.":
        "Confira o endereço de e-mail informado.",
      "Invalid or expired recovery link.":
        "Este link é inválido ou expirou. Peça um novo link de recuperação.",
      "Password confirmation does not match.": "As senhas precisam ser iguais.",
      "Password must have 8 to 128 characters.":
        "Use uma senha de 8 a 128 caracteres.",
    };
    throw new Error(
      messages[result.message] || "Confira os dados e tente novamente.",
    );
  }
  throw new Error("Não foi possível concluir agora. Tente novamente.");
}

export function requestPasswordRecovery(email) {
  return sendRecoveryRequest("POST", { email: email.trim() }, 202);
}

export function resetPassword(token, password, passwordConfirmation) {
  return sendRecoveryRequest(
    "PATCH",
    { token, password, password_confirmation: passwordConfirmation },
    204,
  );
}
