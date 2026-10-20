import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/router";
import useActionState from "components/shared/useActionState";
import { saveStructure } from "./structureClient";
import styles from "./works.module.css";

export default function MoveToTrashButton({
  path,
  title,
  label,
  description,
  disabled,
  onMoved,
  redirectTo,
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy, pendingRef] = useActionState(false);
  const [error, setError] = useState("");
  const dialog = useRef(null);
  const headingId = useId();
  useEffect(() => {
    if (open) dialog.current?.showModal();
  }, [open]);
  async function move() {
    if (pendingRef.current) return;
    setBusy(true);
    setError("");
    try {
      await saveStructure(path, "DELETE");
      if (redirectTo) await router.push(redirectTo);
      else await router.replace(router.asPath, undefined, { scroll: false });
      dialog.current?.close();
      setOpen(false);
      onMoved?.();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button
        type="button"
        className={styles.dangerButton}
        disabled={disabled || busy}
        aria-label={`${label}: ${title}`}
        onClick={() => {
          setError("");
          setOpen(true);
        }}
      >
        {label}
      </button>
      {open && (
        <dialog
          ref={dialog}
          className={`${styles.panel} ${styles.trashDialog}`}
          aria-labelledby={headingId}
          onCancel={(event) => {
            if (pendingRef.current) event.preventDefault();
            else setOpen(false);
          }}
        >
          <h2 id={headingId}>Mover para a lixeira?</h2>
          <p>
            <strong>{title}</strong>
          </p>
          <p>
            {description} O conteúdo será preservado e você poderá restaurá-lo
            na lixeira.
          </p>
          {error && <p role="alert">{error}</p>}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.dangerButton}
              onClick={move}
              disabled={busy}
              aria-busy={busy}
            >
              {busy ? "Movendo…" : "Mover para lixeira"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                dialog.current?.close();
                setOpen(false);
              }}
            >
              Cancelar
            </button>
          </div>
        </dialog>
      )}
    </>
  );
}
