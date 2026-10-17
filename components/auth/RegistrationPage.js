import Link from "next/link";
import HomeLayout from "components/home/HomeLayout";
import styles from "./auth.module.css";

export default function RegistrationPage() {
  return (
    <HomeLayout
      title="Acesso restrito | Trama"
      description="Solicite sua conta ao administrador do Trama."
      navigation={<Link href="/login">Entrar</Link>}
    >
      <section
        className={styles.loginSection}
        aria-labelledby="registration-title"
      >
        <div className={styles.formPanel}>
          <h1 id="registration-title">Acesso restrito</h1>
          <p className={styles.formDescription}>
            O cadastro público está fechado. Solicite sua conta ao administrador
            do Trama.
          </p>
          <Link href="/login">Entrar na sua conta</Link>
        </div>
      </section>
    </HomeLayout>
  );
}
