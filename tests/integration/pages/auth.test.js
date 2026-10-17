import orchestrator from "tests/orchestrator.js";
import session from "models/session.js";
import database from "infra/database.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDataBase();
  await orchestrator.runPendingMigrations();
});

describe("Authentication pages", () => {
  test("Offers a login link on the homepage", async () => {
    const response = await fetch("http://127.0.0.1:3002/");
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('href="/login"');
  });

  test("Provides a login form with accessible labels and password autocomplete", async () => {
    const response = await fetch("http://127.0.0.1:3002/login");
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toMatch(/<title[^>]*>Entrar \| Trama<\/title>/);
    expect(html).toMatch(/<label[^>]*for="email"[^>]*>E-mail<\/label>/);
    expect(html).toMatch(/<label[^>]*for="password"[^>]*>Senha<\/label>/);
    expect(html).toContain('type="email"');
    expect(html).toContain('type="password"');
    expect(html).toContain('autoComplete="username"');
    expect(html).toContain('autoComplete="current-password"');
    expect(html).toMatch(/<form[^>]*method="post"/);
    expect(html).toContain('type="submit"');
    // Next.js overrides rendered-page cache headers in development.
    expect(response.headers.get("cache-control")).toMatch(/no-store|no-cache/);
  });

  test.each([
    ["no session", undefined],
    ["malformed session", "trama_session_id=invalid"],
    ["unknown session", `trama_session_id=${"0".repeat(96)}`],
  ])(
    "Redirects visitors with %s away from the protected page",
    async (_description, cookie) => {
      const response = await fetch("http://127.0.0.1:3002/works", {
        redirect: "manual",
        headers: cookie ? { Cookie: cookie } : {},
      });
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("/login");
      // Next.js overrides rendered-page cache headers in development.
      expect(response.headers.get("cache-control")).toMatch(
        /no-store|no-cache/,
      );
    },
  );

  test("Redirects an expired session to login", async () => {
    const createdUser = await orchestrator.createUser({});
    const createdSession = await session.create(createdUser.id);
    await database.query({
      text: "UPDATE sessions SET expires_at = now() - interval '1 second' WHERE id = $1;",
      values: [createdSession.id],
    });
    const response = await fetch("http://127.0.0.1:3002/works", {
      redirect: "manual",
      headers: { Cookie: `trama_session_id=${createdSession.token}` },
    });
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("/login");
  });

  test("Renders the protected page with only the user data needed by the interface", async () => {
    const createdUser = await orchestrator.createUser({
      name: "Pessoa de teste",
    });
    const createdSession = await session.create(createdUser.id);
    const response = await fetch("http://127.0.0.1:3002/works", {
      headers: { Cookie: `trama_session_id=${createdSession.token}` },
    });
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toMatch(/<title[^>]*>Minhas obras \| Trama<\/title>/);
    expect(html).toContain("Minhas obras");
    expect(html).toContain("Pessoa de teste");
    expect(html).toContain("Sair");
    expect(html).not.toContain(createdUser.password);
    expect(html).not.toContain(createdSession.token);
    const nextData = JSON.parse(
      html.match(
        /<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/s,
      )[1],
    );
    expect(nextData.props.pageProps.user).toEqual({
      id: createdUser.id,
      name: createdUser.name,
      is_admin: false,
    });
    // Next.js overrides rendered-page cache headers in development.
    expect(response.headers.get("cache-control")).toMatch(/no-store|no-cache/);
  });

  test("Redirects an authenticated visitor from login to the protected page", async () => {
    const createdUser = await orchestrator.createUser({});
    const createdSession = await session.create(createdUser.id);
    const response = await fetch("http://127.0.0.1:3002/login", {
      redirect: "manual",
      headers: { Cookie: `trama_session_id=${createdSession.token}` },
    });
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("/home");
  });

  test("Keeps the login page accessible when its cookie has expired", async () => {
    const createdUser = await orchestrator.createUser({});
    const createdSession = await session.create(createdUser.id);
    await database.query({
      text: "UPDATE sessions SET expires_at = now() - interval '1 second' WHERE id = $1;",
      values: [createdSession.id],
    });
    const response = await fetch("http://127.0.0.1:3002/login", {
      redirect: "manual",
      headers: { Cookie: `trama_session_id=${createdSession.token}` },
    });
    expect(response.status).toBe(200);
  });
});

describe("Registration page", () => {
  test("Explains restricted access without offering public registration", async () => {
    const login = await fetch("http://127.0.0.1:3002/login");
    expect(await login.text()).not.toContain('href="/register"');
    const response = await fetch("http://127.0.0.1:3002/register");
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("O cadastro público está fechado.");
    for (const field of ["name", "username", "email", "password"]) {
      expect(html).not.toContain(`for="${field}"`);
    }
    expect(html).not.toContain('autoComplete="new-password"');
    expect(html).not.toMatch(/<form[^>]*method="post"/);
    expect(html).toContain('href="/login"');
  });

  test("Shows a confirmation after registration on the login page", async () => {
    const response = await fetch(
      "http://127.0.0.1:3002/login?registration=complete",
    );
    expect(await response.text()).toContain(
      "Conta criada! Entre com seu e-mail e senha.",
    );
  });

  test("Redirects authenticated visitors away from registration", async () => {
    const createdUser = await orchestrator.createUser({});
    const createdSession = await session.create(createdUser.id);
    const response = await fetch("http://127.0.0.1:3002/register", {
      redirect: "manual",
      headers: { Cookie: `trama_session_id=${createdSession.token}` },
    });
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("/home");
  });
});
