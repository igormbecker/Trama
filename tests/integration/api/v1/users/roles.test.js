import orchestrator from "tests/orchestrator.js";
import database from "infra/database.js";
import session from "models/session.js";
import user from "models/user.js";
let administrator;
let cookie;
beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDataBase();
  await orchestrator.runPendingMigrations();
  administrator = await orchestrator.createUser({ username: "role-admin" });
  await database.query({
    text: "UPDATE users SET is_admin = true WHERE id = $1",
    values: [administrator.id],
  });
  cookie = `trama_session_id=${(await session.create(administrator.id)).token}`;
});
async function patch(username, body, token = cookie) {
  return fetch(`http://127.0.0.1:3002/api/v1/users/${username}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: token },
    body: JSON.stringify(body),
  });
}
test("Protects the last administrator from demotion", async () => {
  const response = await patch("role-admin", { is_admin: false });
  expect(response.status).toBe(400);
  expect((await response.json()).message).toBe(
    "At least one administrator must remain.",
  );
  expect((await user.findOneByUsername("role-admin")).is_admin).toBe(true);
});
test("Administrators can promote and demote another account", async () => {
  const target = await orchestrator.createUser({ username: "role-reader" });
  let response = await patch("role-reader", {
    name: "New administrator",
    is_admin: true,
  });
  expect(response.status).toBe(200);
  expect((await response.json()).is_admin).toBe(true);
  response = await patch("role-reader", { is_admin: false });
  expect(response.status).toBe(200);
  expect((await response.json()).is_admin).toBe(false);
  const readerCookie = `trama_session_id=${(await session.create(target.id)).token}`;
  expect(
    (await patch("role-reader", { is_admin: true }, readerCookie)).status,
  ).toBe(403);
});
test("Concurrent demotions cannot leave the system without administrators", async () => {
  const second = await orchestrator.createUser({
    username: "second-role-admin",
  });
  await patch(second.username, { is_admin: true });
  const secondCookie = `trama_session_id=${(await session.create(second.id)).token}`;
  const results = await Promise.all([
    patch("role-admin", { is_admin: false }),
    patch(second.username, { is_admin: false }, secondCookie),
  ]);
  expect(results.map((response) => response.status).sort()).toEqual([200, 400]);
  const count = await database.query(
    "SELECT count(*)::int AS count FROM users WHERE is_admin = true",
  );
  expect(count.rows[0].count).toBe(1);
});
