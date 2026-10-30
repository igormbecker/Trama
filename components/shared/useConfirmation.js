import ButtonActionIcon from "components/icons/ButtonActionIcon";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import styles from "./confirmation.module.css";

export function ConfirmationDialog({ request, onDecision }) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  const headingId = useId();
  const messageId = useId();
  useEffect(() => {
    if (request) {
      dialogRef.current?.showModal();
      cancelRef.current?.focus();
    }
  }, [request]);
  if (!request) {
    return null;
  }
  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={headingId}
      aria-describedby={messageId}
      onCancel={(event) => {
        event.preventDefault();
        onDecision(false);
      }}
    >
      <h2 id={headingId}>{request.title}</h2>
      <p id={messageId}>{request.message}</p>
      <div className={styles.actions}>
        <button
          type="button"
          className={request.danger ? styles.danger : undefined}
          onClick={() => onDecision(true)}
        >
          <ButtonActionIcon
            action={request.icon || (request.danger ? "trash" : "check")}
          />
          {request.confirmLabel || "Confirmar"}
        </button>
        <button ref={cancelRef} type="button" onClick={() => onDecision(false)}>
          <ButtonActionIcon action="cancel" />
          Cancelar
        </button>
      </div>
    </dialog>
  );
}

export default function useConfirmation() {
  const [request, setRequest] = useState(null);
  const resolveRef = useRef(null);
  const confirm = useCallback((options) => {
    if (resolveRef.current) {
      return Promise.resolve(false);
    }
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setRequest(options);
    });
  }, []);
  const decide = useCallback((accepted) => {
    const resolve = resolveRef.current;
    resolveRef.current = null;
    setRequest(null);
    resolve?.(accepted);
  }, []);
  useEffect(
    () => () => {
      resolveRef.current?.(false);
      resolveRef.current = null;
    },
    [],
  );
  return {
    confirm,
    confirmationDialog: (
      <ConfirmationDialog request={request} onDecision={decide} />
    ),
  };
}
