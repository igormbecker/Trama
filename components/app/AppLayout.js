import Link from "next/link";
import { useState } from "react";
import HomeLayout from "components/home/HomeLayout";
import LogoutButton from "components/auth/LogoutButton";
import useInvitations from "components/works/useInvitations";
import styles from "./appLayout.module.css";

export default function AppLayout({
  user,
  activePage,
  title,
  description,
  children,
  initialInvitations,
}) {
  const [menuOpen, setMenuOpen] = useState(true);
  const { data: invitations, error: invitationsError } = useInvitations(
    user.id,
    initialInvitations,
  );
  const invitationCount = invitationsError ? 0 : invitations?.length || 0;
  return (
    <HomeLayout
      title={title}
      description={description}
      navigation={
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.menuToggle}
            aria-controls="account-sidebar"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M9 4v16" />
              <path d={menuOpen ? "m16 9-3 3 3 3" : "m13 9 3 3-3 3"} />
            </svg>
            {menuOpen ? "Ocultar menu" : "Mostrar menu"}
          </button>
          <LogoutButton />
        </div>
      }
      showThemeControl={false}
    >
      <div className={`${styles.frame} ${menuOpen ? "" : styles.menuClosed}`}>
        <div
          id="account-sidebar"
          className={styles.sidebarClip}
          inert={!menuOpen}
          aria-hidden={!menuOpen}
        >
          <aside className={styles.sidebar}>
            <p className={styles.greeting}>Seu espaço no Trama</p>
            <p className={styles.name}>{user.name}</p>
            <nav aria-label="Menu da conta" className={styles.menu}>
              <Link
                href="/home"
                aria-current={activePage === "home" ? "page" : undefined}
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="m3 11 9-8 9 8M5 10v11h14V10M9 21v-7h6v7"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
                Seu espaço
              </Link>
              <Link
                href="/works"
                aria-current={activePage === "works" ? "page" : undefined}
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M12 5C8 2 3 3 2 4v16c4-2 7-1 10 1 3-2 6-3 10-1V4c-4-2-7-1-10 1Zm0 0v16"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
                Minhas obras
              </Link>
              <Link
                href="/invitations"
                aria-current={activePage === "invitations" ? "page" : undefined}
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect
                    x="3"
                    y="5"
                    width="18"
                    height="14"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="m3 6 9 7 9-7"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
                Meus convites
                {invitationCount > 0 && (
                  <span
                    className={styles.invitationCount}
                    aria-label={`${invitationCount} ${invitationCount === 1 ? "convite pendente" : "convites pendentes"}`}
                  >
                    {invitationCount}
                  </span>
                )}
              </Link>
              <Link
                href="/account"
                aria-current={activePage === "account" ? "page" : undefined}
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle
                    cx="12"
                    cy="7"
                    r="4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M4 22v-2a8 8 0 0 1 16 0v2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
                Minha conta
              </Link>
              {user.is_admin ? (
                <Link
                  href="/users"
                  aria-current={activePage === "users" ? "page" : undefined}
                >
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle
                      cx="9"
                      cy="7"
                      r="3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M2 21v-3a7 7 0 0 1 14 0v3M16 4a3 3 0 0 1 0 6m3 4a6 6 0 0 1 3 5v2"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  Usuários
                </Link>
              ) : null}
            </nav>
            <p className={styles.role}>
              {user.is_admin ? "Administrador" : "Sua conta"}
            </p>
          </aside>
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </HomeLayout>
  );
}
