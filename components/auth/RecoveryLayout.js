import Head from "next/head";
import Link from "next/link";
import HomeLayout from "components/home/HomeLayout";
import styles from "./auth.module.css";

export default function RecoveryLayout({ title, children }) {
  return (
    <HomeLayout
      title={`${title} | Trama`}
      description="Recupere seu acesso ao Trama."
      navigation={<Link href="/login">Entrar</Link>}
    >
      <Head>
        <meta name="referrer" content="no-referrer" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <section className={styles.loginSection} aria-labelledby="recovery-title">
        <div className={styles.introduction}>
          <p className={styles.eyebrow}>Seu espaço de criação</p>
          <h1>Vamos continuar sua história.</h1>
          <p>
            Recupere o acesso à sua conta e volte às suas pessoas, ideias e
            capítulos.
          </p>
        </div>
        <div className={styles.formPanel}>
          <h2 id="recovery-title">{title}</h2>
          {children}
          <Link className={styles.backLink} href="/login">
            Voltar para entrar
          </Link>
        </div>
      </section>
    </HomeLayout>
  );
}
