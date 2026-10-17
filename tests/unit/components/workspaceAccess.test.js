import { getServerSideProps } from "pages/home";
import authentication from "models/authentication";
import work from "models/work";
import { UnauthorizedError } from "infra/errors";

jest.mock("models/authentication", () => ({ authenticateSession: jest.fn() }));
jest.mock("models/work", () => ({ findAllForUser: jest.fn() }));

test("The workspace redirects unauthenticated visitors without listing works", async () => {
  authentication.authenticateSession.mockRejectedValue(
    new UnauthorizedError({ message: "No session" }),
  );
  const res = { setHeader: jest.fn() };
  const result = await getServerSideProps({ req: { cookies: {} }, res });
  expect(result).toEqual({
    redirect: { destination: "/login", permanent: false },
  });
  expect(work.findAllForUser).not.toHaveBeenCalled();
  expect(res.setHeader).toHaveBeenCalledWith(
    "Cache-Control",
    "private, no-store",
  );
});

test("Lists works for the authenticated account and exposes only public profile fields", async () => {
  authentication.authenticateSession.mockResolvedValue({
    id: "alice",
    name: "Alice",
    is_admin: false,
    password: "hidden",
  });
  work.findAllForUser.mockResolvedValue([{ id: "accessible" }]);
  const result = await getServerSideProps({
    req: { cookies: { trama_session_id: "session" } },
    res: { setHeader: jest.fn() },
  });
  expect(work.findAllForUser).toHaveBeenCalledWith("alice");
  expect(result.props).toEqual({
    user: { id: "alice", name: "Alice", is_admin: false },
    works: [{ id: "accessible" }],
  });
});
