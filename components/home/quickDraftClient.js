import { v4 as uuidv4 } from "uuid";

export function createQuickDraftStarter({
  userId,
  storage,
  fetcher,
  navigate,
  timeZone,
}) {
  const storageKey = `trama:quick-draft:${userId}`;
  let attempt;
  let destination;
  let running;

  function clearAttempt() {
    attempt = null;
    try {
      storage.removeItem(storageKey);
    } catch {
      // Writing stays available when browser storage is blocked.
    }
  }

  function getAttempt() {
    if (attempt) {
      return attempt;
    }
    let saved;
    try {
      saved = JSON.parse(storage.getItem(storageKey));
    } catch {
      // Keep an in-memory attempt when browser storage is unavailable.
    }
    attempt =
      saved?.request_id && saved?.time_zone
        ? saved
        : {
            request_id: uuidv4(),
            time_zone: timeZone || "UTC",
          };
    try {
      storage.setItem(storageKey, JSON.stringify(attempt));
    } catch {
      // Retries in this page still use the same attempt.
    }
    return attempt;
  }

  async function run() {
    if (!destination) {
      let response;
      let created;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      try {
        response = await fetcher("/api/v1/works/quick-drafts", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(getAttempt()),
          signal: controller.signal,
        });
        if (response.ok) {
          created = await response.json();
        }
      } catch {
        throw new Error(
          "Não foi possível abrir o rascunho. Tente novamente; a mesma tentativa será retomada.",
        );
      } finally {
        clearTimeout(timeout);
      }
      if (!response.ok) {
        if ([400, 409].includes(response.status)) {
          clearAttempt();
        }
        const messages = {
          400: "Não foi possível preparar o rascunho. Clique novamente para tentar outra vez.",
          401: "Sua sessão expirou. Entre novamente para começar a escrever.",
          403: "Não foi possível iniciar a escrita. Confira as pendências da sua conta e tente novamente.",
          409: "Este rascunho não está mais disponível. Clique novamente para começar outro.",
        };
        throw new Error(
          messages[response.status] ||
            "Não foi possível abrir o rascunho. Tente novamente; a mesma tentativa será retomada.",
        );
      }
      destination = `/works/${created.work_id}/chapters/${created.chapter_id}?write=1`;
    }
    try {
      const navigated = await navigate(destination);
      if (!navigated) {
        throw new Error("Navigation interrupted");
      }
    } catch {
      throw new Error(
        "Seu rascunho já foi criado, mas não foi possível abrir o editor. Clique novamente para abri-lo.",
      );
    }
    clearAttempt();
    destination = null;
  }

  return {
    destination: () => destination,
    start() {
      if (!running) {
        running = run().finally(() => {
          running = null;
        });
      }
      return running;
    },
  };
}
