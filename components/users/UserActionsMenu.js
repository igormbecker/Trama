import ButtonActionIcon from "components/icons/ButtonActionIcon";
import MoreOptionsIcon from "components/icons/MoreOptionsIcon";
import { useId, useRef, useState } from "react";
import styles from "./users.module.css";

export default function UserActionsMenu({ name, disabled, children }) {
  const dialog = useRef(null);
  const headingId = useId();
  const [open, setOpen] = useState(false);
  function close() {
    dialog.current?.close();
    setOpen(false);
  }
  return (
    <>
      <button
        type="button"
        className={styles.userOptionsTrigger}
        aria-label={`Opções de ${name}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => {
          dialog.current?.showModal();
          setOpen(true);
        }}
      >
        <MoreOptionsIcon />
      </button>
      <dialog
        ref={dialog}
        className={styles.userOptionsDialog}
        aria-labelledby={headingId}
        onClose={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      >
        <div className={styles.userOptionsHeading}>
          <h2 id={headingId}>Opções do usuário</h2>
          <button type="button" aria-label="Fechar opções" onClick={close}>
            <ButtonActionIcon action="close" iconOnly />
          </button>
        </div>
        <p>{name}</p>
        <div
          className={styles.rowActions}
          onClickCapture={(event) => {
            const button = event.target.closest("button");
            if (button && !button.disabled) {
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
