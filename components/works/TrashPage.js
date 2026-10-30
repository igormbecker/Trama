import ButtonActionIcon from "components/icons/ButtonActionIcon";
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import AppLayout from "components/app/AppLayout";
import SuccessMessage from "components/shared/SuccessMessage";
import useActionState from "components/shared/useActionState";
import { saveStructure } from "./structureClient";
import { getProjectLabels } from "./projectLabels";
import styles from "./works.module.css";
import PermanentlyDeleteButton from "./PermanentlyDeleteButton";

export default function TrashPage({ user, items }) {
  const router = useRouter();
  const [busyId, setBusyId, pendingRef] = useActionState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function restore(item) {
    if (pendingRef.current) {
      return;
    }
    setBusyId(item.id);
    setError("");
    setMessage("");
    try {
      await saveStructure("/api/v1/trash", "POST", {
        kind: item.kind,
        id: item.id,
      });
      await router.replace(router.asPath, undefined, { scroll: false });
      setMessage(
        `“${item.title}” foi restaurado. Partes e capítulos/seções retornam ao final da lista e podem ser reordenados.`,
      );
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusyId(null);
    }
  }
  return (
    <AppLayout
      user={user}
      activePage="trash"
      title="Lixeira | Trama"
      description="Restaure seus projetos, partes e textos."
      backHref="/works"
      backLabel="Voltar aos projetos"
    >
      <section className={styles.workspace} aria-labelledby="trash-title">
        <Link href="/works">← Meus projetos</Link>
        <div className={styles.heading}>
          <h1 id="trash-title">Lixeira</h1>
          <p>
            Somente o responsável pode restaurar ou excluir para sempre. O
            conteúdo é preservado até a exclusão definitiva.
          </p>
        </div>
        <p>
          Restaure primeiro o projeto ou a parte para acessar os itens excluídos
          dentro dele. Itens excluídos separadamente continuam na lixeira até
          serem restaurados.
        </p>
        {error && <p role="alert">{error}</p>}
        {message && <SuccessMessage>{message}</SuccessMessage>}
        {items.length === 0 ? (
          <p className={styles.emptyState}>Nenhum item na lixeira.</p>
        ) : (
          <ul className={styles.workList}>
            {items.map((item) => {
              const labels = getProjectLabels(item.project_type);
              const kindLabel =
                item.kind === "work"
                  ? labels.type
                  : item.kind === "part"
                    ? "Parte"
                    : labels.chapterTitle;
              return (
                <li key={`${item.kind}:${item.id}`} className={styles.panel}>
                  <p>{kindLabel}</p>
                  <h2>{item.title}</h2>
                  {item.kind !== "work" && (
                    <p>
                      Projeto: {item.work_title}
                      {item.kind === "chapter"
                        ? ` · Parte: ${item.parent_title}`
                        : ""}
                    </p>
                  )}
                  <div className={styles.actions}>
                    <button
                      type="button"
                      disabled={Boolean(busyId)}
                      aria-busy={busyId === item.id}
                      onClick={() => restore(item)}
                    >
                      <ButtonActionIcon action="restore" />
                      {busyId === item.id ? "Restaurando…" : "Restaurar"}
                    </button>
                    <PermanentlyDeleteButton
                      item={item}
                      disabled={Boolean(busyId)}
                      onDeleted={() =>
                        setMessage(
                          `“${item.title}” foi excluído definitivamente.`,
                        )
                      }
                    />
                    {item.kind !== "work" && (
                      <Link href={`/works/${item.work_id}`}>Abrir projeto</Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </AppLayout>
  );
}
