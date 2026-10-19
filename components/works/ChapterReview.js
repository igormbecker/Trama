import { useCallback, useEffect, useRef, useState } from "react";
import ChapterReader from "./ChapterReader";
import SuccessMessage from "components/shared/SuccessMessage";
import styles from "./chapter.module.css";

export default function ChapterReview({
  request,
  editable,
  busy,
  onAction,
  success,
  error,
}) {
  const readerRef = useRef(null);
  const commentInputRef = useRef(null);
  const commentRefs = useRef({});
  const [selection, setSelection] = useState(null);
  const [message, setMessage] = useState("");
  const [selectionError, setSelectionError] = useState("");
  const comments = request.review_comments || [];
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
            commentInputRef.current?.focus();
            commentInputRef.current?.scrollIntoView({ block: "center" });
          }}
        >
          Comentar trecho
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
            onComment={(id) => commentRefs.current[id]?.focus()}
          />
        </article>
        <aside
          className={styles.reviewComments}
          aria-label="Comentários da revisão"
        >
          <h4>Comentários ({comments.length})</h4>
          {selectionError && <p role="alert">{selectionError}</p>}
          {editable && selection && (
            <form onSubmit={addComment} className={styles.reviewComment}>
              <blockquote>{selection.quote}</blockquote>
              <label htmlFor={`review-comment-${request.id}`}>
                Comentário sobre o trecho
              </label>
              <textarea
                ref={commentInputRef}
                id={`review-comment-${request.id}`}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                required
                maxLength={5000}
                disabled={busy}
              />
              <button type="submit" disabled={busy}>
                Salvar comentário
              </button>
            </form>
          )}
          {!comments.length && <p>Nenhum comentário salvo.</p>}
          {comments.map((comment, index) => (
            <div
              key={comment.id}
              ref={(element) => {
                commentRefs.current[comment.id] = element;
              }}
              tabIndex={-1}
              className={styles.reviewComment}
            >
              <h5>Comentário {index + 1}</h5>
              <blockquote>{comment.quote}</blockquote>
              <p>{comment.message}</p>
              {editable && (
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
          ))}
        </aside>
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
