import useSWR from "swr";
import useParticipations, {
  needsParticipationAction,
} from "components/works/useParticipations";
jest.mock("swr", () => jest.fn());

test("Refreshes assigned requests periodically, on focus and after reconnecting", () => {
  const initial = [{ status: "writing" }];
  useParticipations("user", initial);
  expect(useSWR).toHaveBeenCalledWith(
    ["/api/v1/participations", "user"],
    expect.any(Function),
    expect.objectContaining({
      fallbackData: initial,
      refreshInterval: 30000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }),
  );
});
test.each([
  ["contribution", "writing", true],
  ["contribution", "waiting", false],
  ["review", "writing", true],
  ["review", "waiting", true],
  ["review", "approved", false],
  ["review", "canceled", false],
])("Counts only work awaiting my action: %s / %s", (kind, status, pending) => {
  expect(needsParticipationAction({ kind, status })).toBe(pending);
});
