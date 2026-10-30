import ButtonActionIcon from "components/icons/ButtonActionIcon";
import NavigationToggleIcon from "components/icons/NavigationToggleIcon";
import HomeIcon from "components/icons/HomeIcon";
import ProjectsIcon from "components/icons/ProjectsIcon";
import ChecklistIcon from "components/icons/ChecklistIcon";
import MailIcon from "components/icons/MailIcon";
import AccountIcon from "components/icons/AccountIcon";
import UsersIcon from "components/icons/UsersIcon";
import TrashMenuIcon from "components/icons/TrashMenuIcon";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import HomeLayout from "components/home/HomeLayout";
import LogoutButton from "components/auth/LogoutButton";
import useInvitations from "components/works/useInvitations";
import useParticipations, {
  needsParticipationAction,
} from "components/works/useParticipations";
import styles from "./appLayout.module.css";
import observeSidebarHeight from "./observeSidebarHeight";

function subscribeViewport(onChange) {
  const viewport = window.matchMedia("(max-width: 800px)");
  viewport.addEventListener("change", onChange);
  return () => viewport.removeEventListener("change", onChange);
}
const isMobileViewport = () => window.matchMedia("(max-width: 800px)").matches;
const serverViewport = () => false;

export default function AppLayout({
  user,
  activePage,
  title,
  description,
  children,
  initialInvitations,
  initialParticipations,
  backHref,
  backLabel = "Voltar",
  writingFocus = false,
}) {
  const [menuChoice, setMenuChoice] = useState(null);
  const isMobile = useSyncExternalStore(
    subscribeViewport,
    isMobileViewport,
    serverViewport,
  );
  const focusMode = !isMobile && writingFocus;
  const menuOpen =
    menuChoice?.focusMode === focusMode
      ? menuChoice.open
      : !isMobile && !writingFocus;
  function setMenuOpen(open) {
    setMenuChoice({ focusMode, open });
  }
  const toggleRef = useRef(null);
  const sidebarRef = useRef(null);
  useEffect(() => {
    if (isMobile || !sidebarRef.current) {
      return;
    }
    return observeSidebarHeight(sidebarRef.current);
  }, [isMobile]);
  function closeMobileMenu(event) {
    if (
      event.target.closest("a") &&
      window.matchMedia("(max-width: 800px)").matches
    ) {
      setMenuOpen(false);
    }
  }
  function closeMenu() {
    setMenuOpen(false);
    toggleRef.current?.focus();
  }
  const { data: invitations, error: invitationsError } = useInvitations(
    user.id,
    initialInvitations,
  );
  const invitationCount = invitationsError ? 0 : invitations?.length || 0;
  const { data: participations } = useParticipations(
    user.id,
    initialParticipations,
  );
  const participationCount =
    participations?.filter(needsParticipationAction).length || 0;
  const menuIconPath = isMobile
    ? menuOpen
      ? "m6 6 12 12M6 18 18 6"
      : "M4 6h16M4 12h16M4 18h16"
    : menuOpen
      ? "m11 6-6 6 6 6m8-12-6 6 6 6"
      : "m5 6 6 6-6 6m8-12 6 6-6 6";
  return (
    <HomeLayout
      title={title}
      description={description}
      navigation={<></>}
      showThemeControl={false}
      hasFloatingNavigation
    >
      {backHref && (
        <Link
          className={styles.floatingBack}
          data-button
          href={backHref}
          aria-label={backLabel}
          title={backLabel}
        >
          <ButtonActionIcon action="back" iconOnly />
          <span>Voltar</span>
        </Link>
      )}
      <div
        className={`${styles.frame} ${menuOpen ? "" : styles.menuClosed} ${writingFocus ? styles.writingFrame : ""}`}
      >
        <div className={styles.menuControl}>
          <button
            ref={toggleRef}
            type="button"
            className={styles.menuToggle}
            aria-controls="account-sidebar"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Ocultar menu" : "Mostrar menu"}
            title={menuOpen ? "Ocultar menu" : "Mostrar menu"}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <NavigationToggleIcon path={menuIconPath} />
          </button>
        </div>
        {menuOpen && (
          <button
            className={styles.menuBackdrop}
            data-button-effect="none"
            type="button"
            aria-label="Fechar menu"
            onClick={closeMenu}
          />
        )}
        <div
          id="account-sidebar"
          ref={sidebarRef}
          className={styles.sidebarClip}
          inert={!menuOpen}
          aria-hidden={!menuOpen}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              closeMenu();
            }
          }}
        >
          <aside className={styles.sidebar}>
            <p className={styles.greeting}>Seu espaço no Trama</p>
            <p className={styles.name}>{user.name}</p>
            <nav
              aria-label="Menu da conta"
              className={styles.menu}
              onClick={closeMobileMenu}
            >
              <Link
                href="/home"
                aria-current={activePage === "home" ? "page" : undefined}
              >
                <HomeIcon />
                Seu espaço
              </Link>
              <Link
                href="/works"
                aria-current={activePage === "works" ? "page" : undefined}
              >
                <ProjectsIcon />
                Meus projetos
              </Link>
              <Link
                href="/participations"
                aria-current={
                  activePage === "participations" ? "page" : undefined
                }
              >
                <ChecklistIcon />
                Minhas participações
                {participationCount > 0 && (
                  <span
                    className={styles.invitationCount}
                    aria-label={`${participationCount} ${participationCount === 1 ? "pedido aguardando sua ação" : "pedidos aguardando sua ação"}`}
                  >
                    {participationCount}
                  </span>
                )}
              </Link>
              <Link
                href="/invitations"
                aria-current={activePage === "invitations" ? "page" : undefined}
              >
                <MailIcon />
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
                <AccountIcon />
                Minha conta
              </Link>
              {user.is_admin ? (
                <Link
                  href="/users"
                  aria-current={activePage === "users" ? "page" : undefined}
                >
                  <UsersIcon />
                  Usuários
                </Link>
              ) : null}
              <Link
                href="/trash"
                aria-current={activePage === "trash" ? "page" : undefined}
              >
                <TrashMenuIcon />
                Lixeira
              </Link>
            </nav>
            <p className={styles.role}>
              {user.is_admin ? "Administrador" : "Sua conta"}
            </p>
            <div className={styles.sidebarLogout}>
              <LogoutButton />
            </div>
          </aside>
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </HomeLayout>
  );
}
