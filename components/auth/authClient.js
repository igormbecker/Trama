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
