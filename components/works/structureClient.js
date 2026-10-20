export async function saveStructure(path, method, body) {
  let response;
  try {
    response = await fetch(path, {
      method,
      credentials: "same-origin",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      "Não foi possível conectar. Seus dados continuam no formulário. Tente novamente.",
    );
  }
  if (!response.ok) {
    const error = new Error(
      response.status === 401
        ? "Sua sessão expirou. Entre novamente para continuar."
        : response.status === 404
          ? "Esta parte, capítulo ou obra não está disponível para sua conta."
          : response.status === 400
            ? "Confira os dados e a ordem dos itens. A estrutura pode ter sido alterada em outra aba; atualize a página se necessário."
            : "Não foi possível salvar. Tente novamente.",
    );
    error.status = response.status;
    throw error;
  }
  return response.status === 204 ? null : response.json();
}
