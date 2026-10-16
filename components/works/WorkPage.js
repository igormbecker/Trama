import Link from "next/link";
import { useRouter } from "next/router";
import AppLayout from "components/app/AppLayout";
import ParticipantsPanel from "./ParticipantsPanel";
import styles from "./works.module.css";

export default function WorkPage({ user, work, participants, invitations }) {
  const router = useRouter();
  return (
    <AppLayout
      title={`${work.title} | Trama`}
      description="Detalhes da sua obra no Trama."
      user={user}
      activePage="works"
    >
      <section className={styles.workspace} aria-labelledby="work-title">
        <Link href="/works">← Minhas obras</Link>
        {router.query.created === "1" && (
          <p role="status">Obra criada com sucesso!</p>
        )}
        <div className={styles.heading}>
          <p>
            {work.owner_id === user.id
              ? "Obra privada · Você é o responsável"
              : "Você participa como organizador"}
          </p>
          <h1 id="work-title">{work.title}</h1>
        </div>
        <div className={styles.panel}>
          <h2>Descrição</h2>
          <p className={styles.description}>
            {work.description || "Esta obra ainda não tem descrição."}
          </p>
        </div>
        {work.owner_id === user.id && (
          <ParticipantsPanel
            workId={work.id}
            participants={participants}
            invitations={invitations}
          />
        )}
      </section>
    </AppLayout>
  );
}
