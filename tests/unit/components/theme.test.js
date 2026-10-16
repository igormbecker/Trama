import { readThemeCookie, createThemeCookie } from "components/theme/theme.js";

test.each([
  [undefined, "light"],
  ["", "light"],
  ["trama_theme=dark", "dark"],
  ["trama_theme=light", "light"],
  ["other=dark; trama_theme=dark; trama_session_id=secret", "dark"],
  ["trama_theme=invalid", "light"],
  ["trama_theme=%broken", "light"],
  ["other_trama_theme=dark", "light"],
])("Reads only a supported theme from %s", (cookie, expected) => {
  expect(readThemeCookie(cookie)).toBe(expected);
});

test("Persists the preference across all pages for one year", () => {
  expect(createThemeCookie("dark", false)).toBe(
    "trama_theme=dark; Max-Age=31536000; Path=/; SameSite=Lax",
  );
});
test("Uses Secure on HTTPS and rejects unsupported values", () => {
  expect(createThemeCookie("light", true)).toContain("; Secure");
  expect(() => createThemeCookie("invalid", false)).toThrow("Invalid theme.");
});
