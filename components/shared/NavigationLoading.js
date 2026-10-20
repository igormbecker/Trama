import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useTheme } from "components/theme/ThemeProvider";
import { trackNavigation } from "./navigationProgress";
import styles from "./navigationLoading.module.css";

export default function NavigationLoading() {
  const router = useRouter();
  const { theme } = useTheme();
  const [pending, setPending] = useState(false);
  useEffect(
    () =>
      trackNavigation({
        events: router.events,
        document,
        currentUrl: () => window.location.href,
        onChange: setPending,
      }),
    [router.events],
  );
  return pending ? (
    <div
      className={styles.loading}
      data-theme={theme}
      role="status"
      aria-live="polite"
    >
      <div className={styles.track} aria-hidden="true">
        <span />
      </div>
      <span className={styles.label}>Carregando…</span>
    </div>
  ) : null;
}
