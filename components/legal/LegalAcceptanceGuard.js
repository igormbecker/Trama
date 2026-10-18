import { useEffect } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { useAuth } from "components/auth/AuthProvider";
export default function LegalAcceptanceGuard() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { data } = useSWR(
    isAuthenticated ? "/api/v1/legal/acceptance" : null,
    async (path) => {
      const response = await fetch(path, {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!response.ok) return null;
      return response.json();
    },
    {
      revalidateOnFocus: true,
      refreshInterval: 60000,
      shouldRetryOnError: false,
    },
  );
  useEffect(() => {
    const publicPages = [
      "/",
      "/terms",
      "/privacy",
      "/legal/accept",
      "/legal/support",
      "/status",
      "/login",
      "/register",
      "/forgot-password",
      "/reset-password",
    ];
    if (data?.required && !publicPages.includes(router.pathname))
      router.replace("/legal/accept");
  }, [data, router]);
  return null;
}
