import LegalAcceptanceGuard from "components/legal/LegalAcceptanceGuard";
import ImpersonationBanner from "components/auth/ImpersonationBanner";
import Head from "next/head";
import { AuthProvider } from "components/auth/AuthProvider";
import NextApp from "next/app";
import { ThemeProvider } from "components/theme/ThemeProvider";
import { readThemeCookie } from "components/theme/theme";
import localFont from "next/font/local";

const inter = localFont({
  src: "../public/fonts/inter/InterVariable.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
});

export default function App({
  Component,
  pageProps,
  initialTheme,
  hasSessionCookie,
}) {
  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico?v=trama" sizes="any" />
        <link rel="icon" type="image/png" href="/favicon.png?v=trama" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </Head>
      <style jsx global>{`
        body {
          font-family: ${inter.style.fontFamily};
        }
        button,
        input,
        select,
        textarea {
          font-family: inherit;
        }
      `}</style>
      <ThemeProvider initialTheme={initialTheme}>
        <AuthProvider
          initialUser={pageProps.user}
          hasSessionCookie={hasSessionCookie}
        >
          <LegalAcceptanceGuard />
          <ImpersonationBanner />
          <Component {...pageProps} />
        </AuthProvider>
      </ThemeProvider>
    </>
  );
}

App.getInitialProps = async (appContext) => {
  const appProps = await NextApp.getInitialProps(appContext);
  const { req, res } = appContext.ctx;
  const cookie = req ? req.headers.cookie : document.cookie;
  res?.setHeader("Cache-Control", "private, no-store");
  // This flag controls presentation only; protected routes still validate the session.
  const hasSessionCookie =
    req && !["/login", "/register"].includes(appContext.ctx.pathname)
      ? /(?:^|;\s*)trama_session_id=[a-f0-9]{96}(?:;|$)/.test(cookie || "")
      : undefined;
  return {
    ...appProps,
    initialTheme: readThemeCookie(cookie),
    ...(req ? { hasSessionCookie } : {}),
  };
};
