import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/router";
import HomeLayout from "components/home/HomeLayout";
import LogoutButton from "components/auth/LogoutButton";
import styles from "./legal.module.css";
export default function AcceptancePage({ user, legalStatus, impersonating }) {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [refused, setRefused] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    if (!accepted || busy || impersonating) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/v1/legal/acceptance", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accepted: true,
          release_id: legalStatus.release_id,
        }),
      });
      if (!response.ok)
        throw new Error(
          response.status === 401
            ? "Sua sessão expirou. Entre novamente."
            : "Não foi possível registrar o aceite. Recarregue a página para conferir a versão atual e tente novamente.",
        );
      await router.replace("/home");
    } catch (failure) {
      setError(failure.message);
      setBusy(false);
    }
  }
  return (
    <HomeLayout
      title="Termos e privacidade | Trama"
      description="Revise as condições para usar o Trama."
      navigation={<LogoutButton />}
    >
      <section className={styles.document} aria-labelledby="acceptance-title">
        <h1 id="acceptance-title">Antes de continuar</h1>
        <p>
          {user.name}, confira os documentos da versão {legalStatus.release_id}.
        </p>
        <ul>
          <li>
            <Link
              href={`/terms?version=${legalStatus.release_id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ler os Termos de Uso (abre em outra aba)
            </Link>
          </li>
          <li>
            <Link
              href={`/privacy?version=${legalStatus.release_id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ler o Aviso de Privacidade (abre em outra aba)
            </Link>
          </li>
        </ul>
        <p>
          O aceite dos Termos é necessário para usar a área de trabalho. A
          ciência do Aviso não autoriza usos irrestritos dos seus dados nem
          publicidade.
        </p>
        {!legalStatus.enabled ? (
          <p>
            O aceite ainda está em preparação e não é exigido neste ambiente.
          </p>
        ) : impersonating ? (
          <p role="alert">
            A personificação não pode aceitar documentos em nome de outra
            pessoa. Encerre esse modo para voltar à sua conta.
          </p>
        ) : refused ? (
          <>
            <h2>Você pode decidir depois</h2>
            <p>
              As funcionalidades continuam restritas enquanto não houver aceite.
              Seus dados não foram apagados. Você pode solicitar recuperação das
              obras e dados, esclarecimentos ou encerramento da conta pelo canal
              de atendimento.
            </p>
            <p>
              <Link href="/legal/support">Contato e solicitações</Link>
            </p>
            <button type="button" onClick={() => setRefused(false)}>
              Voltar à revisão
            </button>
          </>
        ) : (
          <form onSubmit={submit}>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
                required
                disabled={busy}
              />
              <span>
                Aceito os Termos de Uso e declaro ciência do Aviso de
                Privacidade.
              </span>
            </label>
            <div className={styles.actions}>
              <button type="submit" disabled={!accepted || busy}>
                {busy ? "Registrando…" : "Aceitar e continuar"}
              </button>
              <button
                type="button"
                onClick={() => setRefused(true)}
                disabled={busy}
              >
                Não aceitar agora
              </button>
            </div>
          </form>
        )}
        {error ? <p role="alert">{error}</p> : null}
        <p>
          <Link href="/legal/support">
            Precisa de ajuda ou quer solicitar seus dados?
          </Link>
        </p>
      </section>
    </HomeLayout>
  );
}
