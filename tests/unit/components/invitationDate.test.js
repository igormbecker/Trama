import { formatInvitationDate } from "components/works/invitationDate.js";

test("Formats invitation timestamps with date, hour and minute in Brasilia time", () => {
  expect(formatInvitationDate("2026-10-16T17:47:42.918Z")).toBe(
    "16/10/2026 às 14:47",
  );
});

test("Uses the local calendar date when UTC falls on the following day", () => {
  expect(formatInvitationDate("2026-10-17T01:05:00.000Z")).toBe(
    "16/10/2026 às 22:05",
  );
});
