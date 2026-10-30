import { useRef } from "react";
import { useRouter } from "next/router";
import VoiceCapture from "components/voice/VoiceCapture";
import { textToParagraphs } from "components/voice/voiceRecorder";
import { createQuickDraftStarter } from "./quickDraftClient";

export default function VoiceIdea({ userId, renderTrigger }) {
  const router = useRouter();
  const starter = useRef(null);
  async function create(text) {
    if (!starter.current) {
      starter.current = createQuickDraftStarter({
        userId,
        storage: {
          getItem: (key) => window.sessionStorage.getItem(key),
          setItem: (key, value) => window.sessionStorage.setItem(key, value),
          removeItem: (key) => window.sessionStorage.removeItem(key),
        },
        fetcher: (...args) => fetch(...args),
        navigate: (path) => router.push(path),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        initialDocument: { type: "doc", content: textToParagraphs(text) },
      });
    }
    await starter.current.start();
    starter.current = null;
  }
  return (
    <VoiceCapture
      storageKey={`voice:idea:${userId}`}
      label="Registrar ideia por voz"
      renderTrigger={renderTrigger}
      applyLabel="Salvar como rascunho"
      lockPreviewOnApply
      onDiscard={() => {
        starter.current = null;
        try {
          window.sessionStorage.removeItem(`trama:voice-draft:${userId}`);
        } catch {
          // The next attempt can still be kept in memory.
        }
      }}
      onApply={create}
    />
  );
}
