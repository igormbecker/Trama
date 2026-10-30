import ButtonActionIcon from "components/icons/ButtonActionIcon";
import useActionState from "components/shared/useActionState";
import { useState } from "react";
import SuccessMessage from "components/shared/SuccessMessage";
import RecoveryLayout from "./RecoveryLayout";
import { requestPasswordRecovery } from "./passwordRecoveryClient";
import styles from "./auth.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting, pendingRef] = useActionState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (pendingRef.current) {
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await requestPasswordRecovery(email);
      setSent(true);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <RecoveryLayout title="Esqueci minha senha">
      {sent ? (
        <>
          <SuccessMessage>
            Se houver uma conta com esse e-mail, você receberá um link para
            redefinir sua senha.
          </SuccessMessage>
          <p className={styles.formDescription}>
            Confira também o spam. O link vale por 15 minutos. Se precisar
            tentar novamente, aguarde pelo menos um minuto.
          </p>
        </>
      ) : (
        <>
          <p className={styles.formDescription}>
            Informe o e-mail da sua conta. Enviaremos as instruções de
            recuperação.
          </p>
          <form
            method="post"
            onSubmit={handleSubmit}
            aria-describedby={error ? "recovery-error" : undefined}
          >
            <div className={styles.field}>
              <label htmlFor="recovery-email">E-mail</label>
              <input
                id="recovery-email"
                name="email"
                type="email"
                autoComplete="email"
                maxLength={254}
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
            {error ? (
              <p className={styles.error} id="recovery-error" role="alert">
                {error}
              </p>
            ) : null}
            <button
              className={styles.primaryButton}
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              <ButtonActionIcon action="send" />
              {isSubmitting ? "Solicitando..." : "Enviar link de recuperação"}
            </button>
          </form>
        </>
      )}
    </RecoveryLayout>
  );
}
