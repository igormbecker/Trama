import ButtonActionIcon from "components/icons/ButtonActionIcon";
import EditIcon from "components/icons/EditIcon";
import useActionState from "components/shared/useActionState";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { saveStructure } from "./structureClient";
import styles from "./works.module.css";
import SuccessIcon from "components/shared/SuccessIcon";
import { getProjectLabels } from "./projectLabels";
import MoveToTrashButton from "./MoveToTrashButton";

export default function WorkDetails({ work, canManage }) {
  const labels = getProjectLabels(work.type);
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(work.title);
  const [description, setDescription] = useState(work.description);
  const [busy, setBusy, pendingRef] = useActionState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const titleField = useRef(null);
  const panel = useRef(null);
  const editButton = useRef(null);
  useEffect(() => {
    if (editing) {
      titleField.current?.focus();
    } else if (saved) {
      panel.current?.scrollIntoView({ block: "start", behavior: "instant" });
    }
  }, [editing, saved]);

  async function save(event) {
    event.preventDefault();
    if (pendingRef.current) {
      return;
    }
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
      aria-label={`Dados de ${work.title}`}
    >
      {saved && (
        <p role="status" className={styles.savedNotice}>
          <SuccessIcon />
          {labels.title} {work.type === "group_assignment" ? "salvo" : "salva"}{" "}
          com sucesso.
        </p>
      )}
      {editing ? (
        <>
          <h2>Editar {labels.name}</h2>
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
              <button type="submit" disabled={busy} aria-busy={busy}>
                <ButtonActionIcon action="save" />
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
                <ButtonActionIcon action="cancel" />
                Cancelar
              </button>
            </div>
          </form>
        </>
      ) : (
        <>
          <h2>Descrição</h2>
          <p className={styles.description}>
            {work.description ||
              `${labels.thisProject} ainda não tem descrição.`}
          </p>
          {canManage && (
            <div className={styles.actions}>
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
                <EditIcon className={styles.actionIcon} />
                Editar {labels.name}
              </button>
              <MoveToTrashButton
                path={`/api/v1/works/${work.id}`}
                title={work.title}
                label={`Excluir ${labels.name}`}
                description="O projeto inteiro sairá da sua lista e ficará indisponível para participantes. Partes, textos, convites e históricos serão preservados."
                redirectTo="/works?trashed=1"
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}
