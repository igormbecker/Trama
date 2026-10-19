import { useState } from "react";
import Link from "next/link";
import styles from "./chapter.module.css";

export default function ExportWorkButtons({ workId, disabled }) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  async function download(format) {
    if (busy) return;
    setBusy(format);
    setError("");
    let url;
    try {
      const response = await fetch(
        `/api/v1/works/${workId}/export?format=${format}`,
        { credentials: "same-origin", cache: "no-store" },
      );
      if (!response.ok)
        throw new Error(
          response.status === 401
            ? "Sua sessão expirou. Entre novamente para exportar."
            : response.status === 404
              ? "Esta obra não está disponível para sua conta."
              : "Não foi possível exportar a obra. Tente novamente.",
        );
      url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download =
        response.headers
          .get("Content-Disposition")
          ?.match(/filename="([^"]+)"/)?.[1] || `obra.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (failure) {
      setError(
        failure.message ||
          "Não foi possível baixar o arquivo. Tente novamente.",
      );
    } finally {
      if (url) setTimeout(() => URL.revokeObjectURL(url), 1000);
      setBusy("");
    }
  }
  return (
    <>
      <div
        className={styles.actions}
        aria-label="Exportar obra"
        aria-busy={Boolean(busy)}
      >
        {["docx", "pdf"].map((format) => (
          <button
            key={format}
            type="button"
            disabled={disabled || Boolean(busy)}
            onClick={() => download(format)}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{ verticalAlign: "-3px", marginRight: "8px" }}
            >
              <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />
            </svg>
            {busy === format
              ? "Gerando arquivo…"
              : `Exportar ${format.toUpperCase()}`}
          </button>
        ))}
      </div>
      <p>
        <Link href={`/works/${workId}#work-credits`}>
          Conferir créditos da obra antes de exportar
        </Link>
      </p>
      {busy && (
        <p role="status">Preparando {busy.toUpperCase()} para download…</p>
      )}
      {error && <p role="alert">{error}</p>}
    </>
  );
}
