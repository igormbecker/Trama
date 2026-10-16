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
  if (response.status === 401) {
    throw new Error("Sua sessão expirou. Entre novamente.");
  }
  if (response.status === 403) {
    throw new Error("Somente administradores podem gerenciar usuários.");
  }
  if (response.status === 404) {
    throw new Error("Este usuário não foi encontrado. Atualize a lista.");
  }
  if (response.status === 400) {
    const body = await response.json().catch(() => ({}));
    const messages = {
      "The informed username is already in use.":
        "Este nome de usuário já está em uso.",
      "The informed e-mail is already in use.":
        "Este e-mail já está cadastrado.",
      "You cannot delete your own account.":
        "Você não pode remover sua própria conta.",
    };
    throw new Error(
      messages[body?.message] ||
        "Confira os dados informados e tente novamente.",
    );
  }
  const expectedStatus =
    method === "POST" ? 201 : method === "DELETE" ? 204 : 200;
  if (response.status !== expectedStatus) {
    throw new Error("Não foi possível concluir a operação. Tente novamente.");
  }
  return response.status === 204 ? undefined : response.json();
}

export function listUsers() {
  return request("/api/v1/users", "GET");
}
export function saveUser(values, originalUsername) {
  const body = {
    name: values.name.trim(),
    username: values.username.trim(),
    email: values.email.trim(),
  };
  if (!originalUsername || values.password !== "") {
    body.password = values.password;
  }
  return request(
    originalUsername
      ? `/api/v1/users/${encodeURIComponent(originalUsername)}`
      : "/api/v1/users",
    originalUsername ? "PATCH" : "POST",
    body,
  );
}
export function removeUser(username) {
  return request(`/api/v1/users/${encodeURIComponent(username)}`, "DELETE");
}
