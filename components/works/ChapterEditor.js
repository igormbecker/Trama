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
import SuccessIcon from "components/shared/SuccessIcon";
import styles from "./chapter.module.css";

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
}) {
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
        "aria-label": "Conteúdo do capítulo",
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
    if (!href) editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else if (/^(https?:\/\/|mailto:)/i.test(href.trim()))
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: href.trim() })
        .run();
    else setError("Use um endereço iniciado por https://, http:// ou mailto:.");
  }
  const controls = [
    ["Negrito", "bold", () => editor.chain().focus().toggleBold().run()],
    ["Itálico", "italic", () => editor.chain().focus().toggleItalic().run()],
    [
      "Lista",
      "bulletList",
      () => editor.chain().focus().toggleBulletList().run(),
    ],
    [
      "Lista numerada",
      "orderedList",
      () => editor.chain().focus().toggleOrderedList().run(),
    ],
  ];
  return (
    <section aria-label="Editor do capítulo">
      {recovery && (
        <section
          className={styles.recovery}
          aria-label="Recuperação de rascunho"
        >
          <h2>Encontramos um rascunho neste navegador</h2>
          <p>
            {recovery.revision !== content.revision
              ? "O capítulo salvo no Trama mudou desde este rascunho. Compare o texto abaixo com a leitura antes de recuperar. Recuperar colocará este texto no editor para um novo salvamento."
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
      <div className={styles.toolbar} role="group" aria-label="Formatação">
        {controls.map(([label, mark, action]) => (
          <button
            key={label}
            title={label}
            aria-label={label}
            type="button"
            disabled={!ready || blocked || !editor}
            aria-pressed={editor?.isActive(mark) || false}
            onClick={action}
          >
            <span
              aria-hidden="true"
              className={
                mark === "bold"
                  ? styles.boldIcon
                  : mark === "italic"
                    ? styles.italicIcon
                    : styles.listIcon
              }
            >
              {mark === "bold"
                ? "B"
                : mark === "italic"
                  ? "I"
                  : mark === "bulletList"
                    ? "• ≡"
                    : "1 ≡"}
            </span>
          </button>
        ))}
        <select
          aria-label="Estilo do parágrafo"
          disabled={!ready || blocked || !editor}
          value={
            [1, 2, 3].find((level) => editor?.isActive("heading", { level })) ||
            "paragraph"
          }
          onChange={(event) =>
            event.target.value === "paragraph"
              ? editor.chain().focus().setParagraph().run()
              : editor
                  .chain()
                  .focus()
                  .setHeading({ level: Number(event.target.value) })
                  .run()
          }
        >
          <option value="paragraph">Parágrafo</option>
          <option value="1">Título 1</option>
          <option value="2">Título 2</option>
          <option value="3">Título 3</option>
        </select>
        <button
          type="button"
          disabled={!ready || blocked || !editor}
          onClick={link}
          title="Link"
          aria-label="Link"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2" />
          </svg>
        </button>
        <button
          type="button"
          disabled={!ready || blocked || !editor}
          onClick={() => editor.chain().focus().undo().run()}
          title="Desfazer"
          aria-label="Desfazer"
        >
          <span aria-hidden="true">↶</span>
        </button>
        <button
          type="button"
          disabled={!ready || blocked || !editor}
          onClick={() => editor.chain().focus().redo().run()}
          title="Refazer"
          aria-label="Refazer"
        >
          <span aria-hidden="true">↷</span>
        </button>
      </div>
      <EditorContent editor={editor} className={styles.editor} />
      <p className={styles.hint}>
        Somente texto e formatação · Até 1 MB por capítulo · Salvamento após 2
        segundos de pausa ou a cada 15 segundos.
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
