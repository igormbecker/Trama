import useActionState from "components/shared/useActionState";
import SuccessMessage from "components/shared/SuccessMessage";
import { useState } from "react";
import AppLayout from "components/app/AppLayout";
import { useTheme } from "components/theme/ThemeProvider";
import { useAuth } from "components/auth/AuthProvider";
import { saveAccount } from "./accountClient";
import styles from "components/users/users.module.css";

export default function AccountPage({ user }) {
  const [currentUser, setCurrentUser] = useState(user);
  const [values, setValues] = useState({
    name: user.name,
    username: user.username,
    email: user.email,
    password: "",
    password_confirmation: "",
  });
  const [isSaving, setIsSaving, pendingRef] = useActionState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const { theme, setTheme } = useTheme();
  const { refreshUser } = useAuth();

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }
  async function handleSubmit(event) {
    event.preventDefault();
    if (pendingRef.current) {
      return;
    }
    setIsSaving(true);
    setError("");
    setNotice("");
    try {
      const savedUser = await saveAccount(values);
      setCurrentUser(savedUser);
      setValues({
        name: savedUser.name,
        username: savedUser.username,
        email: savedUser.email,
        password: "",
        password_confirmation: "",
      });
      refreshUser().catch(() => {});
      setNotice(
        values.password
          ? "Seus dados e sua senha foram atualizados."
          : "Seus dados foram atualizados.",
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSaving(false);
    }
  }
  return (
    <AppLayout
      user={currentUser}
      activePage="account"
      title="Minha conta | Trama"
      description="Edite seus dados e escolha o tema do Trama."
    >
      <section className={styles.workspace} aria-labelledby="account-title">
        <div className={styles.heading}>
          <div>
            <h1 id="account-title">Minha conta</h1>
            <p>Seus dados e o seu jeito de ler o Trama.</p>
          </div>
        </div>
        {notice ? <SuccessMessage>{notice}</SuccessMessage> : null}
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        <section
          className={styles.formPanel}
          aria-labelledby="personal-data-title"
        >
          <h2 id="personal-data-title">Dados pessoais</h2>
          <p>
            Seu perfil é {currentUser.is_admin ? "Administrador" : "Usuário"}.
          </p>
          <form method="post" onSubmit={handleSubmit}>
            <div className={styles.fields}>
              <div className={styles.field}>
                <label htmlFor="account-name">Nome completo</label>
                <input
                  id="account-name"
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={255}
                  value={values.name}
                  onChange={handleChange}
                  disabled={isSaving}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="account-username">Nome de usuário</label>
                <input
                  id="account-username"
                  name="username"
                  autoComplete="username"
                  required
                  maxLength={30}
                  pattern="[a-zA-Z0-9_.\-]{1,30}"
                  value={values.username}
                  onChange={handleChange}
                  disabled={isSaving}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="account-email">E-mail</label>
                <input
                  id="account-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={values.email}
                  onChange={handleChange}
                  disabled={isSaving}
                />
              </div>
              <div className={`${styles.fields} ${styles.passwordFields}`}>
                <div className={styles.field}>
                  <label htmlFor="account-password">Nova senha</label>
                  <input
                    id="account-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required={Boolean(values.password_confirmation)}
                    value={values.password}
                    onChange={handleChange}
                    disabled={isSaving}
                    aria-describedby="account-password-hint"
                  />
                  <small id="account-password-hint">
                    Use pelo menos 8 caracteres. Deixe os dois campos em branco
                    para manter a senha atual.
                  </small>
                </div>
                <div className={styles.field}>
                  <label htmlFor="account-password-confirmation">
                    Confirmar nova senha
                  </label>
                  <input
                    id="account-password-confirmation"
                    name="password_confirmation"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required={Boolean(values.password)}
                    value={values.password_confirmation}
                    onChange={handleChange}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>
            <div className={styles.actions}>
              <button
                className={styles.primaryButton}
                type="submit"
                disabled={isSaving}
                aria-busy={isSaving}
              >
                {isSaving ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </form>
        </section>
        <section
          className={styles.formPanel}
          aria-labelledby="appearance-title"
        >
          <h2 id="appearance-title">Aparência</h2>
          <p>Escolha o tema que deixa a leitura mais confortável para você.</p>
          <div className={styles.fields}>
            <div className={styles.field}>
              <label htmlFor="account-theme">Tema</label>
              <select
                id="account-theme"
                value={theme}
                onChange={(event) => setTheme(event.target.value)}
                aria-describedby="theme-hint"
              >
                <option value="light">Claro</option>
                <option value="dark">Escuro</option>
              </select>
              <small id="theme-hint">
                A escolha é salva automaticamente neste navegador.
              </small>
            </div>
          </div>
        </section>
      </section>
    </AppLayout>
  );
}
