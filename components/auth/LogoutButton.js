import useActionState from "components/shared/useActionState";
import { useRouter } from "next/router";
import { useAuth } from "./AuthProvider";
import { useState } from "react";
import { signOut } from "./authClient";
import styles from "./auth.module.css";

export default function LogoutButton() {
  const router = useRouter();
  const { clearUser } = useAuth();
  const [isSubmitting, setIsSubmitting, pendingRef] = useActionState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    if (pendingRef.current) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await signOut();
      await clearUser();
      await router.replace("/login");
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.logoutControl}>
      <button
        className={styles.logoutButton}
        type="button"
        onClick={handleLogout}
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? "Saindo..." : "Sair"}
      </button>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
