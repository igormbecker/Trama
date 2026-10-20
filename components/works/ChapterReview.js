import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import ChapterReader from "./ChapterReader";
import SuccessMessage from "components/shared/SuccessMessage";
import LoadingMessage from "components/shared/LoadingMessage";
import SuccessIcon from "components/shared/SuccessIcon";
import styles from "./chapter.module.css";

function subscribeViewport(onChange) {
  const viewport = window.matchMedia("(max-width: 800px)");
  viewport.addEventListener("change", onChange);
  return () => viewport.removeEventListener("change", onChange);
}
const mobileViewport = () => window.matchMedia("(max-width: 800px)").matches;
const serverViewport = () => false;

export default function ChapterReview({
  request,
  editable,
  canResolve = false,
  busy,
  onAction,
  success,
  error,
}) {
  const readerRef = useRef(null);
  const commentInputRef = useRef(null);
  const commentRefs = useRef({});
  const dialogRef = useRef(null);
  const panelId = useId();
  const isMobile = useSyncExternalStore(
    subscribeViewport,
    mobileViewport,
    serverViewport,
  );
  const [panelOpen, setPanelOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [activeCommentId, setActiveCommentId] = useState(null);
  const [filter, setFilter] = useState("pending");
  const [focusInput, setFocusInput] = useState(false);
  const [selection, setSelection] = useState(null);
  const [message, setMessage] = useState("");
  const [selectionError, setSelectionError] = useState("");
  const comments = request.review_comments || [];
  const pendingCount = comments.filter(
    (comment) => !comment.resolved_at,
  ).length;
  const visibleComments = comments.filter(
    (comment) =>
      filter === "all" ||
      (filter === "resolved"
        ? Boolean(comment.resolved_at)
        : !comment.resolved_at),
  );
  useEffect(() => {
    const dialog = dialogRef.current;
    if (isMobile && panelOpen && dialog && !dialog.open) dialog.showModal();
    if ((!isMobile || !panelOpen) && dialog?.open) dialog.close();
    if (!panelOpen) return;
    const target = focusInput
      ? commentInputRef.current
      : commentRefs.current[activeCommentId];
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: "nearest" });
  }, [isMobile, panelOpen, activeCommentId, filter, focusInput]);
  function openComment(id) {
    const comment = comments.find((entry) => entry.id === id);
    setFilter(comment?.resolved_at ? "resolved" : "pending");
    setActiveCommentId(id);
    setFocusInput(false);
    setPanelOpen(true);
    // Also focus on repeated clicks on the same marked passage.
    if (!isMobile || panelOpen) commentRefs.current[id]?.focus();
  }
  function closePanel() {
    setPanelOpen(false);
    setFocusInput(false);
  }
  function viewPassage(id) {
    const mark = Array.from(
      readerRef.current.querySelectorAll("[data-review-comments]"),
    ).find((element) => element.dataset.reviewComments.split(" ").includes(id));
    closePanel();
    setActiveCommentId(id);
    dialogRef.current?.close();
    mark?.focus({ preventScroll: true });
    mark?.scrollIntoView({ block: "center" });
  }
  const captureSelection = useCallback(() => {
    if (!editable) return;
    const selected = window.getSelection();
    if (!selected?.rangeCount || selected.isCollapsed) return;
    const range = selected.getRangeAt(0);
    const root = readerRef.current;
    if (
      !root.contains(range.startContainer) ||
      !root.contains(range.endContainer)
    )
      return;
    const prefix = range.cloneRange();
    prefix.selectNodeContents(root);
    prefix.setEnd(range.startContainer, range.startOffset);
    const start = prefix.toString().length;
    const quote = range.toString();
    setSelectionError(
      quote.length > 2000
        ? "Selecione até 2.000 caracteres por comentário."
        : "",
    );
    setSelection(
      quote.length <= 2000 ? { start, end: start + quote.length, quote } : null,
    );
  }, [editable]);
  useEffect(() => {
    document.addEventListener("selectionchange", captureSelection);
    return () =>
      document.removeEventListener("selectionchange", captureSelection);
  }, [captureSelection]);
  async function addComment(event) {
    event.preventDefault();
    if (await onAction({ action: "comment", ...selection, message })) {
      setMessage("");
      setSelection(null);
    }
  }
  const commentPanel = (
    <>
      <header className={styles.reviewCommentsHeader}>
        <h4 id={`${panelId}-title`}>Comentários</h4>
        <LoadingMessage pending={busy}>Atualizando revisão…</LoadingMessage>
        <p aria-live="polite">
          {pendingCount} pendentes · {comments.length - pendingCount} resolvidos
        </p>
        {error && <p role="alert">{error}</p>}
        {success && <SuccessMessage>{success}</SuccessMessage>}
        {isMobile && (
          <div className={styles.editorialActions}>
            <button type="button" onClick={() => setExpanded(!expanded)}>
              {expanded ? "Reduzir painel" : "Expandir painel"}
            </button>
            <button type="button" onClick={closePanel}>
              Fechar comentários
            </button>
          </div>
        )}
        <label htmlFor={`${panelId}-filter`}>Exibir</label>
        <select
          id={`${panelId}-filter`}
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="pending">Pendentes</option>
          <option value="resolved">Resolvidos</option>
          <option value="all">Todos</option>
        </select>
      </header>
      <div className={styles.reviewCommentsBody}>
        {selectionError && <p role="alert">{selectionError}</p>}
        {editable && selection && (
          <form onSubmit={addComment} className={styles.reviewComment}>
            <blockquote>{selection.quote}</blockquote>
            <label htmlFor={`${panelId}-input`}>
              Comentário sobre o trecho
            </label>
            <textarea
              ref={commentInputRef}
              id={`${panelId}-input`}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              required
              maxLength={5000}
              disabled={busy}
            />
            <button type="submit" disabled={busy} aria-busy={busy}>
              Salvar comentário
            </button>
          </form>
        )}
        {!visibleComments.length && (
          <p>
            {comments.length
              ? "Nenhum comentário neste filtro."
              : "Nenhum comentário salvo."}
          </p>
        )}
        {visibleComments.map((comment) => (
          <div
            key={comment.id}
            ref={(element) => {
              commentRefs.current[comment.id] = element;
            }}
            tabIndex={-1}
            className={`${styles.reviewComment} ${activeCommentId === comment.id ? styles.activeReviewComment : ""}`}
          >
            <h5>Comentário {comments.indexOf(comment) + 1}</h5>
            {comment.resolved_at && (
              <p className={styles.savedStatus}>
                <SuccessIcon /> Resolvido pelo responsável em{" "}
                {new Date(comment.resolved_at).toLocaleString("pt-BR")}
              </p>
            )}
            <blockquote>{comment.quote}</blockquote>
            <p>{comment.message}</p>
            <div className={styles.editorialActions}>
              <button type="button" onClick={() => viewPassage(comment.id)}>
                Ver trecho
              </button>
              {canResolve && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    onAction({
                      action: comment.resolved_at
                        ? "reopen_comment"
                        : "resolve_comment",
                      request_id: request.id,
                      comment_id: comment.id,
                    })
                  }
                >
                  {comment.resolved_at
                    ? "Reabrir comentário"
                    : "Marcar como resolvido"}
                </button>
              )}
              {editable && !comment.resolution_history?.length && (
                <button
                  className={styles.dangerButton}
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    onAction({
                      action: "remove_comment",
                      comment_id: comment.id,
                    })
                  }
                >
                  Remover comentário
                </button>
              )}
            </div>
            {comment.resolution_history?.length > 0 && (
              <details className={styles.commentHistory}>
                <summary>Histórico de resolução</summary>
                <ul>
                  {comment.resolution_history.map((event, index) => (
                    <li key={index}>
                      {event.action === "resolved" ? "Resolvido" : "Reaberto"}{" "}
                      pelo responsável ·{" "}
                      {new Date(event.created_at).toLocaleString("pt-BR")}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        ))}
      </div>
    </>
  );
  return (
    <section aria-label="Revisão por comentários">
      <p>
        Versão do capítulo enviada para revisão (revisão{" "}
        {request.base_chapter_revision}). Os comentários permanecem vinculados a
        este texto, mesmo que o responsável o altere depois.
      </p>
      {request.review_verdict && (
        <p>
          <strong>
            Parecer:{" "}
            {request.review_verdict === "approved"
              ? "Aprovado"
              : "Correções solicitadas"}
          </strong>
        </p>
      )}
      {editable && (
        <p>
          Selecione um trecho do texto para comentar. No celular, mantenha o
          dedo sobre o texto e ajuste a seleção.
        </p>
      )}
      {editable && selection && (
        <button
          className={styles.reviewSelectionAction}
          type="button"
          onClick={() => {
            setFocusInput(true);
            setPanelOpen(true);
            if (!isMobile || panelOpen) commentInputRef.current?.focus();
          }}
        >
          Comentar trecho
        </button>
      )}
      {canResolve && (
        <p>
          Marcar como resolvido registra que você tratou o apontamento no texto
          atual. O parecer e a versão revisada são preservados.
        </p>
      )}
      {isMobile && (
        <button
          type="button"
          className={styles.reviewCommentsToggle}
          aria-haspopup="dialog"
          aria-controls={panelId}
          aria-expanded={panelOpen}
          onClick={() => {
            setFocusInput(false);
            setPanelOpen(true);
          }}
        >
          Comentários · {pendingCount} pendentes
        </button>
      )}
      <div className={styles.reviewLayout}>
        <article
          ref={readerRef}
          className={styles.reviewReading}
          tabIndex={0}
          aria-label="Texto enviado para revisão"
          onMouseUp={captureSelection}
          onTouchEnd={captureSelection}
          onKeyUp={captureSelection}
        >
          <ChapterReader
            document={request.review_document}
            annotations={comments}
            onComment={openComment}
            activeCommentId={activeCommentId}
          />
        </article>
        {isMobile ? (
          <dialog
            ref={dialogRef}
            id={panelId}
            className={`${styles.reviewCommentsDialog} ${expanded ? styles.expandedCommentsDialog : ""}`}
            aria-labelledby={`${panelId}-title`}
            onCancel={closePanel}
            onClose={() => {
              closePanel();
            }}
          >
            {commentPanel}
          </dialog>
        ) : (
          <aside
            id={panelId}
            className={styles.reviewComments}
            aria-labelledby={`${panelId}-title`}
          >
            {commentPanel}
          </aside>
        )}
      </div>
      {editable && (
        <div className={styles.editorialActions}>
          <button
            className={styles.approveButton}
            type="button"
            disabled={busy || Boolean(message.trim())}
            onClick={() =>
              onAction({ action: "conclude_review", verdict: "approved" })
            }
          >
            Concluir: aprovado
          </button>
          <button
            className={styles.correctionButton}
            type="button"
            disabled={busy || !comments.length || Boolean(message.trim())}
            onClick={() =>
              onAction({
                action: "conclude_review",
                verdict: "changes_requested",
              })
            }
          >
            Concluir: correções solicitadas
          </button>
          {message.trim() && <p>Salve o comentário antes de concluir.</p>}
        </div>
      )}
      {(success || error) && (
        <div className={styles.reviewFeedback}>
          {error && <p role="alert">{error}</p>}
          {success && <SuccessMessage>{success}</SuccessMessage>}
        </div>
      )}
    </section>
  );
}
