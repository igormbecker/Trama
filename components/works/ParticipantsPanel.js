import useActionState from "components/shared/useActionState";
import LoadingMessage from "components/shared/LoadingMessage";
import SuccessMessage from "components/shared/SuccessMessage";
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  inviteOrganizer,
  cancelInvitation,
  removeParticipant,
} from "./participantsClient";
import styles from "./works.module.css";
import { getProjectLabels } from "./projectLabels";

const statusLabels = {
  pending: "Pendente",
  accepted: "Aceito",
  declined: "Recusado",
  canceled: "Cancelado",
  expired: "Expirado",
};

export default function ParticipantsPanel({
  workId,
  participants,
  invitations,
  projectType,
}) {
  const labels = getProjectLabels(projectType);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isBusy, setIsBusy, pendingRef] = useActionState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [removalTarget, setRemovalTarget] = useState(null);
  const pendingInvitations = invitations.filter(
    (invitation) => invitation.status === "pending",
  );

  async function perform(operation, successMessage) {
    if (pendingRef.current) {
      return;
    }
    setIsBusy(true);
    setError("");
    setMessage("");
    try {
      await operation();
      await router.replace(router.asPath, undefined, { scroll: false });
      setMessage(successMessage);
    } catch (error) {
      setError(error.message);
      if (error.status === 401) {
        await router.push("/login");
      }
    } finally {
      setIsBusy(false);
    }
  }
  async function handleInvite(event) {
    event.preventDefault();
    await perform(async () => {
      await inviteOrganizer(workId, email);
      setEmail("");
    }, "Convite enviado por e-mail. A pessoa poderá abrir o link recebido para responder.");
  }
  async function handleRemoval() {
    await perform(async () => {
      await removeParticipant(workId, removalTarget.user_id);
      setRemovalTarget(null);
    }, "Participante removido. O acesso ao projeto foi revogado.");
  }
  return (
    <section
      className={styles.panel}
      aria-labelledby="participants-title"
      aria-busy={isBusy}
    >
      <h2 id="participants-title">Participantes</h2>
      <LoadingMessage pending={isBusy}>
        Atualizando participantes e convites…
      </LoadingMessage>
      <p>
        Convide alguém para consultar {labels.definite} como organizador.
        Somente você gerencia participantes e convites.
      </p>
      {error && <p role="alert">{error}</p>}
      {message && <SuccessMessage>{message}</SuccessMessage>}
      <form onSubmit={handleInvite}>
        <label htmlFor="invite-email">E-mail do organizador</label>
        <input
          id="invite-email"
          type="email"
          name="email"
          required
          maxLength={254}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isBusy}
        />
        <button type="submit" disabled={isBusy} aria-busy={isBusy}>
          {isBusy ? "Aguarde…" : "Enviar convite"}
        </button>
      </form>
      <h3 className={styles.organizersTitle}>Organizadores</h3>
      {participants.length === 0 ? (
        <p>Ainda não há organizadores neste projeto.</p>
      ) : (
        <ul className={styles.workList}>
          {participants.map((participant) => (
            <li
              key={participant.user_id}
              className={`${styles.memberRow} ${styles.organizerRow}`}
            >
              <span>{participant.name} · Organizador</span>
              <button
                type="button"
                disabled={isBusy}
                className={`${styles.dangerButton} ${styles.removeButton}`}
                aria-label={`Remover ${participant.name}`}
                onClick={() => setRemovalTarget(participant)}
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}
      {removalTarget && (
        <div
          className={styles.confirmation}
          role="group"
          aria-label="Confirmar remoção"
        >
          <p>
            Remover {removalTarget.name}? Essa pessoa perderá o acesso ao
            projeto. Suas contribuições serão preservadas.
          </p>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.dangerButton}
              disabled={isBusy}
              onClick={handleRemoval}
            >
              Confirmar remoção
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => setRemovalTarget(null)}
            >
              Voltar
            </button>
          </div>
        </div>
      )}
      <h3>Convites pendentes</h3>
      <p>
        Enviar outro convite para o mesmo e-mail invalida o link pendente
        anterior.
      </p>
      <p>
        <Link href="/invitations#sent-invitations">
          Ver histórico de convites enviados
        </Link>
      </p>
      {pendingInvitations.length === 0 ? (
        <p>Nenhum convite pendente neste projeto.</p>
      ) : (
        <ul className={styles.workList}>
          {pendingInvitations.map((invitation) => (
            <li key={invitation.id} className={styles.memberRow}>
              <span>
                {invitation.email} · {statusLabels[invitation.status]}
              </span>
              {invitation.status === "pending" && (
                <button
                  type="button"
                  className={styles.dangerButton}
                  disabled={isBusy}
                  onClick={() =>
                    perform(async () => {
                      await cancelInvitation(workId, invitation.id);
                    }, "Convite cancelado.")
                  }
                >
                  Cancelar convite para {invitation.email}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
