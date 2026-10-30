export default function ChapterDetailsIcon({ open }) {
  return (
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
      <path
        d={open ? "m5 6 6 6-6 6m8-12 6 6-6 6" : "m11 6-6 6 6 6m8-12-6 6 6 6"}
      />
    </svg>
  );
}
