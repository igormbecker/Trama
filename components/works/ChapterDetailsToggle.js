import ChapterDetailsIcon from "components/icons/ChapterDetailsIcon";
import styles from "./chapter.module.css";

export default function ChapterDetailsToggle({ open, onToggle }) {
  const label = open
    ? "Ocultar detalhes do capítulo"
    : "Mostrar detalhes do capítulo";
  return (
    <button
      type="button"
      className={styles.detailsToggle}
      aria-controls="chapter-heading chapter-editorial-details"
      aria-expanded={open}
      aria-label={label}
      title={label}
      onClick={onToggle}
    >
      <ChapterDetailsIcon open={open} />
    </button>
  );
}
