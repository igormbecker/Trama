import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/router";
import useConfirmation from "components/shared/useConfirmation";
import { createVoiceRecorder, maximumAudioBytes } from "./voiceRecorder";
import { localDraft } from "components/works/localDraft";
import { prepareAudioPreview } from "./audioPreview";
import MicrophoneIcon from "components/icons/MicrophoneIcon";
import VoiceActionIcon from "components/icons/VoiceActionIcon";
import TrashActionIcon from "components/icons/TrashActionIcon";
import styles from "./voice.module.css";

export default function VoiceCapture({
  storageKey,
  disabled = false,
  onApply,
  onDiscard,
  guardCloseRef,
  lockPreviewOnApply = false,
  applyLabel = "Inserir no final",
  label = "Adicionar por voz",
  renderTrigger,
}) {
  const id = useId();
  const { confirm, confirmationDialog } = useConfirmation();
  const allowNavigationRef = useRef(false);
  const router = useRouter();
  const capturedAudio = useRef(null);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState("idle");
  const [elapsed, setElapsed] = useState(0);
  const [audio, setAudio] = useState(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [storageError, setStorageError] = useState("");
  const [busy, setBusy] = useState(false);
  const [previewLocked, setPreviewLocked] = useState(false);
  const busyRef = useRef(false);
  const recorder = useRef(null);
  const writes = useRef(Promise.resolve());
  const mounted = useRef(true);

  function persist(value) {
    writes.current = writes.current
      .catch(() => {})
      .then(() => localDraft(value ? "write" : "delete", storageKey, value))
      .catch(() => {
        if (mounted.current) {
          setStorageError(
            "A recuperação local está indisponível. Mantenha esta página aberta até aplicar ou descartar.",
          );
        }
      });
    return writes.current;
  }
  useEffect(() => {
    mounted.current = true;
    let active = true;
    localDraft("read", storageKey)
      .then((value) => {
        if (!active) {
          return;
        }
        if (value?.audio || value?.text) {
          setAudio(value.audio || null);
          setText(value.text || "");
          setPreviewLocked(Boolean(value.applying));
          setOpen(true);
          setStatus("finished");
        }
      })
      .catch(() => {
        if (active) {
          setStorageError(
            "A recuperação local está indisponível. Mantenha esta página aberta até concluir.",
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoaded(true);
        }
      });
    return () => {
      active = false;
      mounted.current = false;
      recorder.current?.discard();
    };
  }, [storageKey]);

  useEffect(() => {
    if (guardCloseRef) {
      guardCloseRef.current = () =>
        !["starting", "recording", "paused", "finishing"].includes(
          recorder.current?.state(),
        ) ||
        confirm({
          title: "Sair da gravação?",
          message: "A gravação ainda está em andamento e será perdida.",
          confirmLabel: "Sair da gravação",
          icon: "logout",
          danger: true,
        });
    }
    return () => {
      if (guardCloseRef) {
        guardCloseRef.current = null;
      }
    };
  }, [guardCloseRef, confirm]);

  useEffect(() => {
    const timer = setInterval(() => recorder.current?.tick(), 250);
    function pauseWhenHidden() {
      if (document.hidden) {
        recorder.current?.pause();
      }
    }
    document.addEventListener("visibilitychange", pauseWhenHidden);
    function beforeUnload(event) {
      if (
        ["starting", "recording", "paused", "finishing"].includes(
          recorder.current?.state(),
        ) ||
        busyRef.current
      ) {
        event.preventDefault();
        event.returnValue = "";
      }
    }
    function beforeRoute(url) {
      if (guardCloseRef) {
        return;
      }
      if (allowNavigationRef.current) {
        allowNavigationRef.current = false;
        return;
      }
      if (
        ["starting", "recording", "paused", "finishing"].includes(
          recorder.current?.state(),
        )
      ) {
        confirm({
          title: "Sair da gravação?",
          message: "A gravação ainda está em andamento e será perdida.",
          confirmLabel: "Sair da página",
          icon: "logout",
          danger: true,
        }).then((accepted) => {
          if (accepted && mounted.current) {
            allowNavigationRef.current = true;
            router.push(url).catch(() => {
              allowNavigationRef.current = false;
            });
          }
        });
        router.events.emit("routeChangeError");
        const failure = new Error("Navigation cancelled");
        failure.cancelled = true;
        throw failure;
      }
    }
    router.events.on("routeChangeStart", beforeRoute);
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", pauseWhenHidden);
      window.removeEventListener("beforeunload", beforeUnload);
      router.events.off("routeChangeStart", beforeRoute);
    };
  }, [router, guardCloseRef, confirm]);

  async function start() {
    if (recorder.current || busyRef.current) {
      return;
    }
    setError("");
    const capture = createVoiceRecorder({
      mediaDevices: navigator.mediaDevices,
      Recorder: window.MediaRecorder,
      onChange: () => {
        if (!mounted.current) {
          return;
        }
        setStatus(capture.state());
        setElapsed(capture.elapsed());
        if (
          capture.state() === "finished" &&
          capture.audio() &&
          capturedAudio.current !== capture.audio()
        ) {
          capturedAudio.current = capture.audio();
          setAudio(capture.audio());
          persist({ audio: capture.audio(), text: "" });
        }
      },
    });
    capturedAudio.current = null;
    recorder.current = capture;
    setStatus("starting");
    try {
      await capture.start();
    } catch (failure) {
      recorder.current = null;
      setStatus("idle");
      setError(failure.message);
    }
  }
  async function transcribe() {
    if (busyRef.current || !audio) {
      return;
    }
    if (audio.size > maximumAudioBytes) {
      setError("A gravação ultrapassa 4 MB. Descarte e grave um áudio menor.");
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/v1/voice-transcriptions", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": audio.type, "X-Trama-Voice": "1" },
        body: audio,
        signal: AbortSignal.timeout(65000),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Não foi possível transcrever.");
      }
      if (typeof result.text !== "string" || !result.text.trim()) {
        throw new Error("Não foi possível reconhecer texto neste áudio.");
      }
      setText(result.text);
      await persist({ audio, text: result.text });
    } catch (failure) {
      setError(
        failure.name === "TypeError" || failure.name === "TimeoutError"
          ? "Sem resposta. Seu áudio foi preservado; tente novamente."
          : failure.message,
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  async function discard() {
    if (busyRef.current) {
      return;
    }
    if (
      !(await confirm({
        title: "Descartar gravação?",
        message:
          "A gravação e sua transcrição serão descartadas deste navegador. Esta ação não pode ser desfeita.",
        confirmLabel: "Descartar",
        danger: true,
      }))
    ) {
      return;
    }
    recorder.current?.discard();
    recorder.current = null;
    onDiscard?.();
    setPreviewLocked(false);
    setAudio(null);
    setText("");
    setElapsed(0);
    setStatus("idle");
    setError("");
    await persist(null);
  }
  async function apply() {
    if (busyRef.current || disabled || !text.trim()) {
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      if (lockPreviewOnApply) {
        setPreviewLocked(true);
        await persist({ audio, text, applying: true });
      }
      await onApply(text);
      await persist(null);
      recorder.current?.discard();
      recorder.current = null;
      setText("");
      setPreviewLocked(false);
      setAudio(null);
      setStatus("idle");
      setElapsed(0);
      setOpen(false);
    } catch (failure) {
      setError(
        failure.message ||
          "Não foi possível aplicar o texto. A prévia foi preservada.",
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  const capturing = ["starting", "recording", "paused", "finishing"].includes(
    status,
  );
  const seconds = Math.floor(elapsed / 1000);
  const trigger = (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      aria-expanded={open}
      aria-controls={id}
      disabled={!loaded}
    >
      <MicrophoneIcon /> {label}
    </button>
  );
  return (
    <section className={styles.voice} aria-label={label}>
      {confirmationDialog}
      {renderTrigger ? renderTrigger(trigger) : trigger}
      {open && (
        <div id={id} className={styles.panel}>
          <p>
            Grave até 2 minutos, sem contar pausas. A gravação ocorre com esta
            página aberta; evite bloquear a tela.
          </p>
          <p>
            Ao transcrever, o áudio será enviado à Groq. Confira nomes,
            pontuação e parágrafos na prévia. O Trama não mantém o áudio no
            servidor.
          </p>
          <p>
            Até 30 minutos por conta a cada 24 horas. Cada envio reserva até 2
            minutos durante o processamento; após o sucesso, desconta a duração
            reconhecida, com mínimo de 10 segundos. Falhas sem duração
            confirmada mantêm a reserva.
          </p>
          <p role="status">
            {status === "recording"
              ? "Gravando"
              : status === "paused"
                ? "Pausado"
                : status === "starting"
                  ? "Aguardando microfone"
                  : status === "finishing"
                    ? "Concluindo"
                    : audio
                      ? "Gravação pronta"
                      : "Pronto para gravar"}{" "}
            · {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}{" "}
            / 2:00
          </p>
          <div className={styles.actions}>
            {status === "idle" && !audio && !text && (
              <button type="button" disabled={disabled || busy} onClick={start}>
                <MicrophoneIcon /> Iniciar gravação
              </button>
            )}
            {status === "recording" && (
              <button type="button" onClick={() => recorder.current.pause()}>
                <VoiceActionIcon action="pause" /> Pausar
              </button>
            )}
            {status === "paused" && (
              <button type="button" onClick={() => recorder.current.resume()}>
                <VoiceActionIcon action="resume" /> Continuar
              </button>
            )}
            {["recording", "paused"].includes(status) && (
              <button type="button" onClick={() => recorder.current.finish()}>
                <VoiceActionIcon action="stop" /> Concluir gravação
              </button>
            )}
            {(capturing || audio || text) && (
              <button
                type="button"
                className={styles.danger}
                disabled={busy}
                onClick={discard}
              >
                <TrashActionIcon /> Descartar
              </button>
            )}
          </div>
          {audio && <AudioPreview audio={audio} />}
          {audio && !text && (
            <button
              type="button"
              disabled={busy || capturing}
              aria-busy={busy}
              onClick={transcribe}
            >
              <VoiceActionIcon action="transcribe" />
              {busy ? "Transcrevendo…" : "Transcrever com IA"}
            </button>
          )}
          {text && (
            <>
              <label htmlFor={`${id}-preview`}>
                Confira e edite a transcrição
              </label>
              <textarea
                id={`${id}-preview`}
                value={text}
                disabled={busy}
                readOnly={previewLocked}
                onChange={(event) => {
                  setText(event.target.value);
                  persist({ audio, text: event.target.value });
                }}
              />
              <button
                type="button"
                disabled={disabled || busy || !text.trim()}
                aria-busy={busy}
                onClick={apply}
              >
                <VoiceActionIcon
                  action={lockPreviewOnApply ? "save" : "insert"}
                />
                {busy ? "Aplicando…" : applyLabel}
              </button>
              {previewLocked && (
                <p>
                  A criação do rascunho já foi iniciada. Tente novamente com a
                  mesma prévia para evitar duplicação. Descartar o áudio não
                  apaga um projeto que já tenha sido criado.
                </p>
              )}
              {disabled && (
                <p>
                  Reabra a edição antes de inserir. A prévia permanece
                  disponível para copiar.
                </p>
              )}
            </>
          )}
          {error && <p role="alert">{error}</p>}
          {storageError && <p role="alert">{storageError}</p>}
          <p>
            Áudio concluído e prévia ficam neste navegador, vinculados à conta,
            até aplicar ou descartar. Gravação em andamento ainda não tem
            recuperação.
          </p>
        </div>
      )}
    </section>
  );
}

function AudioPreview({ audio }) {
  const element = useRef(null);
  useEffect(() => prepareAudioPreview(element.current, audio), [audio]);
  return <audio ref={element} controls preload="auto" />;
}
