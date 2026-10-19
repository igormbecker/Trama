import { useEffect, useState } from "react";
import styles from "./backToTop.module.css";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function updateVisibility() {
      setVisible(window.scrollY > 300);
    }
    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  return (
    <a
      className={styles.backToTop}
      href="#page-top"
      hidden={!visible}
      aria-label="Voltar ao topo"
      title="Voltar ao topo"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m6 14 6-6 6 6M12 8v12" />
      </svg>
    </a>
  );
}
