import { jest } from "@jest/globals";
import { renderToStaticMarkup } from "react-dom/server";
import { ThemeProvider } from "components/theme/ThemeProvider";

jest.mock("swr", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("next/router", () => ({
  useRouter: () => ({ query: {}, replace: jest.fn() }),
}));
const useSWR = require("swr").default;
const StatusPage = require("pages/status/index.js").default;

function render(state, theme = "light") {
  useSWR.mockReturnValue(state);
  return renderToStaticMarkup(
    <ThemeProvider initialTheme={theme}>
      <StatusPage />
    </ThemeProvider>,
  );
}
test("Shows loading status in the shared layout with back navigation", () => {
  const html = render({ isLoading: true });
  expect(html).toContain("Infrastructure status");
  expect(html).toContain("Checking");
  expect(html).toContain("Loading database information");
  expect(html).toContain("Back");
  expect(html).toContain("Tecnologia e Desenvolvimento");
  expect(html).not.toContain("Diagnostics center");
});
test("Shows healthy metrics and the API response while preserving the selected theme", () => {
  const html = render(
    {
      isLoading: false,
      data: {
        updated_at: "2026-10-16T12:00:00Z",
        dependencies: {
          database: {
            version: "16.0",
            opened_connections: 4,
            max_connections: 100,
          },
        },
      },
    },
    "dark",
  );
  expect(html).toContain('data-theme="dark"');
  expect(html).toContain("Healthy");
  expect(html).toContain("Open connections");
  expect(html).toContain("16.0");
  expect(html).toContain("4%");
  expect(html).toContain("opened_connections");
});
test("Does not show an operational status when refresh fails despite stale data", () => {
  const html = render({
    isLoading: false,
    error: new Error("private error"),
    data: {
      updated_at: "2026-10-16T12:00:00Z",
      dependencies: {
        database: {
          version: "16.0",
          opened_connections: 4,
          max_connections: 100,
        },
      },
    },
  });
  expect(html).toContain("Unavailable");
  expect(html).toContain('role="alert"');
  expect(html).not.toContain("Healthy");
  expect(html).not.toContain("private error");
});
test("Explains unavailable information without previous data", () => {
  const html = render({
    isLoading: false,
    error: new Error("private details"),
  });
  expect(html).toContain("Database information is unavailable");
  expect(html).toContain("Response unavailable");
});
