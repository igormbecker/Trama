import Head from "next/head";
import BackToTop from "components/shared/BackToTop";
import { useAuth } from "components/auth/AuthProvider";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTheme } from "components/theme/ThemeProvider";
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

function TramaThread() {
  return (
    <svg
      className={styles.footerMark}
      viewBox="0 0 76 44"
      fill="none"
      aria-hidden="true"
    >
      <ellipse
        cx="28"
        cy="19"
        rx="22"
        ry="12"
        transform="rotate(-25 28 19)"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <ellipse
        cx="46"
        cy="25"
        rx="22"
        ry="12"
        transform="rotate(-25 46 25)"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export default function HomeLayout({
  children,
  title = "Trama — Gestão editorial colaborativa",
  description = "Organize sua obra, escreva capítulos e reúna contribuições no Trama. Revise por comentários, confirme os créditos e exporte em PDF ou DOCX.",
  navigation,
  showThemeControl = true,
  hasFloatingNavigation = false,
}) {
  const { theme, setTheme } = useTheme();
  const { isAuthenticated } = useAuth();
  const brandPath = isAuthenticated ? "/home" : "/";
  const brandLabel = isAuthenticated
    ? "Trama — Seu espaço"
    : "Trama — página inicial";
  const router = useRouter();
  const statusReturnPath =
    router.pathname === "/status"
      ? "/"
      : router.pathname === "/reset-password"
        ? "/reset-password"
        : router.asPath || "/";

  return (
    <div id="page-top" className={styles.site} lang="pt-BR" data-theme={theme}>
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
      <header
        className={`${styles.header} ${hasFloatingNavigation ? styles.floatingNavigationHeader : ""}`}
      >
        <Link
          className={styles.productBrand}
          href={brandPath}
          aria-label={brandLabel}
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
        {showThemeControl && !isAuthenticated ? (
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
        ) : null}
      </header>
      <main id="conteudo">{children}</main>
      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <Link
            className={styles.productBrand}
            href={brandPath}
            aria-label={brandLabel}
          >
            <TramaMark />
            <span>trama</span>
          </Link>
          <div className={styles.footerMessage}>
            <p>
              Pessoas, ideias e capítulos.
              <br />
              Uma obra construída em conjunto.
            </p>
            <TramaThread />
          </div>
        </div>
        <div className={styles.footerBottom}>
          <div className={styles.signature}>
            <span>Desenvolvido por</span>
            <Brand />
          </div>
          <nav aria-label="Documentos e contato">
            <Link href="/terms">Termos de Uso</Link> ·{" "}
            <Link href="/privacy">Privacidade</Link> ·{" "}
            <Link href="/legal/support">Contato</Link>
          </nav>
          <Link
            className={styles.statusLink}
            href={{
              pathname: systemStatusLink,
              query: { returnTo: statusReturnPath },
            }}
          >
            Status do sistema <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </footer>
      <BackToTop />
    </div>
  );
}
