import { useState } from "react";
import HomeLayout from "./HomeLayout";
import styles from "./home.module.css";

const chapters = [
  {
    number: "01",
    title: "O começo de uma ideia",
    participant: "Marina Costa · Contribuição",
    initials: "MC",
    status: "Contribuição Incorporada",
    stage: "approved",
    detail:
      "O responsável aprovou a contribuição de Marina e incorporou a entrega ao capítulo, preservando o texto anterior.",
    action: "Uma contribuição que passa a fazer parte da obra.",
  },
  {
    number: "02",
    title: "Perspectivas que se encontram",
    participant: "Rafael Lima · Revisão",
    initials: "RL",
    status: "Em revisão",
    stage: "review",
    detail:
      "Rafael comenta trechos de uma versão fixa e prepara seu parecer. O responsável decide os ajustes no texto da obra.",
    action: "Apontamentos ligados ao trecho que precisa de atenção.",
  },
  {
    number: "03",
    title: "Novos caminhos possíveis",
    participant: "Ana Martins · Contribuição",
    initials: "AM",
    status: "Em contribuição",
    stage: "writing",
    detail:
      "Ana escreve em uma cópia do capítulo. Quando enviar a entrega, o responsável poderá pedir ajustes ou aprovar a incorporação.",
    action: "Espaço para contribuir sem alterar o texto atual.",
  },
];

const workflow = [
  {
    title: "Organize a obra",
    description:
      "Dê estrutura às ideias, dividindo a obra em partes e capítulos.",
  },
  {
    title: "Escreva no Trama",
    description:
      "Desenvolva os capítulos no editor, com salvamento automático e recuperação de rascunhos locais.",
  },
  {
    title: "Reúna contribuições",
    description:
      "Convide participantes e atribua contribuições por capítulo. Confira as entregas antes de incorporá-las.",
  },
  {
    title: "Revise em conjunto",
    description:
      "Atribua uma revisão, receba comentários por trecho e acompanhe o parecer e a resolução dos apontamentos.",
  },
  {
    title: "Leia e exporte",
    description:
      "Leia a obra completa, confirme os créditos e exporte em PDF ou DOCX com capa e sumário.",
  },
];

const participants = [
  {
    name: "Responsável pela obra",
    title: "O todo, sem perder os detalhes.",
    description:
      "Organize a estrutura, escreva os capítulos, atribua pedidos e decida quais contribuições incorporar à obra.",
  },
  {
    name: "Pessoas participantes",
    title: "Espaço para construir juntos.",
    description:
      "Consulte a obra como organizador e, ao receber uma atribuição, desenvolva sua contribuição em uma cópia do capítulo.",
  },
  {
    name: "Revisores",
    title: "Cada leitura faz a obra avançar.",
    description:
      "Quando receber uma revisão, comente os trechos de uma versão fixa e envie seu parecer, sem alterar o capítulo.",
  },
];

export default function HomePage() {
  const [selectedChapter, setSelectedChapter] = useState(chapters[1]);

  return (
    <HomeLayout>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroCopy}>
          <p className={styles.intro}>Gestão editorial colaborativa</p>
          <h1 id="hero-title">
            Boas obras são
            <br />
            feitas <span>em conjunto.</span>
          </h1>
          <p className={styles.description}>
            Organize sua obra, escreva capítulos e reúna contribuições em um só
            lugar. Da primeira ideia à revisão, o Trama conecta as pessoas e o
            trabalho editorial.
          </p>
          <a className={styles.primaryLink} href="#como-funciona" data-button>
            Conhecer o fluxo <span aria-hidden="true">↓</span>
          </a>
          <p className={styles.developmentNote}>
            Escrita, colaboração e revisão em um só espaço.
            <br />
            Produto em desenvolvimento.
          </p>
        </div>
        <figure className={styles.preview}>
          <div className={styles.previewTop}>
            <span>Uma obra em construção</span>
            <span className={styles.exampleLabel}>Exemplo ilustrativo</span>
          </div>
          <div className={styles.bookHeading}>
            <div className={styles.bookSpine} aria-hidden="true">
              <span>
                entre
                <br />
                ideias
              </span>
              <i>trama</i>
            </div>
            <div>
              <p>Obra coletiva</p>
              <h2>Entre ideias</h2>
              <span>Três olhares. Uma história em comum.</span>
            </div>
          </div>
          <div className={styles.chapterHeading}>
            <span>Capítulos</span>
            <span>Pedido editorial</span>
          </div>
          <div
            className={styles.chapterList}
            role="group"
            aria-label="Explore os capítulos da obra de exemplo"
          >
            {chapters.map((chapter) => (
              <button
                key={chapter.number}
                className={styles.chapter}
                type="button"
                aria-pressed={selectedChapter.number === chapter.number}
                aria-controls="chapter-detail"
                onClick={() => setSelectedChapter(chapter)}
              >
                <span className={styles.chapterNumber}>{chapter.number}</span>
                <span className={styles.chapterInfo}>
                  <strong>{chapter.title}</strong>
                  <span>{chapter.participant}</span>
                </span>
                <span className={styles[chapter.stage]}>{chapter.status}</span>
              </button>
            ))}
          </div>
          <div
            className={styles.chapterDetail}
            id="chapter-detail"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className={styles.avatar} aria-hidden="true">
              {selectedChapter.initials}
            </span>
            <div>
              <strong>{selectedChapter.action}</strong>
              <p>{selectedChapter.detail}</p>
            </div>
          </div>
          <figcaption>
            Selecione um capítulo para explorar esta prévia.
          </figcaption>
        </figure>
      </section>

      <section
        className={styles.workflowSection}
        id="como-funciona"
        aria-labelledby="workflow-title"
      >
        <div className={styles.sectionHeading}>
          <div>
            <p>Como funciona</p>
            <h2 id="workflow-title">
              Da ideia à obra.
              <br />
              Um capítulo de cada vez.
            </h2>
          </div>
          <p>
            Escreva por conta própria e convide outras pessoas quando precisar.
            Acompanhe o trabalho até a leitura completa e a exportação da obra.
          </p>
        </div>
        <ol className={styles.workflow}>
          {workflow.map((step, index) => (
            <li key={step.title}>
              <span className={styles.stepNumber}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section
        className={styles.participantsSection}
        id="para-quem"
        aria-labelledby="participants-title"
      >
        <div className={styles.sectionHeading}>
          <div>
            <p>Para quem</p>
            <h2 id="participants-title">
              Diferentes olhares.
              <br />A mesma obra.
            </h2>
          </div>
          <p>
            Uma produção editorial reúne pessoas com contribuições diferentes. O
            Trama aproxima esse trabalho. Os nomes de autoria são informados nos
            créditos pelo responsável; participar da obra não atribui autoria
            automaticamente.
          </p>
        </div>
        <div className={styles.participants}>
          {participants.map((participant) => (
            <article key={participant.name}>
              <p className={styles.roleName}>{participant.name}</p>
              <h3>{participant.title}</h3>
              <p>{participant.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.closing} aria-labelledby="closing-title">
        <span className={styles.thread} aria-hidden="true"></span>
        <p>O próximo capítulo é coletivo.</p>
        <h2 id="closing-title">
          Cada contribuição
          <br />
          faz parte da trama.
        </h2>
        <a href="#hero-title">
          Voltar ao início <span aria-hidden="true">↑</span>
        </a>
      </section>
    </HomeLayout>
  );
}
