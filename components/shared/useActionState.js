import { useCallback, useRef, useState } from "react";

export default function useActionState(initialValue = false) {
  const [pending, setPending] = useState(initialValue);
  const pendingRef = useRef(initialValue);
  const updatePending = useCallback((value) => {
    pendingRef.current = value;
    setPending(value);
  }, []);
  return [pending, updatePending, pendingRef];
}
