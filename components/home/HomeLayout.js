import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import styles from "./homeLayout.module.css";

export const contactEmail = "imbjr.work@gmail.com";
export const contactLink = `mailto:${contactEmail}?subject=Vamos%20conversar%20sobre%20um%20projeto`;
export const systemStatusLink = "/status";

export function ContactButton({ children = "Conversar sobre meu projeto" }) {
  return (
    <a className={styles.button} href={contactLink}>
      {children}
      <span aria-hidden="true">↗</span>
    </a>
  );
}

export function Brand() {
  return (
    <span className={styles.brand}>
      <strong>
        <span aria-hidden="true">&gt;_</span>bectec
        <span aria-hidden="true">.</span>
      </strong>
      <small>
        Tecnologia e Desenvolvimento
        <br />
        de Software
      </small>
    </span>
  );
}

// Estrutura compartilhada da página: navegação, conteúdo e contato.
export default function HomeLayout({ title, children }) {
  const [theme, setTheme] = useState("light");
  return (
    <div
      className={`${styles.site} ${styles.experience}`}
      lang="pt-BR"
      data-theme={theme}
    >
      <Head>
        <title>{title} | Bectec</title>
        <meta
          name="description"
          content="Desenvolvimento de software, integrações e automação de processos com Igor Becker."
        />
      </Head>
      <style jsx global>{`
        body {
          margin: 0;
        }
      `}</style>
      <a className={styles.skipLink} href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className={styles.header}>
        <Link href="/" aria-label="Bectec — página inicial">
          <Brand />
        </Link>
        <nav aria-label="Navegação principal">
          <a href="#servicos">Serviços</a>
          <a href="#experiencia">Experiência</a>
          <a href="#contato">
            Vamos conversar <span aria-hidden="true">↗</span>
          </a>
        </nav>
        <label className={styles.themeControl}>
          Tema
          <select
            value={theme}
            onChange={(event) => setTheme(event.target.value)}
          >
            <option value="light">Claro</option>
            <option value="dark">Escuro</option>
          </select>
        </label>
      </header>
      <main id="conteudo">{children}</main>
      <footer className={styles.footer} id="contato">
        <div>
          <span className={styles.sectionLabel}>Vamos trabalhar juntos?</span>
          <h2>
            Conte o que você
            <br />
            precisa resolver.
          </h2>
        </div>
        <div>
          <a className={styles.email} href={contactLink}>
            {contactEmail}
          </a>
          <p>Porto Alegre, RS · Atendimento remoto</p>
        </div>
        <div className={styles.footerBottom}>
          <Brand />
          <Link href={systemStatusLink}>Status do sistema</Link>
        </div>
      </footer>
    </div>
  );
}
