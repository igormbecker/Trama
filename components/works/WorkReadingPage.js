import Link from "next/link";
import { useEffect, useState } from "react";
import AppLayout from "components/app/AppLayout";
import useRecordAccess from "components/home/useRecordAccess";
import ChapterReader from "./ChapterReader";
import ExportWorkButtons from "./ExportWorkButtons";
import styles from "./chapter.module.css";

export default function WorkReadingPage({ user, work, parts }) {
  useRecordAccess(user.id, work.id);
  const [showBackToTop, setShowBackToTop] = useState(false);
  useEffect(() => {
    function updateVisibility() {
      setShowBackToTop(window.scrollY > 300);
    }
    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);
  return (
    <AppLayout
      user={user}
      activePage="works"
      title={`${work.title} — Leitura | Trama`}
      description="Leitura do texto atual da obra."
    >
      <section id="reading-top" className={styles.workspace}>
        <Link href={`/works/${work.id}`}>← Voltar à obra</Link>
        <h1>{work.title}</h1>
        {work.owner_id === user.id ? (
          <ExportWorkButtons workId={work.id} disabled={!parts.length} />
        ) : null}
        <p>
          Texto salvo até o momento. Alterações ainda não salvas no editor não
          aparecem nesta leitura.
        </p>
        {!parts.length ? (
          <p>Esta obra ainda não tem texto salvo nos capítulos.</p>
        ) : (
          <>
            <nav aria-label="Sumário da obra" className={styles.contents}>
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
            <article className={styles.reading} aria-label="Leitura da obra">
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
          <Link href={`/works/${work.id}`}>← Voltar à obra</Link>
        </div>
        {showBackToTop && (
          <a
            className={styles.backToTop}
            href="#reading-top"
            aria-label="Voltar ao topo"
            title="Voltar ao topo"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m6 14 6-6 6 6M12 8v12" />
            </svg>
          </a>
        )}
      </section>
    </AppLayout>
  );
}
