import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { createDraftWriter } from "./draftWriter";
import { runManualSave } from "./manualSave";
import { localDraft } from "./localDraft";
import { chapterRequest } from "./chapterClient";
import { preserveWordHeadings } from "./wordHeadings";
import ChapterReader from "./ChapterReader";
import EditorToolbar from "./EditorToolbar";
import SuccessIcon from "components/shared/SuccessIcon";
import styles from "./chapter.module.css";
import { getProjectLabels } from "./projectLabels";

const extensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    blockquote: false,
    code: false,
    codeBlock: false,
    strike: false,
    underline: false,
    horizontalRule: false,
    link: {
      openOnClick: false,
      protocols: ["http", "https", "mailto"],
      defaultProtocol: "https",
    },
  }),
];

export default function ChapterEditor({
  path,
  userId,
  content,
  token,
  onClose,
  onRestart,
  draftKey,
  projectType,
}) {
  const labels = getProjectLabels(projectType);
  const router = useRouter();
  const key = draftKey || `${userId}:${content.chapter.id}`;
  const [status, setStatus] = useState("Carregando recuperação local…");
  const [error, setError] = useState("");
  const [localError, setLocalError] = useState("");
  const [recovery, setRecovery] = useState(null);
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [manualSaving, setManualSaving] = useState(false);
  const surfaceRef = useRef(null);
  const timer = useRef(null);
  const queue = useRef(Promise.resolve());
  const running = useRef(false);
  const stopped = useRef(false);
  const latestDocument = useRef(content.document);
  const [writer] = useState(() =>
    createDraftWriter({
      revision: content.revision,
      save: (document, revision) =>
        chapterRequest(path, "PUT", { document, revision, token }),
    }),
  );

  const persistLocal = useCallback(
    (action, document) => {
      queue.current = queue.current
        .catch(() => {})
        .then(() =>
          localDraft(action, key, {
            document,
            revision: writer.revision(),
            updatedAt: Date.now(),
          }),
        )
        .catch(() =>
          setLocalError(
            "A recuperação local está indisponível neste navegador. Mantenha a aba aberta até confirmar o salvamento no servidor.",
          ),
        );
      return queue.current;
    },
    [key, writer],
  );

  const flush = useCallback(async () => {
    if (running.current || stopped.current || !writer.pending()) return;
    running.current = true;
    setSaving(true);
    setStatus("Salvando…");
    setError("");
    try {
      await writer.flush();
      await persistLocal(
        writer.pending() ? "write" : "delete",
        latestDocument.current,
      );
      setStatus(writer.pending() ? "Alterações pendentes" : "Salvo no Trama");
    } catch (failure) {
      setError(failure.message);
      setStatus("Não salvo no servidor");
      if ([401, 404, 409].includes(failure.status)) {
        stopped.current = true;
        setBlocked(true);
        setNeedsLogin(failure.status === 401);
      }
    } finally {
      running.current = false;
      setSaving(false);
    }
  }, [writer, persistLocal]);

  const editor = useEditor({
    extensions,
    content: content.document,
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editable: ready && !blocked,
    editorProps: {
      transformPastedHTML: preserveWordHeadings,
      attributes: {
        "aria-label": `Conteúdo: ${labels.chapter}`,
        role: "textbox",
        "aria-multiline": "true",
      },
    },
    onUpdate: ({ editor }) => {
      const document = editor.getJSON();
      latestDocument.current = document;
      writer.change(document);
      persistLocal("write", document);
      setStatus("Alterações pendentes");
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, 2000);
    },
  });

  useEffect(() => {
    editor?.setEditable(ready && !blocked, false);
  }, [editor, ready, blocked]);

  useEffect(() => {
    let cancelled = false;
    localDraft("read", key)
      .then((draft) => {
        if (cancelled) return;
        if (
          draft?.document &&
          JSON.stringify(draft.document) !== JSON.stringify(content.document)
        ) {
          setRecovery(draft);
          setStatus("Rascunho local disponível para recuperação");
        } else {
          setReady(true);
          setStatus("Sem alterações pendentes");
        }
      })
      .catch(() => {
        if (cancelled) return;
        setLocalError(
          "A recuperação local está indisponível neste navegador. Mantenha a aba aberta até salvar no servidor.",
        );
        setReady(true);
        setStatus("Sem alterações pendentes");
      });
    return () => {
      cancelled = true;
    };
  }, [key, content.document]);

  useEffect(() => {
    const heartbeat = setInterval(async () => {
      if (stopped.current) return;
      try {
        await chapterRequest(`${path}/lease`, "POST", { token });
      } catch (failure) {
        setError(failure.message);
        if ([401, 404, 409].includes(failure.status)) {
          stopped.current = true;
          setBlocked(true);
          setNeedsLogin(failure.status === 401);
          setStatus("Edição pausada · texto preservado nesta tela");
        }
      }
    }, 25000);
    const periodicSave = setInterval(flush, 15000);
    function beforeUnload(event) {
      if (!writer.pending()) return;
      event.preventDefault();
      event.returnValue = "";
    }
    function beforeRoute() {
      if (
        writer.pending() &&
        !window.confirm("Há texto ainda não salvo no Trama. Sair desta página?")
      ) {
        router.events.emit("routeChangeError");
        const cancelled = new Error("Navigation cancelled");
        cancelled.cancelled = true;
        throw cancelled;
      }
    }
    window.addEventListener("beforeunload", beforeUnload);
    router.events.on("routeChangeStart", beforeRoute);
    return () => {
      clearInterval(heartbeat);
      clearInterval(periodicSave);
      clearTimeout(timer.current);
      window.removeEventListener("beforeunload", beforeUnload);
      router.events.off("routeChangeStart", beforeRoute);
      // Closing the browser may skip this request; the 90-second expiry is the fallback.
      fetch(`${path}/lease`, {
        method: "DELETE",
        credentials: "same-origin",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      }).catch(() => {});
    };
  }, [path, token, flush, writer, router.events]);

  function recover() {
    editor.commands.setContent(recovery.document, { emitUpdate: true });
    setRecovery(null);
    setReady(true);
  }
  async function finish() {
    await flush();
    if (
      writer.pending() &&
      !window.confirm(
        "O texto ainda não foi salvo no Trama. Voltar à leitura mantendo a recuperação local?",
      )
    )
      return;
    await queue.current;
    await onClose({ pending: writer.pending() });
  }
  function link() {
    const href = window.prompt(
      "Endereço do link (https:// ou mailto:)",
      editor.getAttributes("link").href || "https://",
    );
    if (href === null) return;
    if (!href)
      editor
        .chain()
        .focus(undefined, { scrollIntoView: false })
        .extendMarkRange("link")
        .unsetLink()
        .run();
    else if (/^(https?:\/\/|mailto:)/i.test(href.trim()))
      editor
        .chain()
        .focus(undefined, { scrollIntoView: false })
        .extendMarkRange("link")
        .setLink({ href: href.trim() })
        .run();
    else setError("Use um endereço iniciado por https://, http:// ou mailto:.");
  }
  return (
    <section aria-label={`Editor: ${labels.chapter}`}>
      {recovery && (
        <section
          className={styles.recovery}
          aria-label="Recuperação de rascunho"
        >
          <h2>Encontramos um rascunho neste navegador</h2>
          <p>
            {recovery.revision !== content.revision
              ? "O texto salvo no Trama mudou desde este rascunho. Compare o texto abaixo com a leitura antes de recuperar. Recuperar colocará este texto no editor para um novo salvamento."
              : "Você pode continuar de onde parou ou manter o texto salvo no Trama."}
          </p>
          <div className={styles.recoveryText}>
            <ChapterReader document={recovery.document} />
          </div>
          <button type="button" disabled={!editor} onClick={recover}>
            Recuperar rascunho
          </button>{" "}
          <button
            type="button"
            className={styles.dangerButton}
            onClick={async () => {
              await persistLocal("delete");
              setRecovery(null);
              setReady(true);
              setStatus("Sem alterações pendentes");
            }}
          >
            Descartar rascunho local
          </button>
        </section>
      )}
      <p
        role="status"
        aria-live="polite"
        className={
          status === "Salvo no Trama" && !saving && !manualSaving
            ? styles.savedStatus
            : undefined
        }
      >
        {saving || manualSaving ? (
          <>
            <span className={styles.spinner} aria-hidden="true" /> Salvando…
          </>
        ) : status === "Salvo no Trama" ? (
          <>
            <SuccessIcon />
            {status}
          </>
        ) : (
          status
        )}
      </p>
      {error && (
        <p role="alert">
          {error}{" "}
          {needsLogin && (
            <a href="/login" target="_blank" rel="noopener noreferrer">
              Abrir login em outra aba
            </a>
          )}
        </p>
      )}
      {blocked && (
        <button
          type="button"
          onClick={async () => {
            await queue.current;
            await onRestart();
          }}
        >
          Reabrir e recuperar rascunho
        </button>
      )}
      {localError && <p role="alert">{localError}</p>}
      <div ref={surfaceRef} className={styles.editorSurface}>
        <EditorToolbar
          editor={editor}
          disabled={!ready || blocked || !editor}
          surfaceRef={surfaceRef}
          onLink={link}
        />
        <EditorContent editor={editor} className={styles.editor} />
      </div>
      <p className={styles.hint}>
        Somente texto e formatação · Até 1 MB por {labels.chapter} · Salvamento
        após 2 segundos de pausa ou a cada 15 segundos.
      </p>
      <div className={styles.actions}>
        <button
          type="button"
          disabled={!ready || blocked || saving || manualSaving}
          aria-busy={saving || manualSaving}
          onClick={() =>
            runManualSave(async () => {
              if (!writer.pending()) {
                setStatus("Salvo no Trama");
                return;
              }
              await flush();
            }, setManualSaving)
          }
        >
          {saving || manualSaving ? (
            <>
              <span className={styles.spinner} aria-hidden="true" /> Salvando…
            </>
          ) : (
            "Salvar agora"
          )}
        </button>
        <button type="button" onClick={finish}>
          Voltar à leitura
        </button>
      </div>
      {status === "Salvo no Trama" && !saving && !manualSaving && (
        <p className={styles.savedStatus}>
          <SuccessIcon />
          Salvo no Trama
        </p>
      )}
    </section>
  );
}
