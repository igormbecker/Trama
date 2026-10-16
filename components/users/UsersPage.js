import { useEffect, useRef, useState } from "react";
import AppLayout from "components/app/AppLayout";
import { listUsers, saveUser, removeUser } from "./usersClient";
import styles from "./users.module.css";

const emptyValues = { name: "", username: "", email: "", password: "" };

export default function UsersPage({ user, initialUsers }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [formValues, setFormValues] = useState(emptyValues);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const dialog = useRef(null);
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

  function openForm(selectedUser = null) {
    setEditingUser(selectedUser);
    setFormValues(
      selectedUser
        ? {
            name: selectedUser.name,
            username: selectedUser.username,
            email: selectedUser.email,
            password: "",
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
    if (isBusy) {
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
    if (isBusy) {
      return;
    }
    setIsBusy(true);
    setFormError("");
    try {
      const savedUser = await saveUser(formValues, editingUser?.username);
      // The public registration response does not include administrative fields.
      const publicUser = {
        ...savedUser,
        is_admin: editingUser?.is_admin ?? false,
      };
      setUsers((current) =>
        editingUser
          ? current.map((entry) =>
              entry.id === savedUser.id ? publicUser : entry,
            )
          : [...current, publicUser],
      );
      setNotice(editingUser ? "Usuário atualizado." : "Usuário adicionado.");
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
    if (isBusy) {
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
            Adicionar usuário
          </button>
        </div>
        {notice ? (
          <p className={styles.success} role="status">
            {notice}
          </p>
        ) : null}
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
                <div className={styles.field}>
                  <label htmlFor="password">
                    {editingUser ? "Nova senha (opcional)" : "Senha"}
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required={!editingUser}
                    minLength={8}
                    maxLength={128}
                    aria-describedby="password-hint"
                    value={formValues.password}
                    onChange={handleChange}
                    disabled={isBusy}
                  />
                  <small id="password-hint">
                    {editingUser
                      ? "Deixe em branco para manter a senha atual."
                      : "Use pelo menos 8 caracteres."}
                  </small>
                </div>
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
                >
                  {isBusy ? "Salvando..." : "Salvar usuário"}
                </button>
                <button
                  className={styles.secondaryButton}
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
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        aria-label={`Editar ${entry.name}`}
                        onClick={() => openForm(entry)}
                        disabled={isBusy}
                      >
                        Editar
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
                        Remover
                      </button>
                    </div>
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
            if (isBusy) {
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
              className={styles.secondaryButton}
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
