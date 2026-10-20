import useActionState from "components/shared/useActionState";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import styles from "./impersonation.module.css";

async function loadStatus() {
  const response = await fetch("/api/v1/impersonation", {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (response.status === 401) return { active: false };
  if (!response.ok)
    throw new Error("Não foi possível conferir a personificação.");
  return response.json();
}

export default function ImpersonationBanner() {
  const { data, error: statusError } = useSWR(
    "/api/v1/impersonation",
    loadStatus,
    { refreshInterval: 15000, shouldRetryOnError: false },
  );
  const [busy, setBusy, pendingRef] = useActionState(false);
  const [error, setError] = useState("");
  const bannerRef = useRef(null);
  const active = Boolean(data?.active);
  useEffect(() => {
    const banner = bannerRef.current;
    if (!active || !banner) return;
    const style = document.documentElement.style;
    function updateHeight() {
      style.setProperty(
        "--impersonation-banner-height",
        `${banner.getBoundingClientRect().height}px`,
      );
    }
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(banner);
    return () => {
      observer.disconnect();
      style.removeProperty("--impersonation-banner-height");
    };
  }, [active]);
  async function stop() {
    if (pendingRef.current) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/v1/impersonation", {
        method: "DELETE",
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!response.ok)
        throw new Error(
          "Não foi possível retornar. Se sua sessão terminou ou seu perfil mudou, saia e entre novamente.",
        );
      // Reload to discard React and SWR state from the previous identity.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/users");
    } catch (failure) {
      setError(failure.message);
      setBusy(false);
    }
  }
  if (!data?.active) return null;
  const expired = data.expired || new Date(data.expires_at) <= new Date();
  return (
    <aside
      ref={bannerRef}
      className={styles.banner}
      aria-label="Personificação de usuário"
    >
      <p role="status">
        {expired ? "Personificação expirada" : "Você está personificando"}:{" "}
        <strong>{data.name}</strong>. As ações afetam os dados reais dessa
        conta.{" "}
        {expired
          ? "Encerre para voltar à administração."
          : "Limite de 15 minutos. A sessão é compartilhada entre as abas deste navegador."}
      </p>
      <button type="button" onClick={stop} disabled={busy} aria-busy={busy}>
        {busy ? "Retornando…" : "Encerrar personificação"}
      </button>
      {error || statusError ? (
        <p role="alert">{error || statusError.message}</p>
      ) : null}
    </aside>
  );
}
