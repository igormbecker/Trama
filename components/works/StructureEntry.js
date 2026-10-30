import { useEffect, useRef } from "react";
import observeStructureActions from "./observeStructureActions";

export default function StructureEntry({ className, children }) {
  const entry = useRef(null);
  useEffect(() => {
    const row = entry.current?.querySelector(
      ":scope > [data-structure-actions]",
    );
    if (row) {
      return observeStructureActions(entry.current, row);
    }
  }, [children]);
  return (
    <li ref={entry} className={className}>
      {children}
    </li>
  );
}
