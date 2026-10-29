import { useEffect, useId, useRef, useState } from "react";
import { observeToolbarPosition } from "./editorToolbarPosition";
import styles from "./chapter.module.css";

export default function EditorToolbar({
  editor,
  disabled,
  surfaceRef,
  onLink,
}) {
  const [expanded, setExpanded] = useState(false);
  const toolbarRef = useRef(null);
  const slotRef = useRef(null);
  const moreId = useId();

  useEffect(
    () =>
      observeToolbarPosition(
        surfaceRef.current,
        toolbarRef.current,
        slotRef.current,
        window,
      ),
    [surfaceRef],
  );
  function preserveSelection(event) {
    event.preventDefault();
  }
  function chain() {
    return editor.chain().focus(undefined, { scrollIntoView: false });
  }
  function button(label, icon, action, mark) {
    return (
      <button
        type="button"
        title={label}
        aria-label={label}
        aria-pressed={mark ? editor?.isActive(mark) || false : undefined}
        disabled={disabled}
        onPointerDown={preserveSelection}
        onMouseDown={preserveSelection}
        onClick={action}
      >
        <span aria-hidden="true">{icon}</span>
      </button>
    );
  }

  return (
    <div ref={slotRef} className={styles.toolbarSlot}>
      <div
        ref={toolbarRef}
        className={styles.toolbar}
        role="group"
        aria-label="Formatação"
      >
        {button(
          "Negrito",
          <strong>B</strong>,
          () => chain().toggleBold().run(),
          "bold",
        )}
        {button(
          "Itálico",
          <em>I</em>,
          () => chain().toggleItalic().run(),
          "italic",
        )}
        {button("Desfazer", "↶", () => chain().undo().run())}
        <button
          type="button"
          className={styles.toolbarMore}
          aria-expanded={expanded}
          aria-controls={moreId}
          disabled={disabled}
          onPointerDown={preserveSelection}
          onMouseDown={preserveSelection}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Menos" : "Mais"}
        </button>
        <div
          id={moreId}
          className={styles.toolbarExtra}
          data-expanded={expanded}
        >
          {button(
            "Lista",
            "• ≡",
            () => chain().toggleBulletList().run(),
            "bulletList",
          )}
          {button(
            "Lista numerada",
            "1 ≡",
            () => chain().toggleOrderedList().run(),
            "orderedList",
          )}
          <select
            aria-label="Estilo do parágrafo"
            disabled={disabled}
            value={
              [1, 2, 3].find((level) =>
                editor?.isActive("heading", { level }),
              ) || "paragraph"
            }
            onChange={(event) =>
              event.target.value === "paragraph"
                ? chain().setParagraph().run()
                : chain()
                    .setHeading({ level: Number(event.target.value) })
                    .run()
            }
          >
            <option value="paragraph">Parágrafo</option>
            <option value="1">Título 1</option>
            <option value="2">Título 2</option>
            <option value="3">Título 3</option>
          </select>
          {button(
            "Link",
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
            </svg>,
            onLink,
            "link",
          )}
          {button("Refazer", "↷", () => chain().redo().run())}
        </div>
      </div>
    </div>
  );
}
