import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import HomeLayout from "components/home/HomeLayout";
import { signUp } from "./authClient";
import styles from "./auth.module.css";

export default function RegistrationPage() {
  const router = useRouter();
  const [formValues, setFormValues] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }
    setError("");
    setIsSubmitting(true);

    try {
      await signUp(formValues);
      setFormValues((current) => ({ ...current, password: "" }));
      await router.replace("/login?registration=complete");
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <HomeLayout
      title="Criar conta | Trama"
      description="Crie sua conta no Trama e faça parte da próxima história."
      navigation={<Link href="/login">Entrar</Link>}
    >
      <section
        className={styles.loginSection}
        aria-labelledby="registration-title"
      >
        <div className={styles.introduction}>
          <p className={styles.eyebrow}>Histórias começam com encontros</p>
          <h1>
            Sua próxima história
            <br />
            ganha espaço aqui.
          </h1>
          <p>
            Um lugar para organizar ideias e construir obras em conjunto. Crie
            sua conta para começar.
          </p>
        </div>
        <div className={styles.formPanel}>
          <p className={styles.eyebrow}>Faça parte do Trama</p>
          <h2 id="registration-title">Criar sua conta</h2>
          <p className={styles.formDescription}>
            Preencha seus dados para dar o primeiro passo.
          </p>
          <form
            method="post"
            onSubmit={handleSubmit}
            aria-describedby={error ? "registration-error" : undefined}
          >
            <div className={styles.field}>
              <label htmlFor="name">Nome completo</label>
              <input
                id="name"
                name="name"
                autoComplete="name"
                required
                maxLength={255}
                value={formValues.name}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="username">Nome de usuário</label>
              <input
                id="username"
                name="username"
                autoComplete="username"
                required
                maxLength={30}
                pattern="[a-zA-Z0-9_.\-]{1,30}"
                aria-describedby="username-hint"
                value={formValues.username}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              <small className={styles.hint} id="username-hint">
                Use letras sem acento, números, ponto, hífen ou sublinhado.
              </small>
            </div>
            <div className={styles.field}>
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={formValues.email}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="password">Senha</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                aria-describedby="password-hint"
                value={formValues.password}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              <small className={styles.hint} id="password-hint">
                Use pelo menos 8 caracteres.
              </small>
            </div>
            {error ? (
              <p className={styles.error} id="registration-error" role="alert">
                {error}
              </p>
            ) : null}
            <button
              className={styles.primaryButton}
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? "Criando conta..." : "Criar conta"}
            </button>
          </form>
          <Link className={styles.backLink} href="/login">
            Já tem conta? Entrar
          </Link>
        </div>
      </section>
    </HomeLayout>
  );
}
