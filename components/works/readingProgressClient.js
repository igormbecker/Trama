export async function updateReadingProgress(
  workId,
  chapterId,
  position,
  voice,
) {
  const response = await fetch(`/api/v1/works/${workId}/reading-progress`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chapterId, position, voice }),
    keepalive: true,
  });
  if (!response.ok) {
    throw new Error("Não foi possível sincronizar o progresso.");
  }
}
