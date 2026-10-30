import AddIcon from "components/icons/AddIcon";
import useActionState from "components/shared/useActionState";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import AppLayout from "components/app/AppLayout";
import styles from "./works.module.css";
import { getWorkCoverColor } from "./workCover";
import { getProjectLabels, filterProjects } from "./projectLabels";
import SuccessMessage from "components/shared/SuccessMessage";

export default function WorksPage({ user, works }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting, pendingRef] = useActionState(false);
  const [error, setError] = useState("");
  const [type, setType] = useState("literary");
  const [filter, setFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const projectTypeInput = useRef(null);
  const createTrigger = useRef(null);
  useEffect(() => {
    if (createOpen) {
      projectTypeInput.current?.focus();
    }
  }, [createOpen]);
  const labels = getProjectLabels(type);
  const visibleWorks = filterProjects(works, filter);

  async function handleSubmit(event) {
    event.preventDefault();
    if (pendingRef.current) {
      return;
    }
    const form = new FormData(event.currentTarget);
    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/v1/works", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.get("title"),
          description: form.get("description"),
          type,
        }),
      });
      if (response.status === 401) {
        await router.push("/login");
        return;
      }
      if (!response.ok) {
        setError(
          response.status === 400
            ? "Confira o tipo, o título e a descrição do projeto."
            : "Não foi possível criar o projeto. Tente novamente.",
        );
        return;
      }
      const createdWork = await response.json();
      await router.push(`/works/${createdWork.id}?created=1`);
    } catch {
      setError("Não foi possível conectar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppLayout
      title="Meus projetos | Trama"
      description="Suas obras literárias e trabalhos em grupo no Trama."
      user={user}
      activePage="works"
    >
      <section className={styles.workspace} aria-labelledby="works-title">
        <div className={styles.heading}>
          <p>Olá, {user.name}.</p>
          <div className={styles.projectsHeading}>
            <h1 id="works-title">Meus projetos</h1>
            <button
              type="button"
              ref={createTrigger}
              className={styles.createProjectToggle}
              aria-expanded={createOpen}
              aria-controls="create-project-panel"
              disabled={isSubmitting}
              onClick={() => {
                setCreateOpen(true);
                projectTypeInput.current?.focus();
              }}
            >
              <AddIcon className={styles.actionIcon} />
              Criar projeto
            </button>
          </div>
          <p>Um espaço para suas ideias começarem a ganhar forma.</p>
        </div>
        {router.query?.trashed === "1" && (
          <SuccessMessage>
            Projeto movido para a lixeira. Você pode restaurá-lo quando
            precisar.
          </SuccessMessage>
        )}
        <section
          id="create-project-panel"
          className={styles.panel}
          aria-labelledby="create-work-title"
          hidden={!createOpen}
        >
          <h2 id="create-work-title">Criar um projeto</h2>
          <p>O projeto é privado. Você decide quem pode participar.</p>
          <form onSubmit={handleSubmit} aria-busy={isSubmitting}>
            <label htmlFor="project-type">Tipo de projeto</label>
            <select
              ref={projectTypeInput}
              id="project-type"
              name="type"
              value={type}
              onChange={(event) => setType(event.target.value)}
              disabled={isSubmitting}
            >
              <option value="literary">Obra literária</option>
              <option value="group_assignment">Trabalho em grupo</option>
            </select>
            {type === "group_assignment" && (
              <p>
                O trabalho começa com Elementos textuais (Introdução,
                Desenvolvimento e Conclusão) e Elementos pós-textuais
                (Referências). Você pode editar, acrescentar, reordenar ou
                excluir partes e seções.
              </p>
            )}
            <label htmlFor="title">Título</label>
            <input
              id="title"
              name="title"
              required
              maxLength={255}
              disabled={isSubmitting}
            />
            <label htmlFor="description">Descrição (opcional)</label>
            <textarea
              id="description"
              name="description"
              maxLength={5000}
              rows={4}
              disabled={isSubmitting}
            />
            {error && <p role="alert">{error}</p>}
            <div className={styles.actions}>
              <button
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? "Criando…" : `Criar ${labels.name}`}
              </button>
              <button
                type="button"
                className={styles.cancelProjectButton}
                disabled={isSubmitting}
                onClick={() => {
                  setCreateOpen(false);
                  createTrigger.current?.focus();
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
        <div className={styles.projectFilter}>
          <label htmlFor="project-filter">Filtrar projetos</label>
          <select
            id="project-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">Todos</option>
            <option value="literary">Obras literárias</option>
            <option value="group_assignment">Trabalhos em grupo</option>
          </select>
          <p role="status">
            {visibleWorks.length}{" "}
            {visibleWorks.length === 1 ? "projeto" : "projetos"}
          </p>
        </div>
        {visibleWorks.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>Nenhum projeto por aqui ainda.</h2>
            <p>
              {works.length
                ? "Escolha outro filtro para ver seus projetos."
                : "Crie seu primeiro projeto ou aceite um convite para participar."}
            </p>
          </div>
        ) : (
          <ul className={styles.workList}>
            {visibleWorks.map((work) => (
              <li
                key={work.id}
                className={`${styles.panel} ${styles.workCard}`}
              >
                <div
                  className={styles.bookCover}
                  style={{ backgroundColor: getWorkCoverColor(work.id) }}
                  aria-hidden="true"
                >
                  <strong>{work.title.split(":")[0]}</strong>
                  <span>trama</span>
                </div>
                <div className={styles.workCardContent}>
                  <p>{getProjectLabels(work.type).type}</p>
                  <h2>
                    <Link href={`/works/${work.id}`}>{work.title}</Link>
                  </h2>
                  <p className={styles.preview}>
                    {work.description || "Sem descrição."}
                  </p>
                  <Link href={`/works/${work.id}`}>
                    Abrir {getProjectLabels(work.type).name} →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppLayout>
  );
}
