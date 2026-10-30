import useActionState from "components/shared/useActionState";
import { useState } from "react";
import SuccessMessage from "components/shared/SuccessMessage";
import { saveStructure } from "./structureClient";
import styles from "./works.module.css";
import { getProjectLabels } from "./projectLabels";

const groups = [
  ["authors", "Autoria"],
  ["contributors", "Contribuições"],
  ["reviewers", "Revisão"],
];
export default function WorkCreditsPanel({ workId, initialData, projectType }) {
  const labels = getProjectLabels(projectType);
  const [draft, setDraft] = useState(() =>
    Object.fromEntries(
      groups.map(([group]) => [
        group,
        (initialData?.has_saved_credits === false && group !== "authors"
          ? initialData?.suggestions?.[group] || []
          : initialData?.credits?.[group] || []
        ).join("\n"),
      ]),
    ),
  );
  const [busy, setBusy, pendingRef] = useActionState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  async function save(event) {
    event.preventDefault();
    if (pendingRef.current) {
      return;
    }
    setBusy(true);
    setSaved(false);
    setError("");
    try {
      const credits = Object.fromEntries(
        groups.map(([group]) => [
          group,
          draft[group]
            .split(/\r?\n/u)
            .map((line) => line.trim())
            .filter(Boolean),
        ]),
      );
      await saveStructure(`/api/v1/works/${workId}/credits`, "PUT", credits);
      setSaved(true);
    } catch (failure) {
      setError(
        failure.status === 400
          ? "Confira os limites: 50 linhas por grupo, 255 caracteres por autor e 1.000 por contribuição ou revisão."
          : failure.message,
      );
    } finally {
      setBusy(false);
    }
  }
  function change(group, value) {
    setDraft((current) => ({ ...current, [group]: value }));
    setSaved(false);
  }
  return (
    <details
      id="work-credits"
      className={`${styles.panel} ${styles.structureForm}`}
    >
      <summary>Créditos para exportação</summary>
      <p className={styles.creditsIntroduction}>
        Confira os nomes que aparecerão após a capa do PDF e do DOCX. A autoria
        é informada por você e pode incluir pessoas sem conta no Trama.
        Participar do projeto não atribui autoria automaticamente.
      </p>
      <form onSubmit={save} aria-busy={busy}>
        {groups.map(([group, label]) => (
          <div key={group}>
            <label htmlFor={`credits-${group}`}>{label}</label>
            <p id={`credits-${group}-hint`}>
              {group === "authors"
                ? "Um autor por linha, na ordem dos créditos."
                : `Uma pessoa por linha; inclua ${labels.chapters}, se desejar. Exemplo: Ana Silva — ${labels.chapterTitle} 1 e 2.`}
            </p>
            <textarea
              id={`credits-${group}`}
              aria-describedby={`credits-${group}-hint`}
              value={draft[group]}
              onChange={(event) => change(group, event.target.value)}
              disabled={busy}
              maxLength={group === "authors" ? 12800 : 50100}
            />
            {initialData?.suggestions?.[group]?.length > 0 && (
              <div className={styles.creditSuggestions}>
                <p>
                  Sugestões do histórico — adicione apenas os créditos que
                  deseja publicar:
                </p>
                {initialData.suggestions[group].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      change(
                        group,
                        [
                          ...new Set([
                            ...draft[group]
                              .split("\n")
                              .map((line) => line.trim())
                              .filter(Boolean),
                            suggestion,
                          ]),
                        ].join("\n"),
                      )
                    }
                  >
                    Adicionar: {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        <button type="submit" disabled={busy} aria-busy={busy}>
          {busy ? "Salvando…" : "Salvar créditos"}
        </button>
        {error && <p role="alert">{error}</p>}
        {saved && (
          <SuccessMessage>
            Créditos salvos. As próximas exportações usarão estes nomes.
          </SuccessMessage>
        )}
      </form>
    </details>
  );
}
