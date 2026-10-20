import Link from "next/link";
import AppLayout from "components/app/AppLayout";
import ChapterEditorialStatus from "./ChapterEditorialStatus";
import useParticipations from "./useParticipations";
import styles from "./works.module.css";

function ParticipationList({ items, emptyMessage }) {
  return items.length ? (
    <ul className={styles.participationList}>
      {items.map((item) => (
        <li key={item.id} className={styles.participationCard}>
          <p>
            <Link href={`/works/${item.work_id}`}>{item.work_title}</Link>
          </p>
          <h3>
            <Link
              href={`/works/${item.work_id}/chapters/${item.chapter_id}?requestId=${item.id}`}
            >
              {item.chapter_title}
            </Link>
          </h3>
          <ChapterEditorialStatus
            request={{ ...item, assignee_name: "Você" }}
          />
          <p>
            {item.status === "writing"
              ? "Aguardando sua ação."
              : item.status === "waiting"
                ? "Sua entrega aguarda a decisão do responsável."
                : item.status === "canceled"
                  ? "Pedido encerrado por cancelamento."
                  : item.kind === "review"
                    ? "Parecer enviado ao responsável."
                    : "Contribuição incorporada ao texto."}
          </p>
          <Link
            href={`/works/${item.work_id}/chapters/${item.chapter_id}?requestId=${item.id}`}
          >
            {item.status === "writing"
              ? "Abrir trabalho →"
              : "Consultar pedido →"}
          </Link>
        </li>
      ))}
    </ul>
  ) : (
    <p>{emptyMessage}</p>
  );
}
export default function ParticipationsPage({
  user,
  participations: initialParticipations = [],
}) {
  const { data: participations = initialParticipations, error } =
    useParticipations(user.id, initialParticipations);
  const ongoing = participations.filter((item) =>
    ["writing", "waiting"].includes(item.status),
  );
  const completed = participations.filter(
    (item) => !["writing", "waiting"].includes(item.status),
  );
  return (
    <AppLayout
      user={user}
      activePage="participations"
      title="Minhas participações | Trama"
      description="Acompanhe seus pedidos de contribuição e revisão."
      initialParticipations={initialParticipations}
    >
      <section
        className={styles.workspace}
        aria-labelledby="participations-title"
      >
        <h1 id="participations-title">Minhas participações</h1>
        {error && (
          <p role="alert">
            Não foi possível atualizar a lista. Exibindo a última consulta
            disponível.
          </p>
        )}
        <p>
          Contribuições e revisões atribuídas a você nos projetos de que
          participa.
        </p>
        <section aria-labelledby="ongoing-participations-title">
          <h2 id="ongoing-participations-title">
            Em andamento ({ongoing.length})
          </h2>
          <ParticipationList
            items={ongoing}
            emptyMessage="Você não tem pedidos em andamento."
          />
        </section>
        <section
          className={styles.completedParticipations}
          aria-labelledby="completed-participations-title"
        >
          <h2 id="completed-participations-title">
            Concluídas ({completed.length})
          </h2>
          <ParticipationList
            items={completed}
            emptyMessage="Nenhuma participação concluída."
          />
        </section>
      </section>
    </AppLayout>
  );
}
