import { createContext, useContext, useState } from "react";
import { createThemeCookie } from "./theme";

const ThemeContext = createContext(null);

export function ThemeProvider({ initialTheme, children }) {
  const [theme, setTheme] = useState(initialTheme);
  function changeTheme(nextTheme) {
    if (nextTheme !== "light" && nextTheme !== "dark") {
      return;
    }
    setTheme(nextTheme);
    try {
      document.cookie = createThemeCookie(
        nextTheme,
        window.location.protocol === "https:",
      );
    } catch {
      // Keep theme selection usable when the browser blocks cookies.
    }
  }
  return (
    <ThemeContext.Provider value={{ theme, setTheme: changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme requires ThemeProvider.");
  }
  return context;
}
