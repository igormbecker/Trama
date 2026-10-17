import { renderToStaticMarkup } from "react-dom/server";
import HomeLayout from "components/home/HomeLayout";
import { useAuth } from "components/auth/AuthProvider";

jest.mock("components/auth/AuthProvider", () => ({ useAuth: jest.fn() }));
jest.mock("components/theme/ThemeProvider", () => ({
  useTheme: () => ({ theme: "light", setTheme: jest.fn() }),
}));
jest.mock("next/router", () => ({
  useRouter: () => ({ pathname: "/works", asPath: "/works" }),
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
