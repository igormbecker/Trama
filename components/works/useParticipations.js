import useSWR from "swr";

export function needsParticipationAction(request) {
  return (
    request.status === "writing" ||
    (request.kind === "review" && request.status === "waiting")
  );
}
async function listParticipations([url]) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok)
    throw new Error("Não foi possível atualizar suas participações.");
  return response.json();
}
export default function useParticipations(userId, initialParticipations) {
  return useSWR(
    userId ? ["/api/v1/participations", userId] : null,
    listParticipations,
    {
      fallbackData: initialParticipations,
      refreshInterval: 30000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    },
  );
}
