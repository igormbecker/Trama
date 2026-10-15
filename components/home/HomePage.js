import { useState } from "react";
import HomeLayout, { ContactButton } from "./HomeLayout";
import shared from "./homeLayout.module.css";
import styles from "./home.module.css";

// Experiências de Igor Becker; a origem de cada projeto aparece na descrição.
const experiences = [
  {
    id: "sistemas",
    name: "Sistemas de negócio",
    title: "Regras complexas. Uso mais simples.",
    description:
      "Desenvolvimento e evolução de sistemas web para gestão de garantias, com regras de negócio, integração com APIs e processamento de XMLs de NF-e.",
    technologies: ["C# / .NET", "SQL Server", "JavaScript"],
    stages: ["Solicitação", "Regras de negócio", "Acompanhamento"],
    note: "Experiência em gestão de processos de garantia.",
  },
  {
    id: "processos",
    name: "Automação de processos",
    title: "Cada etapa conectada à próxima.",
    description:
      "Atuação com Orquestra BPM e Zeev, modelagem BPMN e integrações para implementar fluxos e processos corporativos.",
    technologies: ["BPMN", "Zeev / Orquestra", "APIs REST"],
    stages: ["Entrada", "Fluxo de aprovação", "Próxima ação"],
    note: "Experiência profissional em automação corporativa.",
  },
  {
    id: "documentos",
    name: "Documentos com IA",
    title: "Documentos analisados dentro do processo.",
    description:
      "Participei do desenvolvimento e da melhoria contínua de uma solução de classificação de documentos com IA. Uma API lia o documento, comparava as informações com os dados do formulário e retornava o resultado para o fluxo: aprovação automática ou encaminhamento para análise da operação.",
    technologies: ["APIs REST", "OpenAI", "Automação de processos"],
    stages: [
      "Documento e formulário",
      "Análise e classificação",
      "Aprovação ou análise humana",
    ],
    note: "Participação de Igor Becker em projeto durante sua atuação na Zeev.",
  },
  {
    id: "code-review",
    name: "Code review com IA",
    title: "Uma primeira análise, direto no pull request.",
    description:
      "Colaborei em um projeto de revisão de código com IA, integrando OpenAI e Gemini para realizar uma análise inicial e publicar comentários diretamente nos pull requests. A iniciativa apoiava a qualidade do código e o trabalho dos responsáveis técnicos na revisão.",
    technologies: ["APIs REST", "OpenAI", "Gemini"],
    stages: [
      "Pull request",
      "Análise inicial com IA",
      "Comentários para revisão",
    ],
    note: "Participação de Igor Becker em projeto durante sua atuação na Zeev.",
  },
  {
    id: "framework",
    name: "Framework JavaScript",
    title: "Uma base comum para construir melhor.",
    description:
      "Participei da criação de um framework JavaScript para padronizar a estrutura dos projetos, boas práticas e reutilização de código. O trabalho buscava reduzir retrabalho e facilitar a entrada de novos desenvolvedores nos projetos.",
    technologies: ["JavaScript", "jQuery", "Reutilização de código"],
    stages: [
      "Padrões de projeto",
      "Estrutura reutilizável",
      "Aplicação nos projetos",
    ],
    note: "Participação de Igor Becker em projeto durante sua atuação na Zeev.",
  },
  {
    id: "migracao",
    name: "Migração de BPM",
    title: "Evoluir o sistema sem perder o processo.",
    description:
      "Atuei na migração de um sistema BPM da versão 2 para a 3, em um contexto de mudança de banco de dados e de infraestrutura local para a nuvem. Minha participação envolveu processos complexos com integrações, refatoração de código legado e análise da modelagem para adaptar os fluxos aos padrões da nova versão.",
    technologies: ["APIs REST", "jQuery", "BPM"],
    stages: [
      "Processos e integrações",
      "Refatoração e adaptação",
      "Compatibilidade com a nova versão",
    ],
    note: "Participação de Igor Becker em projeto durante sua atuação na Zeev.",
  },
];

export default function HomePage() {
  const [selectedId, setSelectedId] = useState("sistemas");
  const selectedExperience = experiences.find(
    (experience) => experience.id === selectedId,
  );

  return (
    <HomeLayout title="Tecnologia e Desenvolvimento de Software">
      <section className={styles.experienceHero}>
        <p className={shared.sectionLabel}>
          Desenvolvimento · Integração · Automação
        </p>
        <h1>
          Por trás de cada sistema,
          <br />
          um problema <em>resolvido.</em>
        </h1>
        <div>
          <p>
            Experiência em transformar processos de negócio em software. Conheça
            algumas das frentes de atuação de Igor Becker, à frente da Bectec.
          </p>
          <ContactButton />
        </div>
      </section>
      <section
        className={styles.workSection}
        id="experiencia"
        aria-labelledby="work-title"
      >
        <div className={styles.workHeader}>
          <h2 id="work-title">Experiência aplicada</h2>
          <span>Explore as áreas de atuação</span>
        </div>
        <div
          className={styles.filterButtons}
          role="group"
          aria-label="Escolha uma área de experiência"
        >
          {experiences.map((experience) => (
            <button
              key={experience.id}
              type="button"
              aria-pressed={selectedId === experience.id}
              aria-controls="experience-detail"
              onClick={() => setSelectedId(experience.id)}
            >
              {experience.name}
            </button>
          ))}
        </div>
        <div
          className={styles.workPanel}
          id="experience-detail"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className={styles.workCopy}>
            <p className={shared.sectionLabel}>{selectedExperience.name}</p>
            <h3>{selectedExperience.title}</h3>
            <p>{selectedExperience.description}</p>
            <ul className={styles.technologyList}>
              {selectedExperience.technologies.map((technology) => (
                <li key={technology}>{technology}</li>
              ))}
            </ul>
          </div>
          <figure className={styles.workflow}>
            <figcaption>Do contexto à solução</figcaption>
            <div>
              {selectedExperience.stages.map((stage, index) => (
                <div className={styles.workflowStep} key={stage}>
                  <span aria-hidden="true">
                    {index === 2 ? "✓" : `0${index + 1}`}
                  </span>
                  <strong>{stage}</strong>
                  {index < 2 && <i aria-hidden="true">↓</i>}
                </div>
              ))}
            </div>
            <p>Representação ilustrativa do fluxo</p>
          </figure>
          <p className={styles.workNote}>
            {selectedExperience.note} Os exemplos descrevem a trajetória do
            profissional, incluindo trabalhos anteriores à Bectec.
          </p>
        </div>
      </section>
      <section className={shared.section} id="servicos">
        <div className={shared.sectionHeading}>
          <h2>
            Da experiência
            <br />
            ao seu próximo projeto.
          </h2>
          <p>
            Cada contexto pede uma solução.
            <br />
            Estes são os caminhos em que posso ajudar.
          </p>
        </div>
        <div className={styles.experienceServices}>
          <article>
            <h3>Construir</h3>
            <p>Sistemas sob medida e sites para necessidades reais.</p>
          </article>
          <article>
            <h3>Conectar</h3>
            <p>Integrações entre aplicações, serviços e bancos de dados.</p>
          </article>
          <article>
            <h3>Simplificar</h3>
            <p>Automação de processos e tarefas da operação.</p>
          </article>
          <article>
            <h3>Orientar</h3>
            <p>Consultoria técnica para tomar decisões de software.</p>
          </article>
        </div>
      </section>
      <section className={styles.experienceBio}>
        <span className={styles.bioMonogram} aria-hidden="true">
          ib.
        </span>
        <div>
          <p className={shared.sectionLabel}>Igor Becker · Bectec</p>
          <h2>Do entendimento à entrega.</h2>
          <p>
            Atuação em tecnologia desde 2010, em colaboração com clientes e
            times multidisciplinares. Experiência com C#/.NET, JavaScript, SQL
            Server, Oracle e processos corporativos.
          </p>
        </div>
        <a href="https://www.linkedin.com/in/igor-mauricio-becker-junior-7ba7ab57/">
          Ver trajetória no LinkedIn
        </a>
      </section>
    </HomeLayout>
  );
}
