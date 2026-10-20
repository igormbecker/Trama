import useActionState from "components/shared/useActionState";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "./AuthProvider";
import RecoveryLayout from "./RecoveryLayout";
import { resetPassword } from "./passwordRecoveryClient";
import styles from "./auth.module.css";

function getTokenFromHash() {
  if (typeof window === "undefined") return "";
  const value =
    new URLSearchParams(window.location.hash.slice(1)).get("token") || "";
  return /^[a-f0-9]{96}$/.test(value) ? value : "";
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const { clearUser } = useAuth();
  const [token] = useState(getTokenFromHash);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting, pendingRef] = useActionState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (pendingRef.current || !token) return;
    setError("");
    if (password !== confirmation) {
      setError("As senhas precisam ser iguais.");
      return;
    }
    setIsSubmitting(true);
    try {
      await resetPassword(token, password, confirmation);
      setPassword("");
      setConfirmation("");
      clearUser();
      await router.replace("/login?recovery=complete");
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <RecoveryLayout title="Defina uma nova senha">
      {token ? (
        <>
          <p className={styles.formDescription}>
            Use de 8 a 128 caracteres. Após a troca, você precisará entrar
            novamente em todos os dispositivos.
          </p>
          <form
            method="post"
            onSubmit={handleSubmit}
            aria-describedby={error ? "reset-error" : undefined}
          >
            <div className={styles.field}>
              <label htmlFor="new-password">Nova senha</label>
              <input
                id="new-password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="password-confirmation">
                Confirme a nova senha
              </label>
              <input
                id="password-confirmation"
                name="password_confirmation"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
            {error ? (
              <p className={styles.error} id="reset-error" role="alert">
                {error}
              </p>
            ) : null}
            <button
              className={styles.primaryButton}
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? "Salvando..." : "Salvar nova senha"}
            </button>
          </form>
        </>
      ) : (
        <p className={styles.error} role="alert">
          Este link é inválido ou não está completo. Peça um novo link de
          recuperação.
        </p>
      )}
      <p>
        <Link className={styles.backLink} href="/forgot-password">
          Pedir outro link
        </Link>
      </p>
    </RecoveryLayout>
  );
}
