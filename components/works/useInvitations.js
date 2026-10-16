import useSWR from "swr";
import { listMyInvitations } from "./participantsClient";

export default function useInvitations(userId, initialInvitations) {
  return useSWR(
    userId ? ["/api/v1/invitations", userId] : null,
    listMyInvitations,
    {
      fallbackData: initialInvitations,
      refreshInterval: 60000,
    },
  );
}
