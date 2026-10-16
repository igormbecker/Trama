import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import styles from "./homeLayout.module.css";

export const systemStatusLink = "/status";

export function Brand() {
  return (
    <span className={styles.companyBrand}>
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

export function TramaMark() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M5 7h22M5 16h22M5 25h22M10 3v26M22 3v26"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path d="M10 7h12v9H10z" fill="currentColor" />
    </svg>
  );
}

export default function HomeLayout({
  children,
  title = "Trama — Gestão editorial colaborativa",
  description = "Conheça o Trama: uma proposta para conectar pessoas, capítulos e etapas da produção editorial, da organização da obra à aprovação.",
  navigation,
}) {
  const [theme, setTheme] = useState("light");

  return (
    <div className={styles.site} lang="pt-BR" data-theme={theme}>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
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
        <Link
          className={styles.productBrand}
          href="/"
          aria-label="Trama — página inicial"
        >
          <TramaMark />
          <span>trama</span>
        </Link>
        <nav aria-label="Navegação principal">
          {navigation ?? (
            <>
              <a href="#como-funciona">Como funciona</a>
              <a href="#para-quem">Para quem</a>
              <Link href="/login">Entrar</Link>
            </>
          )}
        </nav>
        <label className={styles.themeControl}>
          <span>Tema</span>
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
      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <Link
            className={styles.productBrand}
            href="/"
            aria-label="Trama — página inicial"
          >
            <TramaMark />
            <span>trama</span>
          </Link>
          <p>
            Pessoas, ideias e capítulos.
            <br />
            Uma obra construída em conjunto.
          </p>
        </div>
        <div className={styles.footerBottom}>
          <div className={styles.signature}>
            <span>Desenvolvido por</span>
            <Brand />
          </div>
          <Link className={styles.statusLink} href={systemStatusLink}>
            Status do sistema <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
