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

export default function ChapterPage({
  user,
  work,
  content: initialContent,
  requestContent,
  participants,
}) {
  useRecordAccess(user.id, work.id, initialContent.chapter.id);
  const router = useRouter();
  const autoOpened = useRef(false);
  const [content, setContent] = useState(initialContent);
  const [token, setToken] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const path = `/api/v1/works/${work.id}/chapters/${content.chapter.id}`;
  const start = useCallback(async () => {
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
          ? "Este capítulo está aberto para edição em outra aba. Feche a edição lá ou aguarde até 90 segundos após o último contato."
          : failure.message,
      );
    } finally {
      setBusy(false);
    }
  }, [path]);
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
      description="Escrita e leitura do capítulo."
      user={user}
      activePage="works"
      backHref={`/works/${work.id}`}
      backLabel="Voltar à obra"
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
                <button type="button" onClick={start} disabled={busy}>
                  {busy ? "Abrindo editor…" : "Escrever capítulo"}
                </button>
              )}
              <article
                className={styles.reading}
                aria-label="Leitura do capítulo"
              >
                {content.revision === 0 ? (
                  <p>
                    Este capítulo ainda não tem texto. A descrição continua
                    disponível na estrutura da obra.
                  </p>
                ) : (
                  <ChapterReader document={content.document} />
                )}
              </article>
            </>
          )}
        </EditorialRequestPanel>
        <div className={styles.actions}>
          <Link href={`/works/${work.id}`}>← Voltar à obra</Link>
        </div>
      </section>
    </AppLayout>
  );
}
