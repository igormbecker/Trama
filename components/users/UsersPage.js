import useActionState from "components/shared/useActionState";
import LoadingMessage from "components/shared/LoadingMessage";
import SuccessMessage from "components/shared/SuccessMessage";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import AppLayout from "components/app/AppLayout";
import { listUsers, saveUser, removeUser } from "./usersClient";
import styles from "./users.module.css";
import UserActionsMenu from "./UserActionsMenu";
import UserActionIcon from "./UserActionIcon";

const emptyValues = { name: "", username: "", email: "", password: "" };

export default function UsersPage({ user, initialUsers }) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [formValues, setFormValues] = useState(emptyValues);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBusy, setIsBusy, pendingRef] = useActionState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [representingUser, setRepresentingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const dialog = useRef(null);
  const impersonationTitle = useRef(null);
  const firstInput = useRef(null);
  const addButton = useRef(null);

  useEffect(() => {
    if (isFormOpen) {
      firstInput.current?.focus();
    }
  }, [isFormOpen, editingUser]);

  useEffect(() => {
    if (deletingUser) {
      dialog.current?.showModal();
    }
  }, [deletingUser]);

  useEffect(() => {
    if (representingUser) {
      impersonationTitle.current?.focus();
    }
  }, [representingUser]);

  function openForm(selectedUser = null) {
    setEditingUser(selectedUser);
    setFormValues(
      selectedUser
        ? {
            name: selectedUser.name,
            username: selectedUser.username,
            email: selectedUser.email,
            password: "",
            password_confirmation: "",
            is_admin: selectedUser.is_admin,
          }
        : emptyValues,
    );
    setFormError("");
    setNotice("");
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setFormError("");
    addButton.current?.focus();
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
  }

  async function refreshList() {
    if (pendingRef.current) {
      return;
    }
    setIsBusy(true);
    setError("");
    try {
      setUsers(await listUsers());
    } catch (error) {
      setError(error.message);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (pendingRef.current) {
      return;
    }
    setIsBusy(true);
    setFormError("");
    try {
      const savedUser = await saveUser(formValues, editingUser?.username);
      if (
        savedUser.id === user.id &&
        editingUser &&
        savedUser.email.toLowerCase() !== editingUser.email.toLowerCase()
      ) {
        await router.replace("/verify-email");
        return;
      }
      if (savedUser.id === user.id && !savedUser.is_admin) {
        await router.replace("/works");
        return;
      }
      // Administrative creation returns a regular account without the role field.
      const publicUser = {
        ...savedUser,
        is_admin: savedUser.is_admin ?? false,
      };
      setUsers((current) =>
        editingUser
          ? current.map((entry) =>
              entry.id === savedUser.id ? publicUser : entry,
            )
          : [...current, publicUser],
      );
      setNotice(
        editingUser
          ? "Usuário atualizado. Se o e-mail mudou, a pessoa precisa confirmar o novo endereço."
          : "Usuário adicionado. A pessoa precisa confirmar o e-mail antes de entrar; pode solicitar outro link em Confirmar e-mail.",
      );
      closeForm();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setIsBusy(false);
    }
  }

  function closeDeleteDialog() {
    dialog.current?.close();
    setDeletingUser(null);
    setDeleteError("");
  }

  async function confirmRemoval() {
    if (pendingRef.current) {
      return;
    }
    setIsBusy(true);
    setDeleteError("");
    try {
      await removeUser(deletingUser.username);
      setUsers((current) =>
        current.filter((entry) => entry.id !== deletingUser.id),
      );
      setNotice("Usuário removido.");
      closeDeleteDialog();
    } catch (error) {
      setDeleteError(error.message);
    } finally {
      setIsBusy(false);
    }
  }

  async function startImpersonation() {
    if (pendingRef.current || !representingUser) {
      return;
    }
    setIsBusy(true);
    setError("");
    try {
      const response = await fetch("/api/v1/impersonation", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: representingUser.id }),
      });
      if (!response.ok) {
        throw new Error(
          "Não foi possível personificar esta conta. Confira sua sessão e o perfil do usuário.",
        );
      }
      // Reload to discard React and SWR state from the previous identity.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/home");
    } catch (failure) {
      setError(failure.message);
      setIsBusy(false);
    }
  }

  const query = search.trim().toLocaleLowerCase("pt-BR");
  const filteredUsers = users
    .filter((entry) =>
      [entry.name, entry.username, entry.email].some((value) =>
        value.toLocaleLowerCase("pt-BR").includes(query),
      ),
    )
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  return (
    <AppLayout
      user={users.find((entry) => entry.id === user.id) || user}
      activePage="users"
      title="Usuários | Trama"
      description="Gerencie as contas de acesso ao Trama."
    >
      <section className={styles.workspace} aria-labelledby="users-title">
        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>Administração</p>
            <h1 id="users-title">Usuários</h1>
            <p>Cuide das pessoas que fazem parte do Trama.</p>
          </div>
          <button
            className={styles.primaryButton}
            type="button"
            ref={addButton}
            onClick={() => openForm()}
            disabled={isBusy}
          >
            <UserActionIcon action="add" /> Adicionar usuário
          </button>
        </div>
        <LoadingMessage pending={isBusy}>Atualizando usuários…</LoadingMessage>
        {representingUser ? (
          <section
            className={styles.formPanel}
            aria-labelledby="impersonation-title"
          >
            <h2 id="impersonation-title" ref={impersonationTitle} tabIndex={-1}>
              Personificar {representingUser.name}?
            </h2>
            <p>
              Você usará as permissões desta conta por até 15 minutos. As
              alterações afetam dados reais e serão registradas com sua
              identidade administrativa. A mudança vale para todas as abas desta
              sessão. Antes de continuar, salve o trabalho aberto.
            </p>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setRepresentingUser(null)}
                disabled={isBusy}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={startImpersonation}
                disabled={isBusy}
              >
                {isBusy ? "Iniciando…" : "Iniciar personificação"}
              </button>
            </div>
          </section>
        ) : null}
        {notice ? <SuccessMessage>{notice}</SuccessMessage> : null}
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        {isFormOpen ? (
          <section
            className={styles.formPanel}
            aria-labelledby="user-form-title"
          >
            <h2 id="user-form-title">
              {editingUser ? "Editar usuário" : "Adicionar usuário"}
            </h2>
            <p>
              {editingUser
                ? "Atualize os dados da conta."
                : "A nova conta terá acesso comum ao Trama."}
            </p>
            <form
              onSubmit={handleSubmit}
              method="post"
              aria-describedby={formError ? "user-form-error" : undefined}
            >
              <div className={styles.fields}>
                <div className={styles.field}>
                  <label htmlFor="name">Nome completo</label>
                  <input
                    ref={firstInput}
                    id="name"
                    name="name"
                    autoComplete="off"
                    required
                    maxLength={255}
                    value={formValues.name}
                    onChange={handleChange}
                    disabled={isBusy}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="username">Nome de usuário</label>
                  <input
                    id="username"
                    name="username"
                    autoComplete="off"
                    required
                    maxLength={30}
                    pattern="[a-zA-Z0-9_.\-]{1,30}"
                    aria-describedby="username-hint"
                    value={formValues.username}
                    onChange={handleChange}
                    disabled={isBusy}
                  />
                  <small id="username-hint">
                    Letras sem acento, números, ponto, hífen ou sublinhado.
                  </small>
                </div>
                <div className={styles.field}>
                  <label htmlFor="email">E-mail</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="off"
                    required
                    maxLength={254}
                    value={formValues.email}
                    onChange={handleChange}
                    disabled={isBusy}
                  />
                </div>
                {editingUser ? (
                  <div className={styles.field}>
                    <label htmlFor="user-role">Perfil</label>
                    <select
                      id="user-role"
                      value={formValues.is_admin ? "admin" : "user"}
                      onChange={(event) =>
                        setFormValues((current) => ({
                          ...current,
                          is_admin: event.target.value === "admin",
                        }))
                      }
                      disabled={isBusy}
                    >
                      <option value="user">Usuário</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                ) : null}
                <div className={styles.field}>
                  <label htmlFor="password">
                    {editingUser ? "Nova senha (opcional)" : "Senha"}
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required={
                      !editingUser || Boolean(formValues.password_confirmation)
                    }
                    minLength={8}
                    maxLength={128}
                    aria-describedby="password-hint"
                    value={formValues.password}
                    onChange={handleChange}
                    disabled={isBusy}
                  />
                  <small id="password-hint">
                    {editingUser
                      ? "Deixe os dois campos em branco para manter a senha atual."
                      : "Use pelo menos 8 caracteres."}
                  </small>
                </div>
                {editingUser ? (
                  <div className={styles.field}>
                    <label htmlFor="password-confirmation">
                      Confirmar nova senha
                    </label>
                    <input
                      id="password-confirmation"
                      name="password_confirmation"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={128}
                      required={Boolean(formValues.password)}
                      value={formValues.password_confirmation}
                      onChange={handleChange}
                      disabled={isBusy}
                    />
                  </div>
                ) : null}
              </div>
              {formError ? (
                <p id="user-form-error" className={styles.error} role="alert">
                  {formError}
                </p>
              ) : null}
              <div className={styles.actions}>
                <button
                  className={styles.primaryButton}
                  type="submit"
                  disabled={isBusy}
                  aria-busy={isBusy}
                >
                  {isBusy ? "Salvando..." : "Salvar usuário"}
                </button>
                <button
                  className={styles.dangerButton}
                  type="button"
                  onClick={closeForm}
                  disabled={isBusy}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        ) : null}
        <div className={styles.toolbar}>
          <div className={styles.field}>
            <label htmlFor="user-search">Buscar usuários</label>
            <input
              id="user-search"
              type="search"
              placeholder="Nome, usuário ou e-mail"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={refreshList}
            disabled={isBusy}
          >
            <UserActionIcon action="refresh" />{" "}
            {isBusy ? "Aguarde..." : "Atualizar lista"}
          </button>
        </div>
        <p className={styles.count} role="status">
          {filteredUsers.length}{" "}
          {filteredUsers.length === 1
            ? "usuário encontrado"
            : "usuários encontrados"}
        </p>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <caption className={styles.srOnly}>
              Contas de usuários do Trama
            </caption>
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">Usuário</th>
                <th scope="col">E-mail</th>
                <th scope="col">Perfil</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((entry) => (
                <tr key={entry.id}>
                  <td data-label="Nome">
                    <strong>{entry.name}</strong>
                    {entry.id === user.id ? (
                      <span className={styles.you}>Você</span>
                    ) : null}
                  </td>
                  <td data-label="Usuário">{entry.username}</td>
                  <td data-label="E-mail">{entry.email}</td>
                  <td data-label="Perfil">
                    <span
                      className={
                        entry.is_admin ? styles.adminBadge : styles.badge
                      }
                    >
                      {entry.is_admin ? "Administrador" : "Usuário"}
                    </span>
                  </td>
                  <td data-label="Ações">
                    <UserActionsMenu name={entry.name} disabled={isBusy}>
                      {!entry.is_admin && entry.id !== user.id ? (
                        <button
                          type="button"
                          aria-label={`Personificar ${entry.name}`}
                          disabled={isBusy}
                          onClick={() => {
                            setRepresentingUser(entry);
                            setError("");
                          }}
                        >
                          <UserActionIcon action="impersonate" /> Personificar
                        </button>
                      ) : null}
                      <button
                        type="button"
                        aria-label={`Editar ${entry.name}`}
                        onClick={() => openForm(entry)}
                        disabled={isBusy}
                      >
                        <UserActionIcon action="edit" /> Editar
                      </button>
                      <button
                        type="button"
                        className={styles.removeLink}
                        aria-label={`Remover ${entry.name}`}
                        disabled={isBusy || entry.id === user.id}
                        title={
                          entry.id === user.id
                            ? "Você não pode remover sua própria conta."
                            : undefined
                        }
                        onClick={() => {
                          setDeletingUser(entry);
                          setDeleteError("");
                        }}
                      >
                        <UserActionIcon action="remove" /> Remover
                      </button>
                    </UserActionsMenu>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.emptyState}>
                    Nenhum usuário encontrado. Tente buscar por outro nome ou
                    e-mail.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <dialog
          className={styles.dialog}
          ref={dialog}
          aria-labelledby="delete-title"
          aria-describedby="delete-description"
          onCancel={(event) => {
            if (pendingRef.current) {
              event.preventDefault();
            } else {
              closeDeleteDialog();
            }
          }}
        >
          <h2 id="delete-title">Remover usuário?</h2>
          <p id="delete-description">
            A conta de <strong>{deletingUser?.name}</strong> será excluída e
            seus acessos serão encerrados. Esta ação não pode ser desfeita.
          </p>
          {deleteError ? (
            <p className={styles.error} role="alert">
              {deleteError}
            </p>
          ) : null}
          <div className={styles.actions}>
            <button
              className={styles.dangerButton}
              type="button"
              onClick={closeDeleteDialog}
              disabled={isBusy}
              autoFocus
            >
              Cancelar
            </button>
            <button
              className={styles.dangerButton}
              type="button"
              onClick={confirmRemoval}
              disabled={isBusy}
            >
              {isBusy ? "Removendo..." : "Remover usuário"}
            </button>
          </div>
        </dialog>
      </section>
    </AppLayout>
  );
}
