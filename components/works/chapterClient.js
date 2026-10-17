export async function chapterRequest(path, method = "GET", body) {
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
    throw new Error(
      "Sem conexão. Seu texto continua nesta tela. Tente salvar novamente.",
    );
  }
  if (!response.ok) {
    const messages = {
      401: "Sua sessão expirou. Entre novamente em outra aba e reabra o editor para recuperar o rascunho.",
      404: "Você não tem acesso a este capítulo.",
      409: "A reserva de edição expirou ou o capítulo mudou em outra aba. Reabra o editor para comparar e recuperar seu rascunho.",
      400: "Não foi possível salvar este conteúdo. Use apenas a formatação disponível e até 1 MB por capítulo.",
      413: "O conteúdo ultrapassa o limite de 1 MB por capítulo.",
    };
    const error = new Error(
      messages[response.status] ||
        "Não foi possível salvar. Seu texto continua nesta tela.",
    );
    error.status = response.status;
    throw error;
  }
  return response.status === 204 ? null : response.json();
}
