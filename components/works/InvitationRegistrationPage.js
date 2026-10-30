import useActionState from "components/shared/useActionState";
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import HomeLayout from "components/home/HomeLayout";
import styles from "components/auth/auth.module.css";

export default function InvitationRegistrationPage({ invitation }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy, pendingRef] = useActionState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (pendingRef.current) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/v1/invitations/${encodeURIComponent(router.query.token)}/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            username,
            password,
            password_confirmation: confirmation,
          }),
        },
      );
      if (!response.ok) {
        throw new Error(
          "Não foi possível criar a conta. Confira os dados ou tente outro nome de usuário.",
        );
      }
      await router.replace("/login?registration=complete");
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <HomeLayout
      title="Criar conta por convite | Trama"
      description="Crie sua conta para responder ao convite de participação."
      navigation={<Link href="/login">Entrar</Link>}
    >
      <Head>
        <meta name="referrer" content="no-referrer" />
      </Head>
      <section
        className={styles.loginSection}
        aria-labelledby="registration-title"
      >
        <div className={styles.formPanel}>
          <h1 id="registration-title">Criar conta por convite</h1>
          <p className={styles.formDescription}>
            Você recebeu um convite para participar de {invitation.work_title}{" "}
            como organizador.
          </p>
          <p className={styles.formDescription}>
            A conta será criada com o e-mail {invitation.email}. Depois de
            confirmar seu e-mail, entrar e aceitar os documentos atuais,
            responda ao convite em Meus convites.
          </p>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <form onSubmit={submit}>
            <div className={styles.field}>
              <label htmlFor="invited-name">Nome</label>
              <input
                id="invited-name"
                required
                maxLength={255}
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={busy}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="invited-username">Nome de usuário</label>
              <input
                id="invited-username"
                required
                maxLength={30}
                pattern="[A-Za-z0-9_.-]+"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                disabled={busy}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="invited-password">Senha</label>
              <input
                id="invited-password"
                type="password"
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={busy}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="invited-confirmation">Confirme a senha</label>
              <input
                id="invited-confirmation"
                type="password"
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                disabled={busy}
              />
            </div>
            <button
              className={styles.primaryButton}
              type="submit"
              disabled={busy}
              aria-busy={busy}
            >
              {busy ? "Criando conta…" : "Criar conta"}
            </button>
          </form>
          <p className={styles.backLink}>
            <Link href="/login">Já tenho uma conta</Link>
          </p>
        </div>
      </section>
    </HomeLayout>
  );
}
