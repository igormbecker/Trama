import useActionState from "components/shared/useActionState";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import AppLayout from "components/app/AppLayout";
import ChapterEditor from "./ChapterEditor";
import ChapterReader from "./ChapterReader";
import EditorialRequestPanel from "./EditorialRequestPanel";
import { chapterRequest } from "./chapterClient";
import styles from "./chapter.module.css";
import useRecordAccess from "components/home/useRecordAccess";
import { getProjectLabels } from "./projectLabels";

export default function ChapterPage({
  user,
  work,
  content: initialContent,
  requestContent,
  participants,
}) {
  const labels = getProjectLabels(work.type);
  useRecordAccess(user.id, work.id, initialContent.chapter.id);
  const router = useRouter();
  const autoOpened = useRef(false);
  const [content, setContent] = useState(initialContent);
  const [token, setToken] = useState(null);
  const [busy, setBusy, pendingRef] = useActionState(false);
  const [error, setError] = useState("");
  const path = `/api/v1/works/${work.id}/chapters/${content.chapter.id}`;
  const start = useCallback(async () => {
    if (pendingRef.current) return;
    setBusy(true);
    setError("");
    let lease;
    try {
      lease = await chapterRequest(`${path}/lease`, "POST", {});
      const latest = await chapterRequest(path);
      setContent(latest);
      setToken(lease.token);
    } catch (failure) {
      if (lease)
        await chapterRequest(`${path}/lease`, "DELETE", {
          token: lease.token,
        }).catch(() => {});
      setError(
        failure.status === 409
          ? `${labels.thisChapter} está ${work.type === "group_assignment" ? "aberta" : "aberto"} para edição em outra aba. Feche a edição lá ou aguarde até 90 segundos após o último contato.`
          : failure.message,
      );
    } finally {
      setBusy(false);
    }
  }, [path, pendingRef, setBusy, labels.thisChapter, work.type]);
  useEffect(() => {
    if (
      !router.isReady ||
      router.query.write !== "1" ||
      work.owner_id !== user.id ||
      autoOpened.current
    )
      return;
    autoOpened.current = true;
    start();
  }, [router.isReady, router.query.write, work.owner_id, user.id, start]);
  async function close() {
    await chapterRequest(`${path}/lease`, "DELETE", { token }).catch(() => {});
    setToken(null);
    try {
      setContent(await chapterRequest(path));
    } catch (failure) {
      setError(failure.message);
    }
  }
  async function restart() {
    await chapterRequest(`${path}/lease`, "DELETE", { token }).catch(() => {});
    setToken(null);
    await start();
  }
  return (
    <AppLayout
      title={`${content.chapter.title} | Trama`}
      description={`Escrita e leitura de ${content.chapter.title}.`}
      user={user}
      activePage="works"
      backHref={`/works/${work.id}`}
      backLabel={labels.back}
    >
      <section className={styles.workspace}>
        <Link href={`/works/${work.id}`}>← {work.title}</Link>
        <p>
          {content.chapter.part_position}. {content.chapter.part_title}
        </p>
        <h1>
          {content.chapter.part_position}.{content.chapter.position}.{" "}
          {content.chapter.title}
        </h1>
        <EditorialRequestPanel
          user={user}
          work={work}
          content={content}
          setContent={setContent}
          initialRequestContent={requestContent}
          participants={participants}
        >
          {error && <p role="alert">{error}</p>}
          {token ? (
            <ChapterEditor
              projectType={work.type}
              key={token}
              path={path}
              userId={user.id}
              content={content}
              token={token}
              onClose={close}
              onRestart={restart}
            />
          ) : (
            <>
              {work.owner_id === user.id && (
                <button
                  type="button"
                  onClick={start}
                  disabled={busy}
                  aria-busy={busy}
                >
                  {busy ? "Abrindo editor…" : `Escrever ${labels.chapter}`}
                </button>
              )}
              <article
                className={styles.reading}
                aria-label={`Leitura de ${content.chapter.title}`}
              >
                {content.revision === 0 ? (
                  <p>
                    {labels.thisChapter} ainda não tem texto. A descrição
                    continua disponível na estrutura do projeto.
                  </p>
                ) : (
                  <ChapterReader document={content.document} />
                )}
              </article>
            </>
          )}
        </EditorialRequestPanel>
        <div className={styles.actions}>
          <Link href={`/works/${work.id}`}>← {labels.back}</Link>
        </div>
      </section>
    </AppLayout>
  );
}
