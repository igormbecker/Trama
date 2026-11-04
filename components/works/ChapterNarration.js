import { updateReadingProgress } from "./readingProgressClient";
import { useEffect, useRef, useState } from "react";
import VoiceActionIcon from "components/icons/VoiceActionIcon";
import styles from "./chapter.module.css";

function highlightBlock(chapterId, chapterTitle, blocks, block) {
  if (!globalThis.CSS?.highlights || !globalThis.Highlight) {
    return;
  }
  const container = document.getElementById(`narration-text-${chapterId}`);
  if (!container) {
    return;
  }
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return node.parentElement.closest("[data-reading-marker-action]")
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT;
    },
  });
  const characters = [];
  const positions = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    for (const match of node.data.matchAll(/\S/g)) {
      characters.push(match[0]);
      positions.push({ node, offset: match.index });
    }
  }
  const compact = (text) => text.replace(/\s/g, "");
  const expected = compact(blocks.join("\n")).slice(
    compact(chapterTitle).length,
  );
  const offset = characters.join("").indexOf(expected);
  const start =
    block === 0
      ? 0
      : compact(blocks.slice(0, block).join("\n")).length -
        compact(chapterTitle).length;
  const end =
    compact(blocks.slice(0, block + 1).join("\n")).length -
    compact(chapterTitle).length;
  if (offset < 0 || end <= start) {
    return;
  }
  const first = positions[offset + start];
  const last = positions[offset + end - 1];
  const range = document.createRange();
  range.setStart(first.node, first.offset);
  range.setEnd(last.node, last.offset + 1);
  CSS.highlights.set("trama-narration", new Highlight(range));
}

export default function ChapterNarration({
  workId,
  chapterId,
  voice,
  userId,
  initialPosition,
  narration,
  chapterTitle,
}) {
  const generation = useRef(null);
  const lastSync = useRef(0);
  const played = useRef(null);
  const syncQueue = useRef(Promise.resolve());
  const storageKey = `trama-narration:${userId}:${workId}:${chapterId}:${voice}`;
  const [saved, setSaved] = useState(null);
  const [intro, setIntro] = useState(null);
  const [audio, setAudio] = useState([]);
  const [playingIndex, setPlayingIndex] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const loading = Boolean(status);

  function releaseGeneration() {
    const current = generation.current;
    current?.request.abort();
    if (current?.intro) {
      URL.revokeObjectURL(current.intro);
    }
    current?.urls.forEach((url) => URL.revokeObjectURL(url));
    generation.current = null;
  }

  useEffect(() => releaseGeneration, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const position =
          initialPosition ?? JSON.parse(localStorage.getItem(storageKey));
        if (
          position?.revision === narration.revision &&
          Number.isInteger(position.block) &&
          position.block >= 0 &&
          position.block < narration.blocks.length &&
          Number.isFinite(position.seconds) &&
          position.seconds >= 0
        ) {
          setSaved(position);
        }
      } catch {
        // Playback still works when local storage is unavailable.
      }
    });
    return () => {
      window.cancelAnimationFrame(frame);
      globalThis.CSS?.highlights?.delete("trama-narration");
    };
  }, [storageKey, narration, initialPosition]);

  function syncPosition(position) {
    lastSync.current = Date.now();
    syncQueue.current = syncQueue.current
      .then(() => updateReadingProgress(workId, chapterId, position, voice))
      .catch((error) => setError(error.message));
  }

  useEffect(() => {
    function flushPosition() {
      if (played.current) {
        updateReadingProgress(workId, chapterId, played.current, voice).catch(
          () => {},
        );
      }
    }
    window.addEventListener("pagehide", flushPosition);
    return () => window.removeEventListener("pagehide", flushPosition);
  }, [workId, chapterId, voice]);

  function savePosition(seconds, block = playingIndex, sync = false) {
    const position = { revision: narration.revision, block, seconds };
    played.current = position;
    try {
      localStorage.setItem(storageKey, JSON.stringify(position));
    } catch {
      // Playback still works when local storage is unavailable.
    }
    setSaved(position);
    if (sync || Date.now() - lastSync.current >= 5000) {
      syncPosition(position);
    }
  }

  function cancel() {
    releaseGeneration();
    setIntro(null);
    setAudio([]);
    globalThis.CSS?.highlights?.delete("trama-narration");
    setStatus("");
  }

  async function listen() {
    releaseGeneration();
    const request = new AbortController();
    const urls = [];
    const start = saved?.block ?? 0;
    played.current = null;
    generation.current = { request, urls, start, seconds: saved?.seconds ?? 0 };
    setError("");
    setIntro(null);
    setAudio([]);
    setPlayingIndex(start);

    try {
      let total = narration.blocks.length;
      for (let block = saved ? start - 1 : start; block < total; block++) {
        const resumeIntro = block < start;
        setStatus(
          resumeIntro
            ? "Preparando a retomada…"
            : block === 0
              ? "Preparando o primeiro trecho…"
              : `Gerando trecho ${block + 1} de ${total}…`,
        );
        const response = await fetch(`/api/v1/works/${workId}/narration`, {
          method: "POST",
          signal: request.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chapterId: String(chapterId),
            voice,
            block: resumeIntro ? start : block,
            resumeIntro,
            revision: narration.revision,
          }),
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(
            [400, 409, 503].includes(response.status)
              ? data.message
              : "Não foi possível gerar a narração.",
          );
        }
        total = Number(response.headers.get("X-Narration-Blocks"));
        const blob = await response.blob();
        request.signal.throwIfAborted();
        if (resumeIntro) {
          generation.current.intro = URL.createObjectURL(blob);
          continue;
        }
        urls[block] = URL.createObjectURL(blob);
        if (block > start || block + 1 === total) {
          setAudio([...urls]);
          if (block === Math.min(start + 1, total - 1)) {
            setIntro(generation.current.intro ?? null);
          }
        }
      }
    } catch (failure) {
      if (!request.signal.aborted) {
        setAudio([...urls]);
        setError(failure.message);
      }
    } finally {
      if (generation.current?.request === request) {
        setStatus("");
      }
    }
  }

  return (
    <div className={styles.narrationControls}>
      <button
        type="button"
        className={styles.narrationButton}
        disabled={loading}
        onClick={listen}
      >
        <VoiceActionIcon action="resume" />
        {loading
          ? "Gerando áudio…"
          : saved
            ? "Continuar ouvindo"
            : "Ouvir capítulo"}
      </button>
      {loading ? (
        <button
          type="button"
          className={`${styles.narrationButton} ${styles.dangerButton}`}
          onClick={cancel}
        >
          <VoiceActionIcon action="stop" />
          Cancelar geração
        </button>
      ) : null}
      {intro ? (
        <audio
          key="resume-intro"
          src={intro}
          controls
          autoPlay
          aria-label="Aviso de retomada"
          onEnded={() => setIntro(null)}
          onError={() => setIntro(null)}
        />
      ) : audio[playingIndex] ? (
        <audio
          key={playingIndex}
          src={audio[playingIndex]}
          onLoadedMetadata={(event) => {
            const current = generation.current;
            if (current?.start === playingIndex) {
              const player = event.currentTarget;
              if (current.seconds <= player.duration) {
                player.currentTime = current.seconds;
              }
              current.seconds = 0;
            }
          }}
          onPlaying={(event) => {
            savePosition(event.currentTarget.currentTime, playingIndex, true);
            highlightBlock(
              chapterId,
              chapterTitle,
              narration.blocks,
              playingIndex,
            );
          }}
          onPause={(event) => {
            if (
              played.current?.block === playingIndex &&
              !event.currentTarget.ended &&
              event.currentTarget.currentTime > 0
            ) {
              savePosition(event.currentTarget.currentTime, playingIndex, true);
            }
          }}
          onTimeUpdate={(event) => {
            if (
              !event.currentTarget.ended &&
              !event.currentTarget.paused &&
              played.current?.block === playingIndex
            ) {
              savePosition(event.currentTarget.currentTime);
            }
          }}
          onEnded={(event) => {
            if (playingIndex + 1 < narration.blocks.length) {
              savePosition(
                Math.max(0, event.currentTarget.duration - 0.25),
                playingIndex,
                true,
              );
              setPlayingIndex(playingIndex + 1);
            } else {
              try {
                localStorage.removeItem(storageKey);
              } catch {
                // Playback still works when local storage is unavailable.
              }
              played.current = null;
              setSaved(null);
              syncPosition(null);
              globalThis.CSS?.highlights?.delete("trama-narration");
            }
          }}
          controls
          autoPlay
          aria-label="Narração do capítulo"
        />
      ) : null}
      {status ? (
        <p className={styles.narrationMessage} role="status">
          <span className={styles.narrationShimmer}>{status}</span>
        </p>
      ) : null}
      {error ? (
        <p className={styles.narrationMessage} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
