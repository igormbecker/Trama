import useActionState from "components/shared/useActionState";
import LoadingMessage from "components/shared/LoadingMessage";
import SuccessMessage from "components/shared/SuccessMessage";
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import AppLayout from "components/app/AppLayout";
import useInvitations from "./useInvitations";
import { respondToMyInvitation } from "./participantsClient";
import styles from "./works.module.css";
import { formatInvitationDate } from "./invitationDate";

const statusLabels = {
  pending: "Pendente",
  accepted: "Aceito",
  declined: "Recusado",
  canceled: "Cancelado",
  expired: "Expirado",
};

export default function InvitationsPage({
  user,
  invitations,
  sentInvitations = [],
}) {
  const router = useRouter();
  const {
    data: pendingInvitations = [],
    error: loadError,
    mutate,
  } = useInvitations(user.id, invitations);
  const [busyId, setBusyId, pendingRef] = useActionState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function respond(invitation, action) {
    if (pendingRef.current) return;
    setBusyId(invitation.id);
    setError("");
    setMessage("");
    try {
      await respondToMyInvitation(invitation.id, action);
      await mutate(
        (current = []) => current.filter((entry) => entry.id !== invitation.id),
        { revalidate: false },
      );
      if (action === "accept")
        await router.push(`/works/${invitation.work_id}`);
      else setMessage("Convite recusado. Você não recebeu acesso ao projeto.");
    } catch (error) {
      setError(error.message);
      if (error.status === 401) await router.push("/login");
      else if (error.status === 404) await mutate();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AppLayout
      user={user}
      activePage="invitations"
      title="Meus convites | Trama"
      description="Responda aos seus convites para participar de projetos."
      initialInvitations={invitations}
    >
      <section className={styles.workspace} aria-labelledby="invitations-title">
        <div className={styles.heading}>
          <h1 id="invitations-title">Meus convites</h1>
          <p>
            Acompanhe os convites recebidos e os enviados nos projetos pelos
            quais você é responsável.
          </p>
        </div>
        <h2>Recebidos</h2>
        <LoadingMessage pending={Boolean(busyId)}>
          Respondendo convite…
        </LoadingMessage>
        <p>
          Convites pendentes para o e-mail da sua conta. Aceite para acessar o
          projeto como organizador.
        </p>
        {(error || loadError) && (
          <p role="alert">{error || loadError.message}</p>
        )}
        {message && <SuccessMessage>{message}</SuccessMessage>}
        {pendingInvitations.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>Nenhum convite pendente</h2>
            <p>
              Quando alguém convidar o e-mail da sua conta para um projeto, o
              convite aparecerá aqui enquanto estiver válido.
            </p>
          </div>
        ) : (
          <ul className={styles.workList}>
            {pendingInvitations.map((invitation) => (
              <li key={invitation.id} className={styles.panel}>
                <h2>{invitation.work_title}</h2>
                <p>Papel: Organizador · Acesso de consulta ao projeto</p>
                <p>Válido até {formatInvitationDate(invitation.expires_at)}.</p>
                <div
                  className={styles.actions}
                  aria-busy={busyId === invitation.id}
                >
                  <button
                    type="button"
                    disabled={Boolean(busyId)}
                    onClick={() => respond(invitation, "accept")}
                  >
                    {busyId === invitation.id ? "Aguarde…" : "Aceitar convite"}
                  </button>
                  <button
                    type="button"
                    className={styles.dangerButton}
                    disabled={Boolean(busyId)}
                    onClick={() => respond(invitation, "decline")}
                  >
                    Recusar convite
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <section
          id="sent-invitations"
          className={styles.sentInvitations}
          aria-labelledby="sent-invitations-title"
        >
          <h2 id="sent-invitations-title">Enviados</h2>
          <p>
            Histórico dos convites dos seus projetos, incluindo os aceitos,
            recusados, cancelados e expirados.
          </p>
          {sentInvitations.length === 0 ? (
            <p>Nenhum convite enviado nos seus projetos.</p>
          ) : (
            <ul className={styles.workList}>
              {sentInvitations.map((invitation) => (
                <li key={invitation.id} className={styles.panel}>
                  <h3>
                    <Link href={`/works/${invitation.work_id}`}>
                      {invitation.work_title}
                    </Link>
                  </h3>
                  <p>
                    {invitation.email} · {statusLabels[invitation.status]}
                  </p>
                  <p>
                    Enviado em {formatInvitationDate(invitation.created_at)}.
                  </p>
                  {invitation.status === "pending" && (
                    <Link
                      href={`/works/${invitation.work_id}#participants-title`}
                    >
                      Gerenciar no projeto
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </AppLayout>
  );
}
