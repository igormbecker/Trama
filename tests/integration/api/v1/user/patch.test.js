import orchestrator from "tests/orchestrator.js";
import session from "models/session.js";
import user from "models/user.js";
import password from "models/password.js";
let reader;
let cookie;
beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDataBase();
  await orchestrator.runPendingMigrations();
  reader = await orchestrator.createUser({ username: "account-reader" });
  cookie = `trama_session_id=${(await session.create(reader.id)).token}`;
});
function patch(body, token = cookie) {
  return fetch("http://127.0.0.1:3002/api/v1/user", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Cookie: token } : {}),
    },
    body: JSON.stringify(body),
  });
}
test("Requires authentication to edit the current account", async () => {
  expect((await patch({ name: "Anonymous" }, "")).status).toBe(401);
});
test("Changes only the current account without exposing password hashes", async () => {
  const response = await patch({
    name: "Updated account",
    username: reader.username,
    email: reader.email,
  });
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toContain("no-store");
  const body = await response.json();
  expect(body.id).toBe(reader.id);
  expect(body.name).toBe("Updated account");
  expect(body).not.toHaveProperty("password");
});
test.each([
  { is_admin: true },
  { id: "another-account" },
  { name: " " },
  { email: "invalid" },
])("Rejects privileged or invalid self updates: %#", async (body) => {
  expect((await patch(body)).status).toBe(400);
  expect((await user.findOneById(reader.id)).is_admin).toBe(false);
});
test("Shows an authenticated account form and moves the theme control into it", async () => {
  const page = await fetch("http://127.0.0.1:3002/account", {
    headers: { Cookie: cookie },
  });
  expect(page.status).toBe(200);
  const html = await page.text();
  expect(html).toContain("Minha conta");
  expect(html).toContain("Salvar alterações");
  expect(html).toContain('id="account-theme"');
  expect(html.match(/<select/g)).toHaveLength(1);
  expect(html).not.toContain(reader.password);
  const works = await fetch("http://127.0.0.1:3002/works", {
    headers: { Cookie: cookie },
  });
  const worksHtml = await works.text();
  expect(worksHtml).toContain('href="/account"');
  expect(worksHtml).not.toContain('id="theme"');
  expect(worksHtml).toContain('id="project-type"');
  const home = await fetch("http://127.0.0.1:3002/", {
    headers: { Cookie: cookie },
  });
  expect(await home.text()).not.toContain("<select");
  const visitor = await fetch("http://127.0.0.1:3002/account", {
    redirect: "manual",
  });
  expect(visitor.headers.get("location")).toBe("/login");
});

test.each([
  { password: "new-password" },
  { password: "new-password", password_confirmation: "different" },
  { password: "", password_confirmation: "confirmation-only" },
  { password: "short", password_confirmation: "short" },
  { password: 123, password_confirmation: 123 },
])("Rejects invalid password changes on the server: %#", async (input) => {
  expect((await patch(input)).status).toBe(400);
  expect(
    await password.compare(
      "validpassword",
      (await user.findOneById(reader.id)).password,
    ),
  ).toBe(true);
});
test("Blank password fields preserve the existing password", async () => {
  const response = await patch({
    name: "Preserved password",
    password: "",
    password_confirmation: "",
  });
  expect(response.status).toBe(200);
  expect(
    await password.compare(
      "validpassword",
      (await user.findOneById(reader.id)).password,
    ),
  ).toBe(true);
});
test("A common user can change their own password and sign in with it", async () => {
  const owner = await orchestrator.createUser({
    username: "password-owner",
    password: "original-password",
  });
  const ownerCookie = `trama_session_id=${(await session.create(owner.id)).token}`;
  const response = await patch(
    { password: "updated-password", password_confirmation: "updated-password" },
    ownerCookie,
  );
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.id).toBe(owner.id);
  expect(body.is_admin).toBe(false);
  expect(body).not.toHaveProperty("password");
  expect(body).not.toHaveProperty("password_confirmation");
  const stored = await user.findOneById(owner.id);
  expect(await password.compare("updated-password", stored.password)).toBe(
    true,
  );
  expect(await password.compare("original-password", stored.password)).toBe(
    false,
  );
  for (const [providedPassword, status] of [
    ["original-password", 401],
    ["updated-password", 201],
  ]) {
    const login = await fetch("http://127.0.0.1:3002/api/v1/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: owner.email, password: providedPassword }),
    });
    expect(login.status).toBe(status);
  }
  expect(
    await password.compare(
      "validpassword",
      (await user.findOneById(reader.id)).password,
    ),
  ).toBe(true);
});
test("Provides optional new-password and confirmation fields", async () => {
  const response = await fetch("http://127.0.0.1:3002/account", {
    headers: { Cookie: cookie },
  });
  const html = await response.text();
  expect(html).toContain('id="account-password"');
  expect(html).toContain('id="account-password-confirmation"');
  expect(html.match(/autoComplete="new-password"/g)).toHaveLength(2);
  expect(html).toContain("Confirmar nova senha");
});
