import { createContext, useCallback, useContext } from "react";
import useSWR from "swr";

const AuthContext = createContext({ isAuthenticated: false });

async function fetchCurrentUser() {
  const response = await fetch("/api/v1/user", {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (response.status === 401) {
    return null;
  }
  if (!response.ok) {
    throw new Error("Could not load the current account.");
  }
  return response.json();
}

export function AuthProvider({ initialUser, hasSessionCookie, children }) {
  const { data, mutate } = useSWR("/api/v1/user", fetchCurrentUser, {
    fallbackData: initialUser,
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });
  const refreshUser = useCallback(() => mutate(), [mutate]);
  const clearUser = useCallback(
    () => mutate(null, { revalidate: false }),
    [mutate],
  );
  const isAuthenticated =
    data === undefined
      ? Boolean(initialUser || hasSessionCookie)
      : Boolean(data);
  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        refreshUser,
        clearUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
