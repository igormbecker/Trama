import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import AppLayout from "components/app/AppLayout";
import styles from "./works.module.css";
import { getWorkCoverColor } from "./workCover";

export default function WorksPage({ user, works }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;
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
        }),
      });
      if (response.status === 401) {
        await router.push("/login");
        return;
      }
      if (!response.ok) {
        setError(
          response.status === 400
            ? "Confira o título e a descrição da obra."
            : "Não foi possível criar a obra. Tente novamente.",
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
      title="Minhas obras | Trama"
      description="Seu espaço para acompanhar obras no Trama."
      user={user}
      activePage="works"
    >
      <section className={styles.workspace} aria-labelledby="works-title">
        <div className={styles.heading}>
          <p>Olá, {user.name}.</p>
          <h1 id="works-title">Minhas obras</h1>
          <p>Um espaço para suas ideias começarem a ganhar forma.</p>
        </div>
        <section className={styles.panel} aria-labelledby="create-work-title">
          <h2 id="create-work-title">Criar uma obra</h2>
          <p>A obra é privada. Você decide quem pode participar.</p>
          <form onSubmit={handleSubmit} aria-busy={isSubmitting}>
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
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Criando…" : "Criar obra"}
            </button>
          </form>
        </section>
        {works.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>Nenhuma obra por aqui ainda.</h2>
            <p>Crie sua primeira obra ou aceite um convite para participar.</p>
          </div>
        ) : (
          <ul className={styles.workList}>
            {works.map((work) => (
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
                  <h2>
                    <Link href={`/works/${work.id}`}>{work.title}</Link>
                  </h2>
                  <p className={styles.preview}>
                    {work.description || "Sem descrição."}
                  </p>
                  <Link href={`/works/${work.id}`}>Abrir obra →</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppLayout>
  );
}
