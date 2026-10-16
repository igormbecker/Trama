export async function saveAccount(values) {
  const password = values.password ?? "";
  const confirmation = values.password_confirmation ?? "";
  if (password !== confirmation) {
    throw new Error("As senhas não coincidem.");
  }
  const body = {
    name: values.name.trim(),
    username: values.username.trim(),
    email: values.email.trim(),
  };
  if (password !== "") {
    body.password = password;
    body.password_confirmation = confirmation;
  }
  let response;
  try {
    response = await fetch("/api/v1/user", {
      method: "PATCH",
      credentials: "same-origin",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Não foi possível conectar. Tente novamente.");
  }
  if (response.status === 401) {
    throw new Error("Sua sessão expirou. Entre novamente.");
  }
  if (response.status === 400) {
    const body = await response.json().catch(() => ({}));
    const messages = {
      "Password confirmation does not match.": "As senhas não coincidem.",
      "The informed username is already in use.":
        "Este nome de usuário já está em uso.",
      "The informed e-mail is already in use.":
        "Este e-mail já está cadastrado.",
    };
    throw new Error(
      messages[body?.message] || "Confira seus dados e tente novamente.",
    );
  }
  if (response.status !== 200) {
    throw new Error("Não foi possível salvar seus dados. Tente novamente.");
  }
  return response.json();
}
