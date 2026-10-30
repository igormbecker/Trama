export default function StructureActionIcon({ action, className }) {
  const paths = {
    add: "M12 5v14M5 12h14",
    edit: "m15 4 5 5M4 20l5-1L21 7l-5-5L4 14v6Z",
    write: "M14 3H5v18h14V11M8 8h3M8 12h3m2 3 2-5 5-5 3 3-5 5-5 2Z",
  };
  return (
    <svg
      className={className}
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
