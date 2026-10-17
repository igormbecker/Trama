import { useState } from "react";
import { useRouter } from "next/router";
import { saveStructure } from "./structureClient";
import styles from "./works.module.css";

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
  const basePath = `/api/v1/works/${workId}/parts`;

  function openForm(nextForm) {
    setForm(nextForm);
    setError("");
    setMessage("");
  }
  async function perform(path, method, input, closeForm = false) {
    if (isBusy) return;
    setIsBusy(true);
    setError("");
    setMessage("");
    try {
      await saveStructure(path, method, input);
      if (closeForm) setForm(null);
      await router.replace(router.asPath, undefined, { scroll: false });
      setMessage("Estrutura salva com sucesso.");
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
      <>
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
      </>
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
      {message && <p role="status">{message}</p>}
      {canManage && (
        <div className={styles.panel}>
          <button
            type="button"
            disabled={isBusy || Boolean(form)}
            onClick={() => openForm({ entry: {} })}
          >
            Adicionar parte
          </button>
        </div>
      )}
      {form && (
        <section
          className={styles.panel}
          aria-label={
            isChapterForm ? "Formulário de capítulo" : "Formulário de parte"
          }
        >
          <h3>
            {form.entry.id ? "Editar" : "Adicionar"}{" "}
            {isChapterForm ? "capítulo" : "parte"}
          </h3>
          <StructureForm
            key={formPath}
            initialValues={form.entry}
            isChapter={isChapterForm}
            isBusy={isBusy}
            onCancel={() => setForm(null)}
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
                  Editar parte
                </button>
                <button
                  type="button"
                  disabled={isBusy || Boolean(form)}
                  onClick={() => openForm({ partId: part.id, entry: {} })}
                  aria-label={`Adicionar capítulo em ${part.title}`}
                >
                  Adicionar capítulo
                </button>
                {orderButtons(parts, partIndex, basePath)}
              </div>
            )}
            {part.chapters.length === 0 && <p>Nenhum capítulo nesta parte.</p>}
            <ol className={styles.workList}>
              {part.chapters.map((chapter, chapterIndex) => (
                <li key={chapter.id} className={styles.chapter}>
                  <h4>
                    {part.position}.{chapter.position}. {chapter.title}
                  </h4>
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
                      <button
                        type="button"
                        disabled={isBusy || Boolean(form)}
                        onClick={() =>
                          openForm({ partId: part.id, entry: chapter })
                        }
                        aria-label={`Editar capítulo ${chapter.title}`}
                      >
                        Editar capítulo
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
