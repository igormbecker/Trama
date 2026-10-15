import { useState } from "react";
import HomeLayout from "./HomeLayout";
import styles from "./home.module.css";

const chapters = [
  {
    number: "01",
    title: "O começo de uma ideia",
    author: "Marina Costa",
    initials: "MC",
    status: "Aprovado",
    stage: "approved",
    detail: "Revisão concluída. O capítulo está aprovado para seguir na obra.",
    action: "Uma etapa concluída, com todos na mesma página.",
  },
  {
    number: "02",
    title: "Perspectivas que se encontram",
    author: "Rafael Lima",
    initials: "RL",
    status: "Em revisão",
    stage: "review",
    detail:
      "A entrega de Rafael está em revisão. O próximo passo é reunir os apontamentos e devolver ao autor.",
    action: "Da entrega à revisão, cada passagem fica clara.",
  },
  {
    number: "03",
    title: "Novos caminhos possíveis",
    author: "Ana Martins",
    initials: "AM",
    status: "Em escrita",
    stage: "writing",
    detail: "Ana está preparando a primeira entrega deste capítulo.",
    action: "Cada pessoa entende sua participação na obra.",
  },
];

const workflow = [
  {
    title: "Organize a obra",
    description:
      "Dê estrutura às ideias, dividindo a obra em partes e capítulos.",
  },
  {
    title: "Convide as pessoas",
    description: "Conecte autores e equipe aos capítulos em que vão colaborar.",
  },
  {
    title: "Reúna as entregas",
    description: "Acompanhe os arquivos e as versões que fazem a obra avançar.",
  },
  {
    title: "Revise em conjunto",
    description: "Troque apontamentos e acompanhe o que precisa de ajustes.",
  },
  {
    title: "Aprove cada capítulo",
    description: "Conclua as etapas com clareza sobre o que foi aprovado.",
  },
];

const participants = [
  {
    name: "Organização editorial",
    title: "O todo, sem perder os detalhes.",
    description:
      "Uma visão da obra para acompanhar capítulos, pessoas e os próximos passos.",
  },
  {
    name: "Autores e organizadores",
    title: "Espaço para construir juntos.",
    description:
      "Clareza sobre a participação de cada pessoa e sobre o caminho das entregas.",
  },
  {
    name: "Revisores",
    title: "Cada leitura faz a obra avançar.",
    description:
      "Um lugar para acompanhar revisões e conectar os apontamentos ao capítulo.",
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
            Do primeiro convite ao capítulo aprovado, o Trama conecta as pessoas
            e as etapas que dão forma à sua obra.
          </p>
          <a className={styles.primaryLink} href="#como-funciona">
            Conhecer o fluxo <span aria-hidden="true">↓</span>
          </a>
          <p className={styles.developmentNote}>
            Um novo espaço para a produção editorial.
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
            <span>Etapa atual</span>
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
                  <span>{chapter.author}</span>
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
              Da ideia à aprovação.
              <br />
              Um capítulo de cada vez.
            </h2>
          </div>
          <p>
            Este é o caminho que estamos construindo para acompanhar a produção
            de uma obra no Trama.
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
            Trama nasce para aproximar esse trabalho.
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
