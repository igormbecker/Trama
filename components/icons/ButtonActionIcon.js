import styles from "./buttonActionIcon.module.css";

export default function ButtonActionIcon({ action, iconOnly = false }) {
  const paths = {
    save: "M5 3h12l4 4v14H3V3h2ZM7 3v6h10V3M7 21v-8h10v8",
    cancel: "m6 6 12 12M18 6 6 18",
    close: "m6 6 12 12M18 6 6 18",
    check: "m5 12 4 4L19 6",
    send: "m3 3 19 9-19 9 4-9-4-9Zm4 9h15",
    login: "M14 3h7v18h-7M3 12h13m-5-5 5 5-5 5",
    logout: "M10 3H3v18h7m0-9h12m-5-5 5 5-5 5",
    lock: "M6 10h12v11H6V10Zm3 0V6a3 3 0 0 1 6 0v4m-3 4v3",
    userAdd:
      "M15 21v-3a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v3M13 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm6 1v6m-3-3h6",
    userSwitch:
      "M12 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM2 21v-3a4 4 0 0 1 4-4h4m5-9h7m-3-3 3 3-3 3m3 10h-7m3-3-3 3 3 3",
    restore: "M3 10a9 9 0 1 1 1 9M3 4v6h6m3-3v5l3 2",
    read: "M12 5C9 3 5 3 2 4v16c3-1 7-1 10 1m0-16c3-2 7-2 10-1v16c-3-1-7-1-10 1V5Z",
    comment: "M21 4H3v13h5v4l5-4h8V4ZM7 8h10M7 12h7",
    edit: "m15 4 5 5M4 20l5-1L21 7l-5-5L4 14v6Z",
    trash: "M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6",
    add: "M12 5v14M5 12h14",
    back: "M20 12H4m6-6-6 6 6 6",
    up: "M12 20V4m-6 6 6-6 6 6",
    down: "M12 4v16m-6-6 6 6 6-6",
    expand: "m5 9 7 7 7-7",
    collapse: "m5 15 7-7 7 7",
    format: "M3 5h18M12 5v16M8 21h8",
    inspect: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
    replace: "M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4",
    corrections: "M14 3H4v18h16V9l-6-6Zm0 0v6h6M8 13h8M8 17h5",
  };
  return (
    <svg
      className={iconOnly ? styles.iconOnly : styles.icon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[action]} />
    </svg>
  );
}
