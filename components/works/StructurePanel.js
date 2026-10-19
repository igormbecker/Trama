import SuccessMessage from "components/shared/SuccessMessage";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { saveStructure } from "./structureClient";
import {
  focusStructureForm,
  focusSavedChapter,
  savedStructureEntry,
} from "./focusStructureForm";
import styles from "./works.module.css";
import SuccessIcon from "components/shared/SuccessIcon";
import ChapterEditorialStatus from "./ChapterEditorialStatus";

function ActionIcon({ action }) {
  const paths = {
    add: "M12 5v14M5 12h14",
    edit: "m15 4 5 5M4 20l5-1L21 7l-5-5L4 14v6Z",
    write: "M14 3H5v18h14V11M8 8h3M8 12h3m2 3 2-5 5-5 3 3-5 5-5 2Z",
  };
  return (
    <svg
      className={styles.actionIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[action]} />
    </svg>
  );
}

function StructureForm({ initialValues, isChapter, isBusy, onSave, onCancel }) {
  const [title, setTitle] = useState(initialValues.title || "");
  const [description, setDescription] = useState(
    initialValues.description || "",
  );
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave(isChapter ? { title, description } : { title });
      }}
    >
      <label>
        Título
        <input
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          maxLength={255}
          disabled={isBusy}
        />
      </label>
      {isChapter && (
        <label>
          Descrição (opcional)
          <textarea
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={5000}
            rows={3}
            disabled={isBusy}
          />
        </label>
      )}
      <div className={styles.actions}>
        <button type="submit" disabled={isBusy}>
          {isBusy ? "Salvando…" : "Salvar"}
        </button>
        <button
          type="button"
          className={styles.dangerButton}
          disabled={isBusy}
          onClick={onCancel}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function StructurePanel({ workId, parts = [], canManage }) {
  const router = useRouter();
  const [form, setForm] = useState(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [savedEntry, setSavedEntry] = useState(null);
  const savedNotice = useRef(null);
  const formPanel = useRef(null);
  const formTrigger = useRef(null);
  const basePath = `/api/v1/works/${workId}/parts`;

  function openForm(nextForm) {
    formTrigger.current = document.activeElement;
    setForm(nextForm);
    setSavedEntry(null);
    setError("");
    setMessage("");
  }
  useEffect(() => {
    if (form && formPanel.current) {
      focusStructureForm(
        formPanel.current,
        Boolean(form.partId && form.entry.id),
      );
    } else if (!form && !savedEntry) {
      formTrigger.current?.focus();
    }
  }, [form, savedEntry]);
  useEffect(() => {
    if (savedEntry && savedNotice.current)
      focusSavedChapter(savedNotice.current);
  }, [savedEntry]);
  function cancelForm() {
    setForm(null);
  }
  async function perform(path, method, input, closeForm = false) {
    if (isBusy) return;
    setIsBusy(true);
    setError("");
    setMessage("");
    setSavedEntry(null);
    try {
      await saveStructure(path, method, input);
      await router.replace(router.asPath, undefined, { scroll: false });
      if (closeForm && form?.entry.id) {
        setSavedEntry(savedStructureEntry(form));
      } else {
        setMessage("Estrutura salva com sucesso.");
      }
      if (closeForm) setForm(null);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsBusy(false);
    }
  }
  function move(items, index, offset, path) {
    const ids = items.map((item) => item.id);
    [ids[index], ids[index + offset]] = [ids[index + offset], ids[index]];
    perform(path, "PATCH", { ids });
  }
  function orderButtons(items, index, path) {
    return (
      <span className={styles.orderActions}>
        <button
          type="button"
          disabled={isBusy || index === 0}
          aria-label={`Mover ${items[index].title} para cima`}
          onClick={() => move(items, index, -1, path)}
        >
          ↑
        </button>
        <button
          type="button"
          disabled={isBusy || index === items.length - 1}
          aria-label={`Mover ${items[index].title} para baixo`}
          onClick={() => move(items, index, 1, path)}
        >
          ↓
        </button>
      </span>
    );
  }
  const isChapterForm = Boolean(form?.partId);
  const formPath = form
    ? `${basePath}${isChapterForm ? `/${form.partId}/chapters` : ""}${form.entry.id ? `/${form.entry.id}` : ""}`
    : "";

  return (
    <section
      aria-labelledby="structure-title"
      className={styles.structure}
      aria-busy={isBusy}
    >
      <h2 id="structure-title">Partes e capítulos</h2>
      {error && <p role="alert">{error}</p>}
      {message && <SuccessMessage>{message}</SuccessMessage>}
      {canManage && (
        <div className={styles.panel}>
          <button
            type="button"
            disabled={isBusy || Boolean(form)}
            onClick={() => openForm({ entry: {} })}
          >
            <ActionIcon action="add" /> Adicionar parte
          </button>
        </div>
      )}
      {form && (
        <section
          ref={formPanel}
          className={`${styles.panel} ${styles.structureForm}`}
          aria-label={
            isChapterForm ? "Formulário de capítulo" : "Formulário de parte"
          }
        >
          <h3>
            {isChapterForm && form.entry.id
              ? `Editar descrição — ${form.entry.title}`
              : `${form.entry.id ? "Editar" : "Adicionar"} ${isChapterForm ? "capítulo" : "parte"}`}
          </h3>
          <StructureForm
            key={formPath}
            initialValues={form.entry}
            isChapter={isChapterForm}
            isBusy={isBusy}
            onCancel={cancelForm}
            onSave={(input) =>
              perform(formPath, form.entry.id ? "PATCH" : "POST", input, true)
            }
          />
        </section>
      )}
      {parts.length === 0 && (
        <p>
          Esta obra ainda não tem partes.{" "}
          {canManage
            ? "Adicione uma parte para organizar os capítulos."
            : "O responsável ainda está organizando a estrutura."}
        </p>
      )}
      <ol className={styles.workList}>
        {parts.map((part, partIndex) => (
          <li key={part.id} className={styles.panel}>
            {savedEntry?.type === "part" && savedEntry.id === part.id && (
              <p
                ref={savedNotice}
                role="status"
                tabIndex={-1}
                className={styles.savedNotice}
              >
                <SuccessIcon />
                Parte salva com sucesso.
              </p>
            )}
            <h3>
              {part.position}. {part.title}
            </h3>
            {canManage && (
              <div className={styles.actions}>
                <button
                  type="button"
                  disabled={isBusy || Boolean(form)}
                  onClick={() => openForm({ entry: part })}
                  aria-label={`Editar parte ${part.title}`}
                >
                  <ActionIcon action="edit" /> Editar parte
                </button>
                <button
                  type="button"
                  disabled={isBusy || Boolean(form)}
                  onClick={() => openForm({ partId: part.id, entry: {} })}
                  aria-label={`Adicionar capítulo em ${part.title}`}
                >
                  <ActionIcon action="add" /> Adicionar capítulo
                </button>
                {orderButtons(parts, partIndex, basePath)}
              </div>
            )}
            {part.chapters.length === 0 && <p>Nenhum capítulo nesta parte.</p>}
            <ol className={styles.workList}>
              {part.chapters.map((chapter, chapterIndex) => (
                <li key={chapter.id} className={styles.chapter}>
                  {savedEntry?.type === "chapter" &&
                    savedEntry.id === chapter.id && (
                      <p
                        ref={savedNotice}
                        role="status"
                        tabIndex={-1}
                        className={styles.savedNotice}
                      >
                        <SuccessIcon />
                        Descrição salva com sucesso.
                      </p>
                    )}
                  <h4>
                    <Link href={`/works/${workId}/chapters/${chapter.id}`}>
                      {part.position}.{chapter.position}. {chapter.title}
                    </Link>
                  </h4>
                  <ChapterEditorialStatus request={chapter.editorial_request} />
                  {chapter.description && (
                    <div
                      className={styles.chapterDescription}
                      role="region"
                      aria-label={`Descrição de ${chapter.title}`}
                      tabIndex={0}
                    >
                      <p className={styles.description}>
                        {chapter.description}
                      </p>
                    </div>
                  )}
                  {canManage && (
                    <div className={styles.actions}>
                      <Link
                        className={styles.writeButton}
                        href={`/works/${workId}/chapters/${chapter.id}?write=1`}
                      >
                        <ActionIcon action="write" /> Escrever capítulo
                      </Link>
                      <button
                        type="button"
                        disabled={isBusy || Boolean(form)}
                        onClick={() =>
                          openForm({ partId: part.id, entry: chapter })
                        }
                        aria-label={`Editar descrição de ${chapter.title}`}
                      >
                        <ActionIcon action="edit" /> Editar descrição
                      </button>
                      {orderButtons(
                        part.chapters,
                        chapterIndex,
                        `${basePath}/${part.id}/chapters`,
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ol>
    </section>
  );
}
