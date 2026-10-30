import { useEffect, useState } from "react";
import QuickWriteButton from "./QuickWriteButton";
import Link from "next/link";
import AppLayout from "components/app/AppLayout";
import useInvitations from "components/works/useInvitations";
import useParticipations, {
  needsParticipationAction,
} from "components/works/useParticipations";
import { getWorkCoverColor } from "components/works/workCover";
import { readActivity, recentWorks } from "./recentActivity";
import styles from "./workspace.module.css";
import { getProjectLabels } from "components/works/projectLabels";

export default function WorkspacePage({
  user,
  works,
  participations: initialParticipations = [],
}) {
  const [recent, setRecent] = useState([]);
  const [chapter, setChapter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const { data: invitations } = useInvitations(user.id);
  const {
    data: participations = initialParticipations,
    error: participationError,
  } = useParticipations(user.id, initialParticipations);
  const pendingRequests = participations.filter(needsParticipationAction);

  useEffect(() => {
    let active = true;
    async function load() {
      let activity;
      try {
        activity = readActivity(window.localStorage, user.id);
        if (!active) {
          return;
        }
        setRecent(recentWorks(activity, works));
        setChapter(null);
        setHistoryError("");
        const last = activity.chapter;
        const work = works.find((work) => work.id === last?.workId);
        if (!last || !work) {
          return;
        }
        const response = await fetch(
          `/api/v1/works/${encodeURIComponent(work.id)}/chapters/${encodeURIComponent(last.chapterId)}`,
          { credentials: "same-origin", cache: "no-store" },
        );
        if (!active) {
          return;
        }
        if (!response.ok) {
          if (![401, 404].includes(response.status)) {
            setHistoryError(
              "Não foi possível carregar o último texto. Você pode abrir o projeto pela lista abaixo.",
            );
          }
          return;
        }
        const content = await response.json();
        if (active) {
          setChapter({ work, ...content.chapter });
        }
      } catch {
        if (active) {
          setHistoryError(
            "O histórico está indisponível neste momento. Você pode continuar por Meus projetos.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [user.id, works]);

  return (
    <AppLayout
      user={user}
      activePage="home"
      title="Seu espaço | Trama"
      description="Retome seus textos e seus projetos recentes."
      initialParticipations={initialParticipations}
    >
      <section className={styles.workspace} aria-labelledby="workspace-title">
        <header className={styles.heading}>
          <div>
            <p>Olá, {user.name}.</p>
            <h1 id="workspace-title">Seu espaço</h1>
            <p>Continue suas ideias de onde você parou.</p>
          </div>
          <QuickWriteButton userId={user.id} />
        </header>
        {invitations?.length > 0 && (
          <aside className={styles.invitation}>
            <Link href="/invitations">
              Você tem {invitations.length}{" "}
              {invitations.length === 1
                ? "convite para responder"
                : "convites para responder"}{" "}
              →
            </Link>
          </aside>
        )}
        {(pendingRequests.length > 0 || participationError) && (
          <section
            className={styles.resume}
            aria-labelledby="pending-requests-title"
          >
            <h2 id="pending-requests-title">
              Pedidos aguardando sua ação ({pendingRequests.length})
            </h2>
            {participationError && (
              <p role="status">
                Não foi possível atualizar seus pedidos.{" "}
                <Link href="/participations">
                  Consultar Minhas participações
                </Link>
              </p>
            )}
            <ul className={styles.pendingRequests}>
              {pendingRequests.slice(0, 5).map((item) => (
                <li key={item.id}>
                  <span>
                    {item.kind === "review" ? "Revisão" : "Contribuição"} ·{" "}
                    {item.work_title}
                  </span>
                  <Link
                    href={`/works/${item.work_id}/chapters/${item.chapter_id}?requestId=${item.id}`}
                  >
                    {item.chapter_title}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/participations">Ver todas as participações</Link>
          </section>
        )}
        <section
          className={styles.resume}
          aria-labelledby="resume-title"
          aria-busy={loading}
        >
          <h2 id="resume-title">Continue de onde parou</h2>
          {loading ? (
            <p role="status">Carregando seus últimos acessos…</p>
          ) : chapter ? (
            <>
              <p className={styles.workTitle}>{chapter.work.title}</p>
              <h3>
                {chapter.part_position}.{chapter.position}. {chapter.title}
              </h3>
              <p>{chapter.part_title}</p>
              <div className={styles.actions}>
                <Link
                  className={styles.secondary}
                  data-button
                  href={`/works/${chapter.work.id}/chapters/${chapter.id}${chapter.work.owner_id === user.id ? "?write=1" : ""}`}
                >
                  {chapter.work.owner_id === user.id
                    ? "Continuar escrevendo"
                    : "Continuar lendo"}
                </Link>
                <Link href={`/works/${chapter.work.id}`}>
                  Abrir {getProjectLabels(chapter.work.type).name}
                </Link>
              </div>
            </>
          ) : (
            <>
              <p>
                {works.length
                  ? "Abra um texto para encontrá-lo aqui na próxima visita."
                  : "Crie seu primeiro projeto ou aceite um convite para começar."}
              </p>
              <Link
                className={styles.primary}
                data-button
                href={works.length ? "/works" : "/works#create-work-title"}
              >
                {works.length
                  ? "Explorar meus projetos"
                  : "Criar meu primeiro projeto"}
              </Link>
              {!works.length && (
                <p>
                  <Link href="/invitations">Consultar meus convites</Link>
                </p>
              )}
            </>
          )}
          {historyError && <p role="status">{historyError}</p>}
        </section>
        <section aria-labelledby="recent-title">
          <div className={styles.sectionHeading}>
            <h2 id="recent-title">Projetos recentes</h2>
            <Link href="/works">Ver todos os projetos</Link>
          </div>
          {!loading && !recent.length && (
            <p>Os projetos que você acessar aparecerão aqui.</p>
          )}
          <ul className={styles.recentList}>
            {recent.map((work) => (
              <li key={work.id}>
                <div
                  className={styles.cover}
                  style={{ backgroundColor: getWorkCoverColor(work.id) }}
                  aria-hidden="true"
                >
                  <span>{work.title.split(":")[0]}</span>
                </div>
                <div>
                  <h3>
                    <Link href={`/works/${work.id}`}>{work.title}</Link>
                  </h3>
                  <p>
                    {getProjectLabels(work.type).type} ·{" "}
                    {work.owner_id === user.id
                      ? "Você é o responsável"
                      : "Você participa como organizador"}
                  </p>
                </div>
                <Link
                  className={styles.openWork}
                  href={`/works/${work.id}`}
                  aria-label={`Abrir ${getProjectLabels(work.type).name} ${work.title}`}
                >
                  Abrir {getProjectLabels(work.type).name} →
                </Link>
              </li>
            ))}
          </ul>
          <p className={styles.note}>
            Seus acessos recentes são lembrados para esta conta neste navegador.
          </p>
        </section>
      </section>
    </AppLayout>
  );
}
