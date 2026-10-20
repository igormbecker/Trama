import { useEffect, useState } from "react";
import Link from "next/link";
import Head from "next/head";
import HomeLayout from "components/home/HomeLayout";
import SuccessMessage from "components/shared/SuccessMessage";
import useActionState from "components/shared/useActionState";
import styles from "./auth.module.css";

export default function EmailVerificationPage() {
  const [token, setToken] = useState(() =>
    typeof window === "undefined"
      ? ""
      : new URLSearchParams(window.location.hash.slice(1)).get("token") || "",
  );
  const [email, setEmail] = useState("");
  const [busy, setBusy, pendingRef] = useActionState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  useEffect(() => {
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  async function submit(event) {
    event.preventDefault();
    if (pendingRef.current) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/v1/email-verification", {
        method: token ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(token ? { token } : { email }),
      });
      if (!response.ok) {
        setError(
          token
            ? "Este link é inválido ou expirou. Solicite um novo e-mail."
            : "Não foi possível solicitar a confirmação. Confira o endereço e tente novamente.",
        );
        return;
      }
      if (token) {
        setConfirmed(true);
        setToken("");
        setMessage("E-mail confirmado! Você já pode entrar no Trama.");
      } else
        setMessage(
          "Se houver confirmação pendente para este endereço, enviaremos um e-mail. Confira também o spam. Aguarde um minuto antes de solicitar novamente.",
        );
    } catch {
      setError("Não foi possível conectar. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <HomeLayout
      title="Confirmar e-mail | Trama"
      description="Confirme seu endereço para acessar o Trama."
      navigation={<Link href="/login">Entrar</Link>}
    >
      <Head>
        <meta name="referrer" content="no-referrer" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <section
        className={styles.loginSection}
        aria-labelledby="verification-title"
      >
        <div className={styles.formPanel}>
          <h1 id="verification-title">Confirme seu e-mail</h1>
          <p className={styles.formDescription}>
            Novas contas precisam confirmar o endereço antes de entrar. O link
            de confirmação vale por 24 horas.
          </p>
          {message && <SuccessMessage>{message}</SuccessMessage>}
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          {!confirmed && (
            <form onSubmit={submit}>
              {!token && (
                <div className={styles.field}>
                  <label htmlFor="verification-email">E-mail</label>
                  <input
                    id="verification-email"
                    type="email"
                    required
                    maxLength={254}
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={busy}
                  />
                </div>
              )}
              <button
                className={styles.primaryButton}
                disabled={busy}
                aria-busy={busy}
              >
                {busy
                  ? "Aguarde…"
                  : token
                    ? "Confirmar meu e-mail"
                    : "Enviar confirmação"}
              </button>
            </form>
          )}
          {token && (
            <p className={styles.backLink}>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setToken("");
                  setError("");
                }}
              >
                Solicitar outro link
              </button>
            </p>
          )}
          <p className={styles.backLink}>
            <Link href="/login">Voltar para entrar</Link>
          </p>
        </div>
      </section>
    </HomeLayout>
  );
}
