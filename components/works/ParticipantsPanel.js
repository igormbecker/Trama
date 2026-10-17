import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  copyInvitationLink,
  inviteOrganizer,
  cancelInvitation,
  removeParticipant,
} from "./participantsClient";
import styles from "./works.module.css";

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
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [isCopying, setIsCopying] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [removalTarget, setRemovalTarget] = useState(null);
  const pendingInvitations = invitations.filter(
    (invitation) => invitation.status === "pending",
  );

  async function perform(operation, successMessage) {
    if (isBusy) return;
    setIsBusy(true);
    setError("");
    setMessage("");
    try {
      await operation();
      await router.replace(router.asPath, undefined, { scroll: false });
      setMessage(successMessage);
    } catch (error) {
      setError(error.message);
      if (error.status === 401) await router.push("/login");
    } finally {
      setIsBusy(false);
    }
  }
  async function handleInvite(event) {
    event.preventDefault();
    await perform(async () => {
      const invitation = await inviteOrganizer(workId, email);
      setInviteLink(
        new URL(`/invitations/${invitation.token}`, window.location.origin)
          .href,
      );
      setEmail("");
      setCopyMessage("");
    }, "Convite criado. Compartilhe o link com a pessoa convidada.");
  }
  async function handleCopyLink(event) {
    event.preventDefault();
    event.stopPropagation();
    if (isCopying) return;
    setIsCopying(true);
    setCopyMessage("");
    try {
      await copyInvitationLink(inviteLink);
      setCopyMessage("Link copiado!");
    } catch (error) {
      setCopyMessage(error.message);
    } finally {
      setIsCopying(false);
    }
  }
  async function handleRemoval() {
    await perform(async () => {
      await removeParticipant(workId, removalTarget.user_id);
      setRemovalTarget(null);
    }, "Participante removido. O acesso à obra foi revogado.");
  }
  return (
    <section
      className={styles.panel}
      aria-labelledby="participants-title"
      aria-busy={isBusy}
    >
      <h2 id="participants-title">Participantes</h2>
      <p>
        Convide alguém para consultar esta obra como organizador. Somente você
        gerencia participantes e convites.
      </p>
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
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
        <button type="submit" disabled={isBusy}>
          {isBusy ? "Aguarde…" : "Gerar convite"}
        </button>
      </form>
      {inviteLink && (
        <div className={styles.inviteLink}>
          <label htmlFor="invite-link">Link para compartilhar</label>
          <div className={styles.copyLinkRow}>
            <input
              id="invite-link"
              value={inviteLink}
              readOnly
              onFocus={(event) => event.target.select()}
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={styles.copyButton}
              aria-label={isCopying ? "Copiando link" : "Copiar link"}
              title={isCopying ? "Copiando…" : "Copiar link"}
              disabled={isBusy || isCopying}
              aria-busy={isCopying}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect
                  x="8"
                  y="4"
                  width="12"
                  height="13"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M16 17v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </button>
          </div>
          <p role="status">{copyMessage}</p>
          <p>
            Copie este link e envie para a pessoa convidada. Vale por sete dias
            e exige uma conta com o e-mail informado. Nenhum e-mail é enviado
            automaticamente.
          </p>
        </div>
      )}
      <h3 className={styles.organizersTitle}>Organizadores</h3>
      {participants.length === 0 ? (
        <p>Ainda não há organizadores nesta obra.</p>
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
            Remover {removalTarget.name}? Essa pessoa perderá o acesso à obra.
            Suas contribuições serão preservadas.
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
        Gerar outro convite para o mesmo e-mail invalida o link pendente
        anterior.
      </p>
      <p>
        <Link href="/invitations#sent-invitations">
          Ver histórico de convites enviados
        </Link>
      </p>
      {pendingInvitations.length === 0 ? (
        <p>Nenhum convite pendente nesta obra.</p>
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
                      setInviteLink("");
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
