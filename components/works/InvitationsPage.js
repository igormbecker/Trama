import { useState } from "react";
import { useRouter } from "next/router";
import AppLayout from "components/app/AppLayout";
import useInvitations from "./useInvitations";
import { respondToMyInvitation } from "./participantsClient";
import styles from "./works.module.css";

export default function InvitationsPage({ user, invitations }) {
  const router = useRouter();
  const {
    data: pendingInvitations = [],
    error: loadError,
    mutate,
  } = useInvitations(user.id, invitations);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function respond(invitation, action) {
    if (busyId) return;
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
      else setMessage("Convite recusado. Você não recebeu acesso à obra.");
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
      description="Responda aos seus convites para participar de obras."
      initialInvitations={invitations}
    >
      <section className={styles.workspace} aria-labelledby="invitations-title">
        <div className={styles.heading}>
          <h1 id="invitations-title">Meus convites</h1>
          <p>
            Convites pendentes para o e-mail da sua conta. Aceite para acessar a
            obra como organizador.
          </p>
        </div>
        {(error || loadError) && (
          <p role="alert">{error || loadError.message}</p>
        )}
        {message && <p role="status">{message}</p>}
        {pendingInvitations.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>Nenhum convite pendente</h2>
            <p>
              Quando alguém convidar o e-mail da sua conta para uma obra, o
              convite aparecerá aqui enquanto estiver válido.
            </p>
          </div>
        ) : (
          <ul className={styles.workList}>
            {pendingInvitations.map((invitation) => (
              <li key={invitation.id} className={styles.panel}>
                <h2>{invitation.work_title}</h2>
                <p>Papel: Organizador · Acesso de consulta à obra</p>
                <p>
                  Válido até{" "}
                  {new Date(invitation.expires_at).toLocaleDateString("pt-BR", {
                    timeZone: "UTC",
                  })}{" "}
                  (UTC).
                </p>
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
      </section>
    </AppLayout>
  );
}
