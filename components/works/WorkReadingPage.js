import Link from "next/link";
import AppLayout from "components/app/AppLayout";
import useRecordAccess from "components/home/useRecordAccess";
import ChapterReader from "./ChapterReader";
import ExportWorkButtons from "./ExportWorkButtons";
import styles from "./chapter.module.css";
import { getProjectLabels } from "./projectLabels";

export default function WorkReadingPage({ user, work, parts }) {
  const labels = getProjectLabels(work.type);
  useRecordAccess(user.id, work.id);
  return (
    <AppLayout
      user={user}
      activePage="works"
      backHref={`/works/${work.id}`}
      backLabel={labels.back}
      title={`${work.title} — Leitura | Trama`}
      description={`Leitura de ${work.title}.`}
    >
      <section id="reading-top" className={styles.workspace}>
        <Link href={`/works/${work.id}`}>← {labels.back}</Link>
        <h1>{work.title}</h1>
        {work.owner_id === user.id ? (
          <ExportWorkButtons
            workId={work.id}
            projectType={work.type}
            disabled={!parts.length}
          />
        ) : null}
        <p>
          Texto salvo até o momento. Alterações ainda não salvas no editor não
          aparecem nesta leitura.
        </p>
        {!parts.length ? (
          <p>{`${labels.thisProject} ainda não tem texto salvo ${labels.inChapters}.`}</p>
        ) : (
          <>
            <nav
              aria-label={`Sumário de ${work.title}`}
              className={styles.contents}
            >
              <h2>Sumário</h2>
              <ol>
                {parts.map((part) => (
                  <li key={part.id}>
                    <a href={`#part-${part.id}`}>
                      {part.position}. {part.title}
                    </a>
                    <ol>
                      {part.chapters.map((chapter) => (
                        <li key={chapter.id}>
                          <a href={`#chapter-${chapter.id}`}>
                            {part.position}.{chapter.position}. {chapter.title}
                          </a>
                        </li>
                      ))}
                    </ol>
                  </li>
                ))}
              </ol>
            </nav>
            <article
              className={styles.reading}
              aria-label={`Leitura de ${work.title}`}
            >
              {parts.map((part) => (
                <section key={part.id}>
                  <h2 id={`part-${part.id}`} className={styles.readingAnchor}>
                    {part.position}. {part.title}
                  </h2>
                  {part.chapters.map((chapter) => (
                    <section key={chapter.id} className={styles.readingChapter}>
                      <h3
                        id={`chapter-${chapter.id}`}
                        className={styles.readingAnchor}
                      >
                        {part.position}.{chapter.position}. {chapter.title}
                      </h3>
                      <ChapterReader document={chapter.document} />
                    </section>
                  ))}
                </section>
              ))}
            </article>
          </>
        )}
        <div className={styles.actions}>
          <Link href={`/works/${work.id}`}>← {labels.back}</Link>
        </div>
      </section>
    </AppLayout>
  );
}
