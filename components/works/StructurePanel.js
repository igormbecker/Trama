import ActionIcon from "components/icons/StructureActionIcon";
import useActionState from "components/shared/useActionState";
import LoadingMessage from "components/shared/LoadingMessage";
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
import { getProjectLabels } from "./projectLabels";
import MoveToTrashButton from "./MoveToTrashButton";
import MobileStructureMenu from "./MobileStructureMenu";
import StructureEntry from "./StructureEntry";

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
        <button type="submit" disabled={isBusy} aria-busy={isBusy}>
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

export default function StructurePanel({
  workId,
  parts = [],
  canManage,
  projectType,
}) {
  const labels = getProjectLabels(projectType);
  const router = useRouter();
  const [form, setForm] = useState(null);
  const [isBusy, setIsBusy, pendingRef] = useActionState(false);
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
    if (savedEntry && savedNotice.current) {
      focusSavedChapter(savedNotice.current);
    }
  }, [savedEntry]);
  function cancelForm() {
    setForm(null);
  }
  async function perform(path, method, input, closeForm = false) {
    if (pendingRef.current) {
      return;
    }
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
      if (closeForm) {
        setForm(null);
      }
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
          <span aria-hidden="true">↑</span>
          <span className={styles.orderLabel}>Mover para cima</span>
        </button>
        <button
          type="button"
          disabled={isBusy || index === items.length - 1}
          aria-label={`Mover ${items[index].title} para baixo`}
          onClick={() => move(items, index, 1, path)}
        >
          <span aria-hidden="true">↓</span>
          <span className={styles.orderLabel}>Mover para baixo</span>
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
      <div className={styles.structureHeading}>
        <h2 id="structure-title">Partes e {labels.chapters}</h2>
        {canManage && (
          <button
            type="button"
            className={styles.addPartButton}
            disabled={isBusy || Boolean(form)}
            onClick={() => openForm({ entry: {} })}
          >
            <ActionIcon className={styles.actionIcon} action="add" /> Adicionar
            parte
          </button>
        )}
      </div>
      <LoadingMessage pending={isBusy}>Salvando estrutura…</LoadingMessage>
      {error && <p role="alert">{error}</p>}
      {message && <SuccessMessage>{message}</SuccessMessage>}
      {form && (
        <section
          ref={formPanel}
          className={`${styles.panel} ${styles.structureForm}`}
          aria-label={
            isChapterForm
              ? `Formulário de ${labels.chapter}`
              : "Formulário de parte"
          }
        >
          <h3>
            {isChapterForm && form.entry.id
              ? `Editar descrição — ${form.entry.title}`
              : `${form.entry.id ? "Editar" : "Adicionar"} ${isChapterForm ? labels.chapter : "parte"}`}
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
          {labels.thisProject} ainda não tem partes.{" "}
          {canManage
            ? `Adicione uma parte para organizar ${projectType === "group_assignment" ? "as seções" : "os capítulos"}.`
            : "O responsável ainda está organizando a estrutura."}
        </p>
      )}
      <ol className={styles.workList}>
        {parts.map((part, partIndex) => (
          <StructureEntry key={part.id} className={styles.panel}>
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
            <div className={styles.structureEntryHeading}>
              <h3>
                {part.position}. {part.title}
              </h3>
              {canManage && (
                <button
                  type="button"
                  className={styles.structureHeadingAction}
                  disabled={isBusy || Boolean(form)}
                  onClick={() => openForm({ partId: part.id, entry: {} })}
                  aria-label={`Adicionar ${labels.chapter} em ${part.title}`}
                >
                  <ActionIcon className={styles.actionIcon} action="add" />{" "}
                  Adicionar {labels.chapter}
                </button>
              )}
              {canManage && (
                <MobileStructureMenu
                  label="Opções da parte"
                  title={part.title}
                  disabled={isBusy || Boolean(form)}
                >
                  <button
                    type="button"
                    className={styles.overflowOnlyAction}
                    disabled={isBusy || Boolean(form)}
                    onClick={() => openForm({ partId: part.id, entry: {} })}
                  >
                    <ActionIcon className={styles.actionIcon} action="add" />{" "}
                    Adicionar {labels.chapter}
                  </button>
                  <button
                    type="button"
                    disabled={isBusy || Boolean(form)}
                    onClick={() => openForm({ entry: part })}
                    aria-label={`Editar parte ${part.title}`}
                  >
                    <ActionIcon className={styles.actionIcon} action="edit" />{" "}
                    Editar parte
                  </button>
                  {orderButtons(parts, partIndex, basePath)}
                  <MoveToTrashButton
                    path={`${basePath}/${part.id}`}
                    title={part.title}
                    label="Excluir parte"
                    description="A parte e todas as suas seções/capítulos sairão do projeto, incluindo o texto e os pedidos editoriais associados."
                    disabled={isBusy || Boolean(form)}
                  />
                </MobileStructureMenu>
              )}
            </div>
            {canManage && (
              <div
                data-structure-actions
                className={`${styles.actions} ${styles.structurePrimaryActions}`}
              >
                <button
                  type="button"
                  disabled={isBusy || Boolean(form)}
                  onClick={() => openForm({ partId: part.id, entry: {} })}
                  aria-label={`Adicionar ${labels.chapter} em ${part.title}`}
                >
                  <ActionIcon className={styles.actionIcon} action="add" />{" "}
                  Adicionar {labels.chapter}
                </button>
                <div className={styles.desktopStructureActions}>
                  <button
                    type="button"
                    disabled={isBusy || Boolean(form)}
                    onClick={() => openForm({ entry: part })}
                    aria-label={`Editar parte ${part.title}`}
                  >
                    <ActionIcon className={styles.actionIcon} action="edit" />{" "}
                    Editar parte
                  </button>
                  {orderButtons(parts, partIndex, basePath)}
                  <MoveToTrashButton
                    path={`${basePath}/${part.id}`}
                    title={part.title}
                    label="Excluir parte"
                    description="A parte e todas as suas seções/capítulos sairão do projeto, incluindo o texto e os pedidos editoriais associados."
                    disabled={isBusy || Boolean(form)}
                  />
                </div>
              </div>
            )}
            {part.chapters.length === 0 && (
              <p>
                {projectType === "group_assignment"
                  ? "Nenhuma seção"
                  : "Nenhum capítulo"}{" "}
                nesta parte.
              </p>
            )}
            <ol className={styles.workList}>
              {part.chapters.map((chapter, chapterIndex) => (
                <StructureEntry key={chapter.id} className={styles.chapter}>
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
                  <div className={styles.structureEntryHeading}>
                    <h4>
                      <Link href={`/works/${workId}/chapters/${chapter.id}`}>
                        {part.position}.{chapter.position}. {chapter.title}
                      </Link>
                    </h4>
                    {canManage && (
                      <MobileStructureMenu
                        label={`Opções ${projectType === "group_assignment" ? "da seção" : "do capítulo"}`}
                        title={chapter.title}
                        disabled={isBusy || Boolean(form)}
                      >
                        <Link
                          className={styles.writeButton}
                          data-button
                          href={`/works/${workId}/chapters/${chapter.id}?write=1`}
                        >
                          <ActionIcon
                            className={styles.actionIcon}
                            action="write"
                          />{" "}
                          Escrever {labels.chapter}
                        </Link>
                        <button
                          type="button"
                          disabled={isBusy || Boolean(form)}
                          onClick={() =>
                            openForm({ partId: part.id, entry: chapter })
                          }
                          aria-label={`Editar descrição de ${chapter.title}`}
                        >
                          <ActionIcon
                            className={styles.actionIcon}
                            action="edit"
                          />{" "}
                          Editar descrição
                        </button>
                        {orderButtons(
                          part.chapters,
                          chapterIndex,
                          `${basePath}/${part.id}/chapters`,
                        )}
                        <MoveToTrashButton
                          path={`${basePath}/${part.id}/chapters/${chapter.id}`}
                          title={chapter.title}
                          label={`Excluir ${labels.chapter}`}
                          description="Este item sairá da estrutura, da leitura e da exportação, junto com seus pedidos editoriais."
                          disabled={isBusy || Boolean(form)}
                        />
                      </MobileStructureMenu>
                    )}
                  </div>
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
                    <div
                      data-structure-actions
                      className={`${styles.actions} ${styles.structurePrimaryActions}`}
                    >
                      <Link
                        className={styles.writeButton}
                        data-button
                        href={`/works/${workId}/chapters/${chapter.id}?write=1`}
                      >
                        <ActionIcon
                          className={styles.actionIcon}
                          action="write"
                        />{" "}
                        Escrever {labels.chapter}
                      </Link>
                      <div className={styles.desktopStructureActions}>
                        <button
                          type="button"
                          disabled={isBusy || Boolean(form)}
                          onClick={() =>
                            openForm({ partId: part.id, entry: chapter })
                          }
                          aria-label={`Editar descrição de ${chapter.title}`}
                        >
                          <ActionIcon
                            className={styles.actionIcon}
                            action="edit"
                          />{" "}
                          Editar descrição
                        </button>
                        {orderButtons(
                          part.chapters,
                          chapterIndex,
                          `${basePath}/${part.id}/chapters`,
                        )}
                        <MoveToTrashButton
                          path={`${basePath}/${part.id}/chapters/${chapter.id}`}
                          title={chapter.title}
                          label={`Excluir ${labels.chapter}`}
                          description="Este item sairá da estrutura, da leitura e da exportação, junto com seus pedidos editoriais."
                          disabled={isBusy || Boolean(form)}
                        />
                      </div>
                    </div>
                  )}
                </StructureEntry>
              ))}
            </ol>
          </StructureEntry>
        ))}
      </ol>
    </section>
  );
}
