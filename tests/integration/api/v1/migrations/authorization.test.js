import orchestrator from "tests/orchestrator.js";
import session from "models/session.js";
import database from "infra/database.js";

let administratorCookie;
let userCookie;
let expiredCookie;

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDataBase();
  await orchestrator.runPendingMigrations();
  administratorCookie = await orchestrator.createAdministratorCookie();
  const user = await orchestrator.createUser({});
  userCookie = `trama_session_id=${(await session.create(user.id)).token}`;
  const expiredSession = await session.create(user.id);
  await database.query({
    text: "UPDATE sessions SET expires_at = now() - interval '1 second' WHERE id = $1",
    values: [expiredSession.id],
  });
  expiredCookie = `trama_session_id=${expiredSession.token}`;
});

describe.each(["GET", "POST"])("%s /api/v1/migrations", (method) => {
  test.each([
    ["missing", undefined],
    ["malformed", "trama_session_id=invalid"],
    ["unknown", `trama_session_id=${"0".repeat(96)}`],
    ["expired", () => expiredCookie],
  ])("Rejects a %s session", async (_description, cookie) => {
    const response = await request(
      typeof cookie === "function" ? cookie() : cookie,
    );
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect((await response.json()).name).toBe("UnauthorizedError");
  });

  test("Rejects a regular user", async () => {
    const response = await request(userCookie);
    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect((await response.json()).name).toBe("ForbiddenError");
  });

  test("Allows an administrator when no migrations are pending", async () => {
    const response = await request(administratorCookie);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.json()).toEqual([]);
  });

  function request(cookie) {
    return fetch("http://127.0.0.1:3002/api/v1/migrations", {
      method,
      headers: cookie ? { Cookie: cookie } : {},
    });
  }
});
