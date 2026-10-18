import Link from "next/link";
import HomeLayout from "components/home/HomeLayout";
import styles from "components/legal/legal.module.css";
export default function LegalSupport() {
  return (
    <HomeLayout
      title="Contato e solicitações | Trama"
      description="Privacidade, recuperação de conteúdo e encerramento de conta."
      navigation={<Link href="/legal/accept">Voltar à revisão</Link>}
    >
      <section className={styles.document}>
        <h1>Contato e solicitações</h1>
        <p>
          Você pode pedir esclarecimentos, acesso e recuperação de dados ou
          obras e encerramento da conta, inclusive se não aceitar os Termos de
          Uso.
        </p>
        <p>
          Envie sua solicitação para{" "}
          <a href="mailto:imbjr.work@gmail.com?subject=Solicita%C3%A7%C3%A3o%20sobre%20o%20Trama">
            imbjr.work@gmail.com
          </a>
          , informando o e-mail da conta e o que deseja solicitar. Não envie
          senhas. Poderemos confirmar sua identidade de forma proporcional antes
          de entregar dados ou executar alterações.
        </p>
        <p>
          O atendimento é realizado por contato, sem exclusão automática pela
          recusa dos termos. Solicitações serão avaliadas conforme os direitos
          envolvidos e as obrigações aplicáveis.
        </p>
        <p>
          Becker Tecnologia e Desenvolvimento de Software — CNPJ
          65.457.811/0001-61.
          <br />
          Rua General Salvador Pinheiro, 725, Vila Jardim, Porto Alegre/RS.
        </p>
        <p>
          <Link href="/terms">Termos de Uso</Link> ·{" "}
          <Link href="/privacy">Aviso de Privacidade</Link> ·{" "}
          <Link href="/login">Entrar</Link>
        </p>
      </section>
    </HomeLayout>
  );
}
