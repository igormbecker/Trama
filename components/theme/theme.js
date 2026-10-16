const cookieName = "trama_theme";

export function readThemeCookie(cookie = "") {
  const preference = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`));
  return preference === `${cookieName}=dark` ? "dark" : "light";
}

export function createThemeCookie(theme, isSecure) {
  if (theme !== "light" && theme !== "dark") {
    throw new Error("Invalid theme.");
  }
  return `${cookieName}=${theme}; Max-Age=31536000; Path=/; SameSite=Lax${isSecure ? "; Secure" : ""}`;
}
