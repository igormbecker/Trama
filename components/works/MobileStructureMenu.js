import ButtonActionIcon from "components/icons/ButtonActionIcon";
import MoreOptionsIcon from "components/icons/MoreOptionsIcon";
import { useEffect, useId, useRef, useState } from "react";
import styles from "./works.module.css";

export default function MobileStructureMenu({
  label,
  title,
  disabled,
  children,
}) {
  const [open, setOpen] = useState(false);
  const dialog = useRef(null);
  const headingId = useId();
  useEffect(() => {
    const viewport = window.matchMedia("(max-width: 800px)");
    function onViewportChange() {
      if (!viewport.matches) {
        dialog.current?.close();
        setOpen(false);
      }
    }
    viewport.addEventListener("change", onViewportChange);
    return () => viewport.removeEventListener("change", onViewportChange);
  }, []);
  function close() {
    dialog.current?.close();
    setOpen(false);
  }
  return (
    <>
      <button
        type="button"
        className={styles.structureMenuTrigger}
        aria-label={`${label}: ${title}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => {
          setOpen(true);
          dialog.current?.showModal();
        }}
      >
        <MoreOptionsIcon />
      </button>
      <dialog
        ref={dialog}
        className={styles.structureMenu}
        aria-labelledby={headingId}
        onCancel={() => setOpen(false)}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            const bounds = event.currentTarget.getBoundingClientRect();
            if (
              event.clientY < bounds.top ||
              event.clientX < bounds.left ||
              event.clientX > bounds.right ||
              event.clientY > bounds.bottom
            ) {
              close();
            }
          }
        }}
      >
        <div className={styles.structureMenuHandle} aria-hidden="true" />
        <div className={styles.structureMenuHeading}>
          <h3 id={headingId}>{label}</h3>
          <button type="button" aria-label="Fechar opções" onClick={close}>
            <ButtonActionIcon action="close" iconOnly />
          </button>
        </div>
        <p className={styles.structureMenuTitle}>{title}</p>
        <div
          className={styles.structureMenuOptions}
          onClickCapture={(event) => {
            const button = event.target.closest("button");
            // Keep the options open behind the existing trash confirmation.
            if (
              button &&
              !button.disabled &&
              !button.classList.contains(styles.dangerButton)
            ) {
              close();
            }
          }}
        >
          {children}
        </div>
      </dialog>
    </>
  );
}
