import DownloadIcon from "components/icons/DownloadIcon";
import useActionState from "components/shared/useActionState";
import { useState } from "react";
import Link from "next/link";
import styles from "./chapter.module.css";
import { getProjectLabels } from "./projectLabels";

export default function ExportWorkButtons({ workId, disabled, projectType }) {
  const labels = getProjectLabels(projectType);
  const [busy, setBusy, pendingRef] = useActionState("");
  const [error, setError] = useState("");
  async function download(format) {
    if (pendingRef.current) {
      return;
    }
    setBusy(format);
    setError("");
    let url;
    try {
      const response = await fetch(
        `/api/v1/works/${workId}/export?format=${format}`,
        { credentials: "same-origin", cache: "no-store" },
      );
      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Sua sessão expirou. Entre novamente para exportar."
            : response.status === 404
              ? "Este projeto não está disponível para sua conta."
              : "Não foi possível exportar o projeto. Tente novamente.",
        );
      }
      url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download =
        response.headers
          .get("Content-Disposition")
          ?.match(/filename="([^"]+)"/)?.[1] || `${labels.name}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (failure) {
      setError(
        failure.message ||
          "Não foi possível baixar o arquivo. Tente novamente.",
      );
    } finally {
      if (url) {
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      setBusy("");
    }
  }
  return (
    <>
      <div
        className={styles.actions}
        aria-label={`Exportar ${labels.name}`}
        aria-busy={Boolean(busy)}
      >
        {["docx", "pdf"].map((format) => (
          <button
            key={format}
            type="button"
            disabled={disabled || Boolean(busy)}
            aria-busy={busy === format}
            onClick={() => download(format)}
          >
            <DownloadIcon />
            {busy === format
              ? "Gerando arquivo…"
              : `Exportar ${format.toUpperCase()}`}
          </button>
        ))}
      </div>
      <p>
        <Link href={`/works/${workId}#work-credits`}>
          Conferir créditos antes de exportar
        </Link>
      </p>
      {busy && (
        <p role="status">Preparando {busy.toUpperCase()} para download…</p>
      )}
      {error && <p role="alert">{error}</p>}
    </>
  );
}
