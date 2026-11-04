import ChapterDetailsToggle from "./ChapterDetailsToggle";
import { createPortal } from "react-dom";
import ButtonActionIcon from "components/icons/ButtonActionIcon";
import { updateReadingProgress } from "./readingProgressClient";
import { useEffect, useRef, useState } from "react";
import ChapterNarration from "./ChapterNarration";
import Link from "next/link";
import AppLayout from "components/app/AppLayout";
import useRecordAccess from "components/home/useRecordAccess";
import ChapterReader from "./ChapterReader";
import ExportWorkButtons from "./ExportWorkButtons";
import styles from "./chapter.module.css";
import { getProjectLabels } from "./projectLabels";

export default function WorkReadingPage({
  user,
  work,
  parts,
  canNarrate,
  narration = {},
  progress = {},
  authors = [],
}) {
  const readingPanel = useRef(null);
  const [panelOpen, setPanelOpen] = useState(false);
  useEffect(() => {
    const wideScreen = window.matchMedia("(min-width: 1600px)");
    const fitPanel = () => setPanelOpen(wideScreen.matches);
    fitPanel();
    wideScreen.addEventListener("change", fitPanel);
    return () => wideScreen.removeEventListener("change", fitPanel);
  }, []);

  useEffect(() => {
    const menu = document.querySelector(
      'button[aria-controls="account-sidebar"]',
    );
    function alignPanel() {
      if (menu && readingPanel.current) {
        readingPanel.current.style.setProperty(
          "--reading-panel-top",
          `${menu.getBoundingClientRect().top}px`,
        );
      }
    }
    alignPanel();
    window.addEventListener("scroll", alignPanel, { passive: true });
    window.addEventListener("resize", alignPanel);
    return () => {
      window.removeEventListener("scroll", alignPanel);
      window.removeEventListener("resize", alignPanel);
    };
  });

  const [voice, setVoice] = useState("pf_dora");
  const chapters = parts.flatMap((part) => part.chapters);
  const [chapterId, setChapterId] = useState(() =>
    String(chapters[0]?.id ?? ""),
  );
  const [marker, setMarker] = useState(progress.reading);
  const [selection, setSelection] = useState(null);
  const [listeningMarker, setListeningMarker] = useState(null);
  const [markerTarget, setMarkerTarget] = useState(null);
  const [markerStatus, setMarkerStatus] = useState("");
  const [savingMarker, setSavingMarker] = useState(false);
  const markerTag = "p, h2, h3, h4, h5, h6, li";
  function markerAnchor(paragraph) {
    const copy = paragraph?.cloneNode(true);
    copy?.querySelector("[data-reading-marker-action]")?.remove();
    return copy?.textContent.trim().slice(0, 200);
  }

  const [savedTargets, setSavedTargets] = useState({});
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const targets = {};
      if (marker) {
        const container = document.getElementById(
          `narration-text-${marker.chapterId}`,
        );
        const paragraphs = Array.from(
          container?.querySelectorAll(markerTag) ?? [],
        );
        const paragraph = paragraphs[marker.index];
        targets.reading =
          markerAnchor(paragraph) === marker.anchor
            ? paragraph
            : paragraphs.find((entry) => markerAnchor(entry) === marker.anchor);
      }

      const slot = `audio:${chapterId}:${voice}`;
      const position =
        listeningMarker?.slot === slot
          ? listeningMarker.position
          : progress[slot];
      const metadata = narration[chapterId];
      if (position && metadata && position.revision === metadata.revision) {
        const container = document.getElementById(
          `narration-text-${chapterId}`,
        );
        const chapter = parts
          .flatMap((part) => part.chapters)
          .find((entry) => String(entry.id) === chapterId);
        const compactLength = (text) => text.replace(/\s/g, "").length;
        let offset = compactLength(
          metadata.blocks.slice(0, position.block).join(""),
        );
        if (position.block > 0) {
          offset -= compactLength(chapter.title);
        }
        const paragraphs =
          container?.querySelectorAll("p, h2, h3, h4, h5, h6, li") ?? [];
        for (const paragraph of paragraphs) {
          if (paragraph.querySelector(markerTag)) {
            continue;
          }
          offset -= compactLength(paragraph.textContent);
          if (offset < 0) {
            targets.listening = paragraph;
            break;
          }
        }
      }
      setSavedTargets(targets);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [marker, chapterId, voice, listeningMarker, narration, parts, progress]);

  function selectMarker(event) {
    const container = event.currentTarget;
    const paragraph = event.target.closest(markerTag);
    if (
      savingMarker ||
      event.target.closest("a, button") ||
      !paragraph ||
      !container.contains(paragraph)
    ) {
      return;
    }
    const index = [...container.querySelectorAll(markerTag)].indexOf(paragraph);
    const anchor = markerAnchor(paragraph);
    if (anchor) {
      setMarkerTarget(paragraph);
      setSelection({ chapterId: container.dataset.chapterId, index, anchor });
      setMarkerStatus("");
    }
  }

  async function markReading() {
    setSavingMarker(true);
    try {
      await updateReadingProgress(work.id, selection.chapterId, selection);
      setMarker(selection);
      document
        .querySelector(".trama-saved-reading-marker")
        ?.classList.remove("trama-saved-reading-marker");
      markerTarget?.classList.add("trama-saved-reading-marker");
      setMarkerTarget(null);
      setMarkerStatus("Ponto de leitura salvo.");
    } catch (error) {
      setMarkerStatus(error.message);
    } finally {
      setSavingMarker(false);
    }
  }

  async function markListening() {
    const chapter = chapters.find(
      (entry) => String(entry.id) === selection.chapterId,
    );
    const metadata = narration[selection.chapterId];
    const container = markerTarget.closest("[data-chapter-id]");
    const before = document.createRange();
    before.selectNodeContents(container);
    before.setEndBefore(markerTarget);
    const compactLength = (text) => text.replace(/\s/g, "").length;
    const offset =
      compactLength(chapter.title) + compactLength(before.toString());
    let boundary = 0;
    const block = metadata.blocks.findIndex((text) => {
      boundary += compactLength(text);
      return boundary > offset;
    });
    if (block < 0) {
      setMarkerStatus("Não foi possível localizar esse trecho na narração.");
      return;
    }

    setSavingMarker(true);
    try {
      const position = { revision: metadata.revision, block, seconds: 0 };
      await updateReadingProgress(
        work.id,
        selection.chapterId,
        position,
        voice,
      );
      setListeningMarker({
        slot: `audio:${selection.chapterId}:${voice}`,
        position,
        stamp: Date.now(),
      });
      setChapterId(selection.chapterId);
      setMarkerTarget(null);
      setMarkerStatus("Ponto de narração salvo.");
    } catch (error) {
      setMarkerStatus(error.message);
    } finally {
      setSavingMarker(false);
    }
  }

  function resumeReading() {
    const container = document.getElementById(
      `narration-text-${marker.chapterId}`,
    );
    if (!container) {
      setMarkerStatus("O capítulo marcado não está disponível.");
      return;
    }
    const paragraphs = [...container.querySelectorAll(markerTag)];
    const paragraph = paragraphs[marker.index];
    const matches = (entry) => markerAnchor(entry) === marker.anchor;
    const target = matches(paragraph) ? paragraph : paragraphs.find(matches);
    document
      .querySelector(".trama-saved-reading-marker")
      ?.classList.remove("trama-saved-reading-marker");
    target?.classList.add("trama-saved-reading-marker");
    (target ?? container).scrollIntoView({ block: "center" });
  }

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
        {authors.length ? <p>Autoria · {authors.join(", ")}</p> : null}
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
            {Object.entries(savedTargets).map(([kind, target]) => {
              if (!target) {
                return null;
              }
              const reading = kind === "reading";
              const label = reading
                ? "Parei de ler aqui"
                : "Parei de ouvir aqui";
              return createPortal(
                <span
                  className={styles.savedReadingBadge}
                  data-kind={kind}
                  role="img"
                  aria-label={label}
                  title={label}
                >
                  <ButtonActionIcon
                    action={reading ? "read" : "resume"}
                    iconOnly
                  />
                </span>,
                target,
                kind,
              );
            })}
            {markerTarget
              ? createPortal(
                  <span
                    className={styles.readingMarkerAction}
                    data-reading-marker-action=""
                  >
                    <button
                      type="button"
                      className={styles.narrationButton}
                      disabled={savingMarker}
                      onClick={markReading}
                    >
                      <ButtonActionIcon action="save" />
                      {savingMarker ? "Salvando…" : "Parei de ler aqui"}
                    </button>
                    {canNarrate &&
                    narration[selection.chapterId]?.blocks.length ? (
                      <button
                        type="button"
                        className={styles.narrationButton}
                        disabled={savingMarker}
                        onClick={markListening}
                      >
                        <ButtonActionIcon action="save" />
                        Parei de ouvir aqui
                      </button>
                    ) : null}
                  </span>,
                  markerTarget,
                )
              : null}
            {canNarrate || marker || markerStatus ? (
              <aside
                ref={readingPanel}
                className={styles.readingMarkerControls}
                aria-label="Controles de leitura"
              >
                <ChapterDetailsToggle
                  open={panelOpen}
                  onToggle={() => setPanelOpen((open) => !open)}
                  controls="reading-tools"
                  subject="controles de leitura"
                />
                <button
                  type="button"
                  className={styles.readingDrawerToggle}
                  aria-controls="reading-tools"
                  aria-expanded={panelOpen}
                  aria-label={
                    panelOpen
                      ? "Ocultar controles de leitura"
                      : "Mostrar controles de leitura"
                  }
                  onClick={() => setPanelOpen((open) => !open)}
                >
                  <ButtonActionIcon action={panelOpen ? "close" : "read"} />
                </button>
                {panelOpen ? (
                  <button
                    type="button"
                    className={styles.readingDrawerBackdrop}
                    aria-label="Fechar controles de leitura"
                    tabIndex={-1}
                    onClick={() => setPanelOpen(false)}
                  />
                ) : null}
                <div
                  id="reading-tools"
                  className={styles.readingTools}
                  data-open={panelOpen}
                  inert={!panelOpen}
                >
                  {marker || markerStatus ? (
                    <div>
                      {marker ? (
                        <button
                          type="button"
                          className={styles.narrationButton}
                          onClick={resumeReading}
                        >
                          <ButtonActionIcon action="read" />
                          Continuar lendo
                        </button>
                      ) : null}
                      {markerStatus ? (
                        <p className={styles.narrationMessage} role="status">
                          {markerStatus}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  {canNarrate ? (
                    <section className={styles.readingNarration}>
                      <h2>Narração</h2>
                      {chapters.length > 1 ? (
                        <p>
                          <label>
                            Capítulo para ouvir{" "}
                            <select
                              className={styles.narrationVoice}
                              value={chapterId}
                              onChange={(event) =>
                                setChapterId(event.target.value)
                              }
                            >
                              {chapters.map((chapter) => (
                                <option key={chapter.id} value={chapter.id}>
                                  {chapter.title}
                                </option>
                              ))}
                            </select>
                          </label>
                        </p>
                      ) : null}
                      <label>
                        Voz da narração{" "}
                        <select
                          className={styles.narrationVoice}
                          value={voice}
                          onChange={(event) => setVoice(event.target.value)}
                        >
                          <option value="pf_dora">Dora</option>
                          <option value="pm_alex">Alex</option>
                          <option value="pm_santa">Santa</option>
                        </select>
                      </label>
                      <ChapterNarration
                        key={`${chapterId}-${voice}-${listeningMarker?.stamp ?? 0}`}
                        workId={work.id}
                        chapterId={chapterId}
                        voice={voice}
                        userId={user.id}
                        initialPosition={
                          listeningMarker?.slot ===
                          `audio:${chapterId}:${voice}`
                            ? listeningMarker.position
                            : progress[`audio:${chapterId}:${voice}`]
                        }
                        narration={narration[chapterId]}
                        chapterTitle={
                          chapters.find(
                            (chapter) => String(chapter.id) === chapterId,
                          )?.title
                        }
                      />
                    </section>
                  ) : null}
                </div>
              </aside>
            ) : null}
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
                      <div
                        id={`narration-text-${chapter.id}`}
                        data-chapter-id={chapter.id}
                        onClick={selectMarker}
                      >
                        <ChapterReader document={chapter.document} />
                      </div>
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
