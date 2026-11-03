import ChapterDetailsIcon from "components/icons/ChapterDetailsIcon";
import styles from "./chapter.module.css";

export default function ChapterDetailsToggle({
  open,
  onToggle,
  controls = "chapter-heading chapter-editorial-details",
  subject = "detalhes do capítulo",
}) {
  const label = open ? `Ocultar ${subject}` : `Mostrar ${subject}`;
  return (
    <button
      type="button"
      className={styles.detailsToggle}
      aria-controls={controls}
      aria-expanded={open}
      aria-label={label}
      title={label}
      onClick={onToggle}
    >
      <ChapterDetailsIcon open={open} />
    </button>
  );
}
