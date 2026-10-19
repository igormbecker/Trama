import { useState } from "react";
import ChapterEditor from "./ChapterEditor";
import ChapterReader from "./ChapterReader";
import { chapterRequest } from "./chapterClient";
import SuccessMessage from "components/shared/SuccessMessage";
import styles from "./chapter.module.css";

const statusLabels = {
  writing: "Em escrita",
  waiting: "Aguardando aprovação",
  approved: "Aprovada",
  canceled: "Cancelada",
};
const kindLabels = { contribution: "Contribuição", review: "Revisão" };

export default function EditorialRequestPanel({
  user,
  work,
  content,
  setContent,
  initialRequestContent,
  participants,
}) {
  const [requestContent, setRequestContent] = useState(initialRequestContent);
  const [assignee, setAssignee] = useState("");
  const [kind, setKind] = useState("contribution");
  const [instructions, setInstructions] = useState("");
  const [message, setMessage] = useState("");
  const [token, setToken] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [unsaved, setUnsaved] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [reviewedConflict, setReviewedConflict] = useState(false);
  const [historyDetails, setHistoryDetails] = useState(null);
  const isOwner = work.owner_id === user.id;
  const path = `/api/v1/works/${work.id}/chapters/${content.chapter.id}/request`;
  const current = requestContent?.request;
  const active = current && ["writing", "waiting"].includes(current.status);
  const assigned = current?.assignee_user_id === user.id && !isOwner;

  async function refresh() {
    const updated = await chapterRequest(path);
    setRequestContent(updated);
    return updated;
  }
  async function perform(operation, successText) {
    if (busy) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await operation();
      await refresh();
      setContent(await chapterRequest(path.replace(/\/request$/, "")));
      setSuccess(successText);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  async function create(event) {
    event.preventDefault();
    await perform(async () => {
      await chapterRequest(path, "POST", {
        assignee_user_id: assignee,
        kind,
        instructions,
      });
      setInstructions("");
      setAssignee("");
    }, "Pedido editorial criado.");
  }
  async function start() {
    setBusy(true);
    setError("");
    let lease;
    try {
      lease = await chapterRequest(`${path}/lease`, "POST", {});
      await refresh();
      setToken(lease.token);
    } catch (failure) {
      if (lease)
        await chapterRequest(`${path}/lease`, "DELETE", {
          token: lease.token,
        }).catch(() => {});
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  async function close({ pending } = {}) {
    await chapterRequest(`${path}/lease`, "DELETE", { token }).catch(() => {});
    setToken(null);
    setUnsaved(Boolean(pending));
    try {
      await refresh();
    } catch (failure) {
      setError(failure.message);
    }
  }
  async function restart() {
    await chapterRequest(`${path}/lease`, "DELETE", { token }).catch(() => {});
    setToken(null);
    await start();
  }
  async function submit() {
    if (unsaved) {
      setError(
        "Há texto pendente no navegador. Reabra a cópia e confirme o salvamento antes de enviar.",
      );
      return;
    }
    await perform(
      () => chapterRequest(path, "PATCH", { action: "submit" }),
      "Entrega enviada ao responsável.",
    );
  }
  async function adjust(event) {
    event.preventDefault();
    await perform(async () => {
      await chapterRequest(path, "PATCH", { action: "adjust", message });
      setMessage("");
    }, "Ajustes solicitados.");
  }
  async function approve(confirmConflict = false) {
    setBusy(true);
    setError("");
    try {
      await chapterRequest(path, "PATCH", {
        action: "approve",
        expected_chapter_revision: content.revision,
        ...(confirmConflict ? { confirm_conflict: true } : {}),
      });
      await refresh();
      setContent(await chapterRequest(path.replace(/\/request$/, "")));
      setConflict(false);
      setReviewedConflict(false);
      setSuccess("Entrega aprovada e incorporada ao capítulo.");
    } catch (failure) {
      if (failure.status === 409) {
        setContent(await chapterRequest(path.replace(/\/request$/, "")));
        setConflict(true);
      }
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  async function restore() {
    if (
      !window.confirm(
        "Restaurar o texto anterior à aprovação? O texto atual será substituído, mas continuará registrado nesta entrega.",
      )
    )
      return;
    await perform(
      () =>
        chapterRequest(path, "PATCH", {
          action: "restore",
          expected_chapter_revision: content.revision,
          confirm_conflict: true,
        }),
      "Texto anterior restaurado no capítulo.",
    );
  }
  async function viewHistory(id) {
    setError("");
    try {
      setHistoryDetails(
        await chapterRequest(`${path}?requestId=${encodeURIComponent(id)}`),
      );
    } catch (failure) {
      setError(failure.message);
    }
  }
  return (
    <section
      className={styles.editorialPanel}
      aria-labelledby="editorial-title"
    >
      <h2 id="editorial-title">Contribuição e revisão</h2>
      <p>
        A escrita do responsável continua livre. Um pedido opcional permite que
        uma pessoa trabalhe em uma cópia antes da aprovação.
      </p>
      {error && <p role="alert">{error}</p>}
      {success && <SuccessMessage>{success}</SuccessMessage>}
      {current && (
        <div className={styles.editorialCard}>
          <h3>
            {kindLabels[current.kind]} · {statusLabels[current.status]}
          </h3>
          <p>
            <strong>Instruções:</strong> {current.instructions}
          </p>
          {current.adjustment_message && current.status === "writing" && (
            <p>
              <strong>Ajustes pedidos:</strong> {current.adjustment_message}
            </p>
          )}
          {assigned &&
            current.status === "writing" &&
            (token ? (
              <ChapterEditor
                key={token}
                path={path}
                userId={user.id}
                content={requestContent}
                token={token}
                draftKey={`${user.id}:${content.chapter.id}:request:${current.id}`}
                onClose={close}
                onRestart={restart}
              />
            ) : (
              <div className={styles.editorialActions}>
                <button type="button" disabled={busy} onClick={start}>
                  Trabalhar na cópia
                </button>
                <button type="button" disabled={busy} onClick={submit}>
                  Enviar entrega
                </button>
              </div>
            ))}
          {assigned && current.status === "waiting" && (
            <p>
              Sua entrega foi preservada e aguarda a decisão do responsável.
            </p>
          )}
          {isOwner && current.status === "writing" && (
            <p>
              A pessoa atribuída está trabalhando em uma cópia. O texto atual do
              capítulo continua disponível para sua escrita.
            </p>
          )}
          {isOwner && current.status === "waiting" && (
            <>
              <h4>Texto enviado</h4>
              <div className={styles.editorialText}>
                <ChapterReader document={current.submitted_document} />
              </div>
              <h4>Texto atual do capítulo</h4>
              <div className={styles.editorialText}>
                <ChapterReader document={content.document} />
              </div>
              {content.revision !== current.base_chapter_revision && (
                <p role="alert">
                  O capítulo mudou desde o início do pedido. Compare os dois
                  textos antes de substituir o atual.
                </p>
              )}
              <div className={styles.editorialActions}>
                <button
                  type="button"
                  disabled={
                    busy ||
                    conflict ||
                    content.revision !== current.base_chapter_revision
                  }
                  onClick={() => approve()}
                >
                  Aprovar e incorporar
                </button>
              </div>
              {(conflict ||
                content.revision !== current.base_chapter_revision) && (
                <div className={styles.editorialActions}>
                  <label>
                    <input
                      type="checkbox"
                      checked={reviewedConflict}
                      onChange={(event) =>
                        setReviewedConflict(event.target.checked)
                      }
                    />{" "}
                    Comparei os textos e autorizo substituir o texto atual.
                  </label>
                  <button
                    type="button"
                    disabled={busy || !reviewedConflict}
                    onClick={() => approve(true)}
                  >
                    Confirmar substituição
                  </button>
                </div>
              )}
              <form onSubmit={adjust}>
                <label htmlFor="adjustment-message">Solicitar ajustes</label>
                <textarea
                  id="adjustment-message"
                  required
                  maxLength={5000}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  disabled={busy}
                />
                <button type="submit" disabled={busy}>
                  Pedir ajustes
                </button>
              </form>
            </>
          )}
          {isOwner && active && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (
                  window.confirm("Cancelar este pedido sem incorporar a cópia?")
                )
                  perform(
                    () => chapterRequest(path, "PATCH", { action: "cancel" }),
                    "Pedido cancelado.",
                  );
              }}
            >
              Cancelar pedido
            </button>
          )}
          {isOwner && current.events?.length > 0 && (
            <details>
              <summary>Histórico deste pedido</summary>
              <ol>
                {current.events.map((event, index) => (
                  <li key={index}>
                    {event.action === "submitted"
                      ? "Entrega enviada"
                      : event.action === "adjusted"
                        ? `Ajustes solicitados: ${event.message}`
                        : event.action === "approved"
                          ? "Entrega aprovada"
                          : event.action === "restored"
                            ? "Texto anterior restaurado"
                            : "Pedido cancelado"}
                  </li>
                ))}
              </ol>
            </details>
          )}
          {isOwner &&
            current.status === "approved" &&
            current.previous_document && (
              <details>
                <summary>Texto anterior à aprovação</summary>
                <div className={styles.editorialText}>
                  <ChapterReader document={current.previous_document} />
                </div>
                {!current.restored_at && (
                  <>
                    <h4>Texto atual</h4>
                    <div className={styles.editorialText}>
                      <ChapterReader document={content.document} />
                    </div>
                    <button type="button" disabled={busy} onClick={restore}>
                      Restaurar texto anterior
                    </button>
                  </>
                )}
              </details>
            )}
        </div>
      )}
      {isOwner && !active && participants.length > 0 && (
        <form className={styles.editorialCard} onSubmit={create}>
          <h3>Novo pedido por capítulo</h3>
          <label htmlFor="editorial-assignee">Pessoa participante</label>
          <select
            id="editorial-assignee"
            required
            value={assignee}
            onChange={(event) => setAssignee(event.target.value)}
            disabled={busy}
          >
            <option value="">Selecione uma pessoa</option>
            {participants.map((participant) => (
              <option key={participant.user_id} value={participant.user_id}>
                {participant.name}
              </option>
            ))}
          </select>
          <label htmlFor="editorial-kind">Tipo de pedido</label>
          <select
            id="editorial-kind"
            value={kind}
            onChange={(event) => setKind(event.target.value)}
            disabled={busy}
          >
            <option value="contribution">Contribuição</option>
            <option value="review">Revisão</option>
          </select>
          <label htmlFor="editorial-instructions">
            O que precisa ser feito?
          </label>
          <textarea
            id="editorial-instructions"
            required
            maxLength={5000}
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            disabled={busy}
          />
          <button type="submit" disabled={busy}>
            Criar pedido
          </button>
        </form>
      )}
      {isOwner &&
        requestContent?.history?.some((entry) => entry.id !== current?.id) && (
          <div className={styles.editorialCard}>
            <h3>Pedidos anteriores</h3>
            <ul>
              {requestContent.history
                .filter((entry) => entry.id !== current?.id)
                .map((entry) => (
                  <li key={entry.id}>
                    {kindLabels[entry.kind]} · {statusLabels[entry.status]} ·{" "}
                    {new Date(entry.created_at).toLocaleDateString("pt-BR")}{" "}
                    <button type="button" onClick={() => viewHistory(entry.id)}>
                      Ver pedido
                    </button>
                  </li>
                ))}
            </ul>
            {historyDetails?.request && (
              <div>
                <h4>Pedido selecionado</h4>
                <p>{historyDetails.request.instructions}</p>
                {historyDetails.request.submitted_document && (
                  <>
                    <h4>Entrega</h4>
                    <div className={styles.editorialText}>
                      <ChapterReader
                        document={historyDetails.request.submitted_document}
                      />
                    </div>
                  </>
                )}
                {historyDetails.request.previous_document && (
                  <>
                    <h4>Texto anterior à aprovação</h4>
                    <div className={styles.editorialText}>
                      <ChapterReader
                        document={historyDetails.request.previous_document}
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
    </section>
  );
}
