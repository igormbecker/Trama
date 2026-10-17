import { useEffect } from "react";
import { recordAccess } from "./recentActivity";

export default function useRecordAccess(userId, workId, chapterId) {
  useEffect(() => {
    try {
      recordAccess(window.localStorage, userId, workId, chapterId);
    } catch {
      // Access history is optional; it must never prevent opening a work.
    }
  }, [userId, workId, chapterId]);
}
