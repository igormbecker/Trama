import SuccessMessage from "components/shared/SuccessMessage";
import Link from "next/link";
import { useRouter } from "next/router";
import AppLayout from "components/app/AppLayout";
import ParticipantsPanel from "./ParticipantsPanel";
import StructurePanel from "./StructurePanel";
import styles from "./works.module.css";
import useRecordAccess from "components/home/useRecordAccess";
import WorkDetails from "./WorkDetails";

export default function WorkPage({
  user,
  work,
  parts,
  participants,
  invitations,
}) {
  const router = useRouter();
  useRecordAccess(user.id, work.id);
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
          <SuccessMessage>Obra criada com sucesso!</SuccessMessage>
        )}
        <div className={styles.heading}>
          <p>
            {work.owner_id === user.id
              ? "Obra privada · Você é o responsável"
              : "Você participa como organizador"}
          </p>
          <h1 id="work-title">{work.title}</h1>
        </div>
        <WorkDetails work={work} canManage={work.owner_id === user.id} />
        <StructurePanel
          workId={work.id}
          parts={parts}
          canManage={work.owner_id === user.id}
        />
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
