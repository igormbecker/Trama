import { renderToStaticMarkup } from "react-dom/server";
import HomeLayout from "components/home/HomeLayout";
import { useAuth } from "components/auth/AuthProvider";
let mockPathname = "/works";
let mockAsPath = "/works";

jest.mock("components/auth/AuthProvider", () => ({ useAuth: jest.fn() }));
jest.mock("components/theme/ThemeProvider", () => ({
  useTheme: () => ({ theme: "light", setTheme: jest.fn() }),
}));
jest.mock("next/router", () => ({
  useRouter: () => ({ pathname: mockPathname, asPath: mockAsPath }),
}));

test.each([
  [true, "/home", "Trama — Seu espaço"],
  [false, "/", "Trama — página inicial"],
])(
  "Both brand links follow authentication state (%s)",
  (isAuthenticated, href, label) => {
    useAuth.mockReturnValue({ isAuthenticated });
    const html = renderToStaticMarkup(<HomeLayout>Content</HomeLayout>);
    const links = html.match(/<a\b[^>]*aria-label="Trama — [^"]*"[^>]*>/g);
    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link).toContain(`href="${href}"`);
      expect(link).toContain(`aria-label="${label}"`);
    }
  },
);

test("Does not copy a recovery token into the status return URL", () => {
  mockPathname = "/reset-password";
  mockAsPath = "/reset-password#token=private-recovery-token";
  useAuth.mockReturnValue({ isAuthenticated: false });
  const html = renderToStaticMarkup(<HomeLayout>Content</HomeLayout>);
  expect(html).not.toContain("private-recovery-token");
  expect(html).toContain("returnTo=%2Freset-password");
});
