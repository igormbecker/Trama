import Link from "next/link";
import HomeLayout from "components/home/HomeLayout";
import LogoutButton from "components/auth/LogoutButton";
import styles from "./appLayout.module.css";

export default function AppLayout({
  user,
  activePage,
  title,
  description,
  children,
}) {
  return (
    <HomeLayout
      title={title}
      description={description}
      navigation={<LogoutButton />}
    >
      <div className={styles.frame}>
        <aside className={styles.sidebar}>
          <p className={styles.greeting}>Seu espaço no Trama</p>
          <p className={styles.name}>{user.name}</p>
          <nav aria-label="Menu da conta" className={styles.menu}>
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
        <div className={styles.content}>{children}</div>
      </div>
    </HomeLayout>
  );
}
