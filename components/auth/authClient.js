const connectionErrorMessage =
  "Não foi possível conectar. Verifique sua conexão e tente novamente.";

export async function signIn(email, password) {
  let response;

  try {
    response = await fetch("/api/v1/sessions", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });
  } catch {
    throw new Error(connectionErrorMessage);
  }

  if (response.status === 401) {
    throw new Error("E-mail ou senha não conferem.");
  }

  if (response.status === 403) {
    const body = await response.json().catch(() => ({}));
    if (body.name === "EmailVerificationRequiredError") {
      const error = new Error("Confirme seu e-mail antes de entrar.");
      error.verificationRequired = true;
      throw error;
    }
  }

  if (response.status !== 201) {
    throw new Error("Não foi possível entrar agora. Tente novamente.");
  }
}

export async function signOut() {
  let response;

  try {
    response = await fetch("/api/v1/sessions", {
      method: "DELETE",
      credentials: "same-origin",
    });
  } catch {
    throw new Error(connectionErrorMessage);
  }

  if (response.status !== 204) {
    throw new Error("Não foi possível sair agora. Tente novamente.");
  }
}

export async function signUp(input) {
  let response;

  try {
    response = await fetch("/api/v1/users", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: input.name.trim(),
        username: input.username.trim(),
        email: input.email.trim(),
        password: input.password,
      }),
    });
  } catch {
    throw new Error(connectionErrorMessage);
  }

  if (response.status === 400) {
    const body = await response.json().catch(() => ({}));
    const messages = {
      "The informed username is already in use.":
        "Este nome de usuário já está em uso. Escolha outro.",
      "The informed e-mail is already in use.":
        "Este e-mail já está cadastrado. Entre na sua conta ou use outro e-mail.",
    };
    throw new Error(
      messages[body.message] ||
        "Confira os dados do cadastro e tente novamente.",
    );
  }

  if (response.status !== 201) {
    throw new Error("Não foi possível criar sua conta agora. Tente novamente.");
  }
}
