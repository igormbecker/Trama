const emptyActivity = () => ({ works: [], chapter: null });
const key = (userId) => `trama:activity:v1:${userId}`;

export function readActivity(storage, userId) {
  try {
    const value = JSON.parse(storage.getItem(key(userId)));
    if (!value || !Array.isArray(value.works)) return emptyActivity();
    const chapter = value.chapter;
    return {
      works: [
        ...new Set(
          value.works.filter(
            (id) => typeof id === "string" && id.length <= 100,
          ),
        ),
      ].slice(0, 20),
      chapter:
        chapter &&
        typeof chapter.workId === "string" &&
        typeof chapter.chapterId === "string"
          ? { workId: chapter.workId, chapterId: chapter.chapterId }
          : null,
    };
  } catch {
    return emptyActivity();
  }
}

export function recordAccess(storage, userId, workId, chapterId) {
  try {
    const activity = readActivity(storage, userId);
    storage.setItem(
      key(userId),
      JSON.stringify({
        works: [workId, ...activity.works.filter((id) => id !== workId)].slice(
          0,
          20,
        ),
        chapter: chapterId ? { workId, chapterId } : activity.chapter,
      }),
    );
  } catch {
    // Browsing and writing remain available when storage is blocked.
  }
}

export function recentWorks(activity, works) {
  const available = new Map(works.map((work) => [work.id, work]));
  return activity.works
    .map((id) => available.get(id))
    .filter(Boolean)
    .slice(0, 5);
}
