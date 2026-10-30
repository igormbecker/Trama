import TramaMarkIcon from "components/icons/TramaMarkIcon";
import TramaThreadIcon from "components/icons/TramaThreadIcon";
import Head from "next/head";
import { useEffect, useRef } from "react";
import observeVisualViewport from "components/app/observeVisualViewport";
import BackToTop from "components/shared/BackToTop";
import { useAuth } from "components/auth/AuthProvider";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTheme } from "components/theme/ThemeProvider";
import styles from "./homeLayout.module.css";

export { TramaMarkIcon as TramaMark };

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

export default function HomeLayout({
  children,
  title = "Trama — Gestão editorial colaborativa",
  description = "Organize sua obra, escreva capítulos e reúna contribuições no Trama. Revise por comentários, confirme os créditos e exporte em PDF ou DOCX.",
  navigation,
  showThemeControl = true,
  hasFloatingNavigation = false,
}) {
  const siteRef = useRef(null);
  useEffect(() => {
    if (!hasFloatingNavigation || !siteRef.current) {
      return;
    }
    return observeVisualViewport(siteRef.current);
  }, [hasFloatingNavigation]);
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
    <div
      ref={siteRef}
      id="page-top"
      className={styles.site}
      lang="pt-BR"
      data-theme={theme}
    >
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
          <TramaMarkIcon />
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
            <TramaMarkIcon />
            <span>trama</span>
          </Link>
          <div className={styles.footerMessage}>
            <p>
              Pessoas, ideias e capítulos.
              <br />
              Uma obra construída em conjunto.
            </p>
            <TramaThreadIcon className={styles.footerMark} />
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
