export default function VoiceActionIcon({ action }) {
  const paths = {
    pause: "M8 5v14M16 5v14",
    resume: "m8 4 12 8-12 8V4Z",
    stop: "M5 5h14v14H5V5Z",
    transcribe:
      "m5 3 1.5 4.5L11 9l-4.5 1.5L5 15l-1.5-4.5L0 9l3.5-1.5L5 3ZM13 5h8M13 10h8M9 16h12M5 21h16",
    save: "M5 3h12l4 4v14H3V3h2ZM7 3v6h10V3M7 21v-8h10v8",
    insert: "M4 4h16M4 9h16M12 13v8m-4-4 4 4 4-4",
  };
  return (
    <svg
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
