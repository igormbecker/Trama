import useActionState from "components/shared/useActionState";
import LoadingMessage from "components/shared/LoadingMessage";
import SuccessMessage from "components/shared/SuccessMessage";
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import HomeLayout from "components/home/HomeLayout";
import AppLayout from "components/app/AppLayout";
import { respondToInvitation } from "./participantsClient";
import styles from "./works.module.css";
import useInvitations from "./useInvitations";
import { formatInvitationDate } from "./invitationDate";

export default function InvitationPage({ user, invitation }) {
  const router = useRouter();
  const { mutate: refreshInvitations } = useInvitations(user?.id);
  const [isBusy, setIsBusy, pendingRef] = useActionState(false);
  const [error, setError] = useState("");
  const [declined, setDeclined] = useState(false);
  async function respond(action) {
    if (pendingRef.current) return;
    setIsBusy(true);
    setError("");
    try {
      await respondToInvitation(router.query.token, action);
      await refreshInvitations();
      if (action === "accept")
        await router.replace(`/works/${invitation.work_id}`);
      else setDeclined(true);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsBusy(false);
    }
  }
  const content = (
    <section className={styles.workspace} aria-labelledby="invitation-title">
      <Head>
        <meta name="referrer" content="no-referrer" />
      </Head>
      <div className={styles.panel}>
        <h1 id="invitation-title">Convite para participar</h1>
        {!user ? (
          <>
            <h2>Entre para responder ao convite</h2>
            <p>
              Use uma conta com o e-mail que recebeu o convite. Se ainda não tem
              conta, crie uma pelo convite e confirme seu e-mail. Depois de
              entrar, aceite os documentos atuais e responda em Meus convites.
            </p>
            <div className={styles.actions}>
              <Link href="/login">Entrar</Link>
              <Link href={`/invitations/${router.query.token}/register`}>
                Criar conta pelo convite
              </Link>
            </div>
          </>
        ) : !invitation ? (
          <>
            <p role="status">
              Este convite não está disponível para sua conta. Confira se entrou
              com o e-mail convidado. O link também pode ter expirado ou já ter
              sido utilizado ou cancelado.
            </p>
            <Link href="/works">Meus projetos</Link>
          </>
        ) : declined ? (
          <>
            <SuccessMessage>
              Convite recusado. Você não recebeu acesso ao projeto.
            </SuccessMessage>
            <Link href="/works">Meus projetos</Link>
          </>
        ) : (
          <>
            <h2>{invitation.work_title}</h2>
            <p>
              Você foi convidado para consultar este projeto como organizador. O
              responsável continua gerenciando participantes e convites.
            </p>
            <p>Válido até {formatInvitationDate(invitation.expires_at)}.</p>
            {error && <p role="alert">{error}</p>}
            <LoadingMessage pending={isBusy}>
              Respondendo convite…
            </LoadingMessage>
            <div className={styles.actions} aria-busy={isBusy}>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => respond("accept")}
              >
                {isBusy ? "Aguarde…" : "Aceitar convite"}
              </button>
              <button
                type="button"
                disabled={isBusy}
                className={styles.dangerButton}
                onClick={() => respond("decline")}
              >
                Recusar convite
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
  return user ? (
    <AppLayout
      title="Convite | Trama"
      description="Responda ao convite de participação."
      user={user}
      activePage="works"
    >
      {content}
    </AppLayout>
  ) : (
    <HomeLayout
      title="Convite | Trama"
      description="Entre para responder ao convite."
      navigation={<Link href="/login">Entrar</Link>}
    >
      {content}
    </HomeLayout>
  );
}
