import Link from "next/link";
import HomeLayout from "components/home/HomeLayout";
import LegalText from "./LegalText";
import styles from "./legal.module.css";
export default function LegalDocumentPage({ document, kind }) {
  const title = kind === "terms" ? "Termos de Uso" : "Aviso de Privacidade";
  return (
    <HomeLayout
      title={`${title} | Trama`}
      description={title}
      navigation={<Link href="/home">Voltar ao Trama</Link>}
    >
      <article className={styles.document}>
        <p>Versão {document.id}</p>
        <LegalText content={document.content} />
        <p>
          <Link href="/legal/accept">Ir para o aceite</Link> ·{" "}
          <Link href="/legal/support">Contato e solicitações</Link>
        </p>
      </article>
    </HomeLayout>
  );
}
