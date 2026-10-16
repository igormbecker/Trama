import { useRouter } from "next/router";
import { useState } from "react";
import { signOut } from "./authClient";
import styles from "./auth.module.css";

export default function LogoutButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await signOut();
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
