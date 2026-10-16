import orchestrator from "tests/orchestrator.js";
beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

test.each(["/", "/login", "/register", "/status"])(
  "Renders the saved dark theme in the initial HTML of %s",
  async (path) => {
    const response = await fetch(`http://127.0.0.1:3002${path}`, {
      headers: { Cookie: "trama_theme=dark" },
    });
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('data-theme="dark"');
    expect(html).not.toContain('data-theme="light"');
  },
);

test.each([undefined, "trama_theme=invalid"])(
  "Defaults to light for absent or invalid cookie: %s",
  async (cookie) => {
    const response = await fetch("http://127.0.0.1:3002/", {
      headers: cookie ? { Cookie: cookie } : {},
    });
    expect(await response.text()).toContain('data-theme="light"');
  },
);
