import SuccessIcon from "./SuccessIcon";
import styles from "./successMessage.module.css";

export default function SuccessMessage({ children, ...props }) {
  return (
    <p {...props} role="status" className={styles.message}>
      <SuccessIcon />
      {children}
    </p>
  );
}
