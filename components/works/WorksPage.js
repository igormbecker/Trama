import Link from "next/link";
import HomeLayout from "components/home/HomeLayout";
import LogoutButton from "components/auth/LogoutButton";
import styles from "./works.module.css";

export default function WorksPage({ user }) {
  return (
    <HomeLayout
      title="Minhas obras | Trama"
      description="Seu espaço para acompanhar obras e contribuições no Trama."
      navigation={
        <>
          <Link href="/obras" aria-current="page">
            Minhas obras
          </Link>
          <LogoutButton />
        </>
      }
    >
      <section className={styles.workspace} aria-labelledby="works-title">
        <div className={styles.heading}>
          <p>Olá, {user.name}.</p>
          <h1 id="works-title">Minhas obras</h1>
          <p>Um lugar para acompanhar suas obras e contribuições.</p>
        </div>
        <div className={styles.emptyState}>
          <svg viewBox="0 0 80 64" fill="none" aria-hidden="true">
            <path
              d="M40 15C29 7 14 8 5 12v42c11-4 24-4 35 3 11-7 24-7 35-3V12C64 8 51 7 40 15Zm0 0v42M16 23c5-1 10 0 15 2m-15 9c5-1 10 0 15 2m18-11c5-2 10-3 15-2m-15 13c5-2 10-3 15-2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h2>Nenhuma obra por aqui ainda.</h2>
          <p>
            Estamos preparando este espaço para reunir suas obras e
            participações editoriais. Toda história começa com uma primeira
            ideia.
          </p>
          <Link href="/#como-funciona">Conhecer o fluxo editorial</Link>
        </div>
      </section>
    </HomeLayout>
  );
}
