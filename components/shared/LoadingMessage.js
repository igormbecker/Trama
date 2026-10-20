import styles from "./loadingMessage.module.css";

export default function LoadingMessage({ pending, children = "Processando…" }) {
  return pending ? (
    <p className={styles.message} role="status">
      <span className={styles.spinner} aria-hidden="true" />
      {children}
    </p>
  ) : null;
}
