import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { saveStructure } from "./structureClient";
import styles from "./works.module.css";
import SuccessIcon from "components/shared/SuccessIcon";

export default function WorkDetails({ work, canManage }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(work.title);
  const [description, setDescription] = useState(work.description);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const titleField = useRef(null);
  const panel = useRef(null);
  const editButton = useRef(null);
  useEffect(() => {
    if (editing) titleField.current?.focus();
    else if (saved)
      panel.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [editing, saved]);

  async function save(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await saveStructure(`/api/v1/works/${work.id}`, "PATCH", {
        title,
        description,
      });
      await router.replace(router.asPath, undefined, { scroll: false });
      setEditing(false);
      setSaved(true);
    } catch (failure) {
      setError(
        failure.status === 400
          ? "Confira o título (até 255 caracteres) e a descrição (até 5.000 caracteres)."
          : failure.message,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      ref={panel}
      className={`${styles.panel} ${styles.structureForm}`}
      aria-label="Dados da obra"
    >
      {saved && (
        <p role="status" className={styles.savedNotice}>
          <SuccessIcon />
          Obra salva com sucesso.
        </p>
      )}
      {editing ? (
        <>
          <h2>Editar obra</h2>
          <form onSubmit={save} aria-busy={busy}>
            <label>
              Título
              <input
                ref={titleField}
                name="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                maxLength={255}
                disabled={busy}
              />
            </label>
            <label>
              Descrição (opcional)
              <textarea
                name="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={5000}
                rows={5}
                disabled={busy}
              />
            </label>
            {error && <p role="alert">{error}</p>}
            <div className={styles.actions}>
              <button type="submit" disabled={busy}>
                {busy ? "Salvando…" : "Salvar"}
              </button>
              <button
                type="button"
                className={styles.dangerButton}
                disabled={busy}
                onClick={() => {
                  setEditing(false);
                  setError("");
                  requestAnimationFrame(() => editButton.current?.focus());
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </>
      ) : (
        <>
          <h2>Descrição</h2>
          <p className={styles.description}>
            {work.description || "Esta obra ainda não tem descrição."}
          </p>
          {canManage && (
            <button
              ref={editButton}
              type="button"
              onClick={() => {
                setTitle(work.title);
                setDescription(work.description);
                setSaved(false);
                setEditing(true);
              }}
            >
              <svg
                className={styles.actionIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m15 4 5 5M4 20l5-1L21 7l-5-5L4 14v6Z" />
              </svg>
              Editar obra
            </button>
          )}
        </>
      )}
    </section>
  );
}
