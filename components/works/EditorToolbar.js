import LinkIcon from "components/icons/LinkIcon";
import { useId, useState } from "react";
import styles from "./chapter.module.css";

export default function EditorToolbar({ editor, disabled, onLink }) {
  const [expanded, setExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const moreId = useId();
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
    <div className={styles.toolbarSlot}>
      <button
        type="button"
        className={styles.mobileFormatToggle}
        aria-expanded={mobileOpen}
        aria-controls={`${moreId}-formatting`}
        disabled={disabled}
        onPointerDown={preserveSelection}
        onMouseDown={preserveSelection}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        Formatar texto
      </button>
      <div
        id={`${moreId}-formatting`}
        className={styles.toolbar}
        role="group"
        aria-label="Formatação"
        data-mobile-open={mobileOpen}
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
          {button("Link", <LinkIcon />, onLink, "link")}
          {button("Refazer", "↷", () => chain().redo().run())}
        </div>
      </div>
    </div>
  );
}
