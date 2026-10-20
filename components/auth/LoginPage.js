import useActionState from "components/shared/useActionState";
import SuccessMessage from "components/shared/SuccessMessage";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import HomeLayout, { TramaMark } from "components/home/HomeLayout";
import { signIn } from "./authClient";
import styles from "./auth.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser, clearUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting, pendingRef] = useActionState(false);
  const [error, setError] = useState("");

  // The server only renders this form when the visitor has no valid session.
  useEffect(() => {
    clearUser();
  }, [clearUser]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (pendingRef.current) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await signIn(email, password);
      refreshUser().catch(() => {});
      setPassword("");
      await router.replace("/home");
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <HomeLayout
      title="Entrar | Trama"
      description="Entre no Trama e continue construindo suas obras em conjunto."
      navigation={<Link href="/">Página inicial</Link>}
    >
      <section className={styles.loginSection} aria-labelledby="login-title">
        <div className={styles.introduction}>
          <p className={styles.eyebrow}>Seu espaço de criação</p>
          <h1>
            O próximo capítulo
            <br />
            começa com você.
          </h1>
          <p>
            Ideias se encontram, pessoas colaboram e uma obra ganha forma. Entre
            para continuar essa história.
          </p>
          <div className={styles.bookIllustration} aria-hidden="true">
            <div className={styles.bookCover}>
              <TramaMark />
              <span>
                Cada voz.
                <br />
                Uma nova
                <br />
                perspectiva.
              </span>
              <small>trama</small>
            </div>
            <div className={styles.bookPage}>
              <span>
                Uma obra é feita
                <br />
                de encontros.
              </span>
              <i></i>
              <i></i>
              <i></i>
              <i></i>
              <small>Vamos escrever o que vem a seguir.</small>
            </div>
          </div>
        </div>

        <div className={styles.formPanel}>
          <p className={styles.eyebrow}>Bem-vindo ao Trama</p>
          <h2 id="login-title">Entrar na sua conta</h2>
          <p className={styles.formDescription}>
            Use seu e-mail e senha para continuar.
          </p>
          {router.query.registration === "complete" ? (
            <SuccessMessage>
              Conta criada! Entre com seu e-mail e senha.
            </SuccessMessage>
          ) : null}
          {router.query.recovery === "complete" ? (
            <SuccessMessage>
              Senha alterada! Entre com sua nova senha.
            </SuccessMessage>
          ) : null}
          <form
            method="post"
            onSubmit={handleSubmit}
            aria-describedby={error ? "login-error" : undefined}
          >
            <div className={styles.field}>
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="password">Senha</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
            {error ? (
              <p className={styles.error} id="login-error" role="alert">
                {error}
              </p>
            ) : null}
            <button
              className={styles.primaryButton}
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? "Entrando..." : "Entrar"}
            </button>
          </form>
          <p className={styles.backLink}>
            <Link href="/forgot-password">Esqueci minha senha</Link>
          </p>
          <p className={styles.formDescription}>
            O acesso é restrito. Solicite sua conta ao administrador do Trama.
          </p>
        </div>
      </section>
    </HomeLayout>
  );
}
