export function getStatusReturnPath(value) {
  if (typeof value !== "string") {
    return "/";
  }

  const hasUnsafeCharacters = Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return character === "\\" || code < 32 || code === 127;
  });

  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    hasUnsafeCharacters ||
    value.split(/[?#]/)[0] === "/status"
  ) {
    return "/";
  }
  return value;
}
