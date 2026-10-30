import ArrowUpIcon from "components/icons/ArrowUpIcon";
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
      data-button
      href="#page-top"
      hidden={!visible}
      aria-label="Voltar ao topo"
      title="Voltar ao topo"
    >
      <ArrowUpIcon />
    </a>
  );
}
