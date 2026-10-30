import QuickWriteIcon from "components/icons/QuickWriteIcon";
import { useRef, useState } from "react";
import { useRouter } from "next/router";
import useActionState from "components/shared/useActionState";
import { createQuickDraftStarter } from "./quickDraftClient";
import styles from "./workspace.module.css";

export default function QuickWriteButton({ userId }) {
  const router = useRouter();
  const [pending, setPending, pendingRef] = useActionState();
  const starter = useRef(null);
  const [created, setCreated] = useState(false);
  const [error, setError] = useState("");

  async function startWriting() {
    if (pendingRef.current) {
      return;
    }
    setPending(true);
    setError("");
    try {
      if (!starter.current) {
        starter.current = createQuickDraftStarter({
          userId,
          storage: {
            getItem: (key) => window.sessionStorage.getItem(key),
            setItem: (key, value) => window.sessionStorage.setItem(key, value),
            removeItem: (key) => window.sessionStorage.removeItem(key),
          },
          fetcher: (...args) => fetch(...args),
          navigate: (path) => router.push(path),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
      }
      await starter.current.start();
      setCreated(false);
    } catch (failure) {
      setCreated(Boolean(starter.current?.destination()));
      setError(
        failure.message ||
          "Não foi possível abrir o rascunho. Tente novamente.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.quickWrite}>
      <button
        className={styles.primary}
        type="button"
        onClick={startWriting}
        disabled={pending}
        aria-busy={pending}
      >
        <QuickWriteIcon />
        {pending
          ? "Abrindo rascunho…"
          : created
            ? "Abrir rascunho criado"
            : "Começar a escrever"}
      </button>
      <p className={styles.quickWriteHint}>Uma ideia nova? Abra um rascunho.</p>
      {error && (
        <p className={styles.quickWriteError} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
