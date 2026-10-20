import SuccessMessage from "components/shared/SuccessMessage";
import Link from "next/link";
import { useRouter } from "next/router";
import AppLayout from "components/app/AppLayout";
import ParticipantsPanel from "./ParticipantsPanel";
import StructurePanel from "./StructurePanel";
import styles from "./works.module.css";
import useRecordAccess from "components/home/useRecordAccess";
import WorkDetails from "./WorkDetails";
import WorkCreditsPanel from "./WorkCreditsPanel";
import { getProjectLabels } from "./projectLabels";

export default function WorkPage({
  user,
  work,
  parts,
  participants,
  invitations,
  creditsData,
}) {
  const router = useRouter();
  const labels = getProjectLabels(work.type);
  useRecordAccess(user.id, work.id);
  return (
    <AppLayout
      backHref="/works"
      backLabel="Voltar aos projetos"
      title={`${work.title} | Trama`}
      description={`Detalhes de ${work.title} no Trama.`}
      user={user}
      activePage="works"
    >
      <section
        className={`${styles.workspace} ${styles.workPage}`}
        aria-labelledby="work-title"
      >
        <Link href="/works">← Meus projetos</Link>
        {work.owner_id === user.id && (
          <p>
            <Link href="/trash" prefetch={false}>
              Abrir lixeira
            </Link>
          </p>
        )}
        {router.query.created === "1" && (
          <SuccessMessage>
            {labels.title}{" "}
            {work.type === "group_assignment" ? "criado" : "criada"} com
            sucesso!
          </SuccessMessage>
        )}
        <div className={styles.heading}>
          <p>
            {work.owner_id === user.id
              ? `${labels.private} · Você é o responsável`
              : "Você participa como organizador"}
          </p>
          <h1 id="work-title">{work.title}</h1>
          <Link
            className={styles.readWorkButton}
            data-button
            href={`/works/${work.id}/read`}
          >
            <svg
              className={styles.actionIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 5C8 2 3 3 2 4v16c4-2 7-1 10 1 3-2 6-3 10-1V4c-4-2-7-1-10 1Zm0 0v16" />
            </svg>
            Ler {labels.name}
          </Link>
        </div>
        <WorkDetails work={work} canManage={work.owner_id === user.id} />
        {work.owner_id === user.id && (
          <WorkCreditsPanel
            workId={work.id}
            projectType={work.type}
            initialData={creditsData}
          />
        )}
        <StructurePanel
          projectType={work.type}
          workId={work.id}
          parts={parts}
          canManage={work.owner_id === user.id}
        />
        {work.owner_id === user.id && (
          <ParticipantsPanel
            projectType={work.type}
            workId={work.id}
            participants={participants}
            invitations={invitations}
          />
        )}
      </section>
    </AppLayout>
  );
}
