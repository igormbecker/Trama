import SuccessIcon from "components/shared/SuccessIcon";
import styles from "./works.module.css";

export default function ChapterEditorialStatus({ request }) {
  if (!request) return null;
  const isReview = request.kind === "review";
  const approved =
    request.status === "approved" &&
    (!isReview || request.review_verdict === "approved");
  let label;
  if (request.status === "canceled") label = "Pedido cancelado";
  else if (isReview)
    label =
      request.review_verdict === "changes_requested"
        ? "Correções solicitadas"
        : request.review_verdict === "approved"
          ? "Aprovado pelo revisor"
          : request.status === "approved"
            ? "Revisão concluída"
            : "Em revisão";
  else
    label =
      request.status === "waiting"
        ? "Aguardando aprovação"
        : request.status === "approved"
          ? "Contribuição incorporada"
          : request.adjustments_requested
            ? "Ajustes solicitados"
            : "Em contribuição";
  return (
    <p className={styles.editorialProgress}>
      <span
        className={`${styles.editorialBadge} ${approved ? styles.editorialApproved : ""}`}
      >
        {approved && <SuccessIcon />}
        {label}
      </span>
      <span>
        {isReview ? "Revisão" : "Contribuição"} ·{" "}
        {request.assignee_name || "Pessoa indisponível"}
      </span>
    </p>
  );
}
