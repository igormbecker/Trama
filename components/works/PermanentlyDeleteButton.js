import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/router";
import useActionState from "components/shared/useActionState";
import { saveStructure } from "./structureClient";
import styles from "./works.module.css";

export default function PermanentlyDeleteButton({ item, disabled, onDeleted }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy, pendingRef] = useActionState(false);
  const [error, setError] = useState("");
  const dialog = useRef(null);
  const headingId = useId();
  const fieldId = useId();
  useEffect(() => {
    if (open) dialog.current?.showModal();
  }, [open]);
  async function remove(event) {
    event.preventDefault();
    if (pendingRef.current || confirmation !== item.title) return;
    setBusy(true);
    setError("");
    try {
      await saveStructure("/api/v1/trash", "DELETE", {
        kind: item.kind,
        id: item.id,
        confirmation,
      });
      await router.replace(router.asPath, undefined, { scroll: false });
      dialog.current?.close();
      setOpen(false);
      onDeleted?.();
    } catch (failure) {
      setError(
        failure.status === 400
          ? "Digite o título exatamente como aparece acima."
          : failure.message,
      );
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
        onClick={() => {
          setConfirmation("");
          setError("");
          setOpen(true);
        }}
      >
        Excluir para sempre
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
          <h2 id={headingId}>Excluir para sempre?</h2>
          <p>
            <strong>{item.title}</strong>
          </p>
          <p>
            Esta ação não pode ser desfeita pela lixeira. O item, seus textos,
            revisões, contribuições e demais itens contidos nele serão apagados
            definitivamente do Trama. Arquivos já baixados e cópias locais nos
            navegadores não são apagados por esta ação.
          </p>
          <form onSubmit={remove}>
            <label htmlFor={fieldId}>
              Digite o título para confirmar: {item.title}
            </label>
            <input
              id={fieldId}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              disabled={busy}
              autoComplete="off"
              required
            />
            {error && <p role="alert">{error}</p>}
            <div className={styles.actions}>
              <button
                type="submit"
                className={styles.dangerButton}
                disabled={busy || confirmation !== item.title}
                aria-busy={busy}
              >
                {busy ? "Excluindo…" : "Excluir para sempre"}
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
          </form>
        </dialog>
      )}
    </>
  );
}
