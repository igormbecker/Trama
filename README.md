# Trama

Aplicação de escrita e colaboração editorial para organizar obras literárias e trabalhos em grupo privados, capítulos, seções, contribuições e revisões. Desenvolvida pela **Bectec — Tecnologia e Desenvolvimento de Software**.

## Funcionalidades

- **Projetos:** obras literárias e trabalhos em grupo, com filtros por tipo, título e descrição editáveis, partes e capítulos/seções ordenáveis, capas ilustrativas e leitura contínua com sumário. Novos trabalhos recebem uma estrutura inicial editável com Introdução, Desenvolvimento, Conclusão e Referências, sem modelo acadêmico obrigatório.
- **Escrita:** editor de texto rico com salvamento automático/manual, recuperação local de rascunhos, reserva por aba e proteção contra sobrescritas concorrentes. A barra acompanha a rolagem no computador e a área visível no celular, com ações adicionais em “Mais” e preservação da seleção ao tocar nos botões.
- **Lixeira:** exclusão recuperável de projetos, partes e capítulos/seções pelo responsável, com restauração. A exclusão definitiva exige confirmação pelo título exato e remove o item e suas dependências.
- **Participantes:** convites de organizadores por e-mail, cadastro restrito pelo convite, aceite/recusa em Meus convites e revogação de acesso.
- **Contribuições:** cópia editável do capítulo, entrega, ajustes e incorporação pelo responsável, preservando o texto anterior para consulta e restauração.
- **Revisões:** leitura de versão fixa, comentários em trechos selecionados e parecer Aprovado ou Correções solicitadas, sem modificar o capítulo. O responsável pode resolver e reabrir comentários, preservando o histórico; o painel fica na lateral no computador e pode ser expandido no celular.
- **Minhas participações:** pedidos atribuídos à conta, separados em andamento e concluídos, com status e contador de ações pendentes atualizado automaticamente.
- **Exportação:** PDF e DOCX com capa, créditos confirmados, descrição da obra e sumário. O responsável informa a autoria; o histórico apenas sugere colaboradores e revisores.
- **Conta e administração:** login/logout, confirmação de e-mail, recuperação de senha, edição da própria conta, gestão administrativa de usuários e personificação temporária de contas comuns para suporte, com auditoria.
- **Documentos legais:** Termos de Uso, Aviso de Privacidade e aceite explícito por versão.
- **Interface:** temas claro/escuro, navegação móvel, menu lateral recolhível, atalhos de retorno e botão para voltar ao topo.

O responsável gerencia o projeto, escreve e aprova contribuições. Organizadores ativos consultam; só trabalham em contribuição ou revisão quando recebem um pedido. Papéis de acesso não atribuem autoria. A exportação é exclusiva do responsável.

O cadastro público está fechado. Contas são criadas por administrador ou convite válido de projeto. Novas contas precisam confirmar o e-mail antes do login; contas anteriores à implantação dessa exigência ficam dispensadas. Trocar o e-mail exige confirmar o novo endereço. Sessões expiram em 24 horas, sem renovação automática. Rascunhos e histórico locais não sincronizam entre dispositivos.

## Tecnologias e organização

JavaScript, Next.js com **Pages Router**, React, Tiptap, PostgreSQL, `pg`, `node-pg-migrate`, React Email, Resend, Jest, ESLint e Prettier. O Node está definido em [.nvmrc](.nvmrc); versões de dependências em [package.json](package.json) e [package-lock.json](package-lock.json).

| Diretório     | Responsabilidade                                |
| ------------- | ----------------------------------------------- |
| `pages/`      | Páginas e controllers da API em `pages/api/v1/` |
| `components/` | Interface                                       |
| `models/`     | Regras de negócio e permissões                  |
| `infra/`      | Banco, migrations, e-mails e scripts            |
| `tests/`      | Testes unitários e de integração                |
| `docs/`       | Regras, operação, continuidade e pendências     |

A base nasceu dos estudos do Curso.Dev e preserva a separação entre apresentação, controllers, models e infraestrutura. Não utiliza ORM.

## Executar localmente

No Windows, use Ubuntu/WSL com Docker disponível. Na pasta do projeto:

```bash
nvm install
nvm use
npm install
npm run dev
```

`npm run dev` inicia PostgreSQL e MailCatcher, aguarda o banco, aplica migrations pendentes e inicia o Next.js em [localhost:3001](http://localhost:3001). Não instala dependências.

As configurações versionadas em `.env.development` e `.env.test` são locais. Configure segredos e credenciais remotos no ambiente apropriado.

| Recurso           | Desenvolvimento                         | Testes                                  |
| ----------------- | --------------------------------------- | --------------------------------------- |
| HTTP              | `localhost:3001`                        | `127.0.0.1:3002`                        |
| PostgreSQL        | `127.0.0.1:5433` / `trama_dev`          | `127.0.0.1:5434` / `trama_test`         |
| Projeto Compose   | `trama`                                 | `trama-test`                            |
| SMTP MailCatcher  | `127.0.0.1:1026`                        | `127.0.0.1:1027`                        |
| Caixa de e-mails  | [localhost:1081](http://localhost:1081) | [localhost:1082](http://localhost:1082) |
| Diretório Next.js | `.next`                                 | `.next-test`                            |

Desenvolvimento e testes usam MailCatcher mesmo com credenciais Resend herdadas. Para parar os serviços preservando os dados:

```bash
npm run services:stop
```

`services:down` remove containers e preserva o volume. Não use `down --volumes` se precisar conservar o banco.

## Verificações

```bash
npm run lint:prettier:check
npm run lint:eslint:check
npm test
```

`npm test` inicia os serviços e o servidor exclusivos de testes, executa Jest em sequência e encerra esse ambiente. Os testes podem recriar o schema de **trama_test**; as verificações de isolamento recusam o banco de desenvolvimento. Não altere a configuração para apontar para outro banco.

Para acompanhar os testes, use `npm run test:watch`. Para somente testes unitários, sem iniciar serviços:

```bash
NODE_OPTIONS=--experimental-vm-modules npx jest --runInBand --testPathPatterns=tests/unit
```

Os workflows de pull request em `.github/workflows/` definem testes, ESLint, Prettier e Conventional Commits. A existência dos arquivos não comprova aprovação de uma execução remota.

## Migrations e publicação

```bash
npm run migrations:create -- nome-da-migration
npm run migrations:up
```

Confirme o banco antes de aplicar migrations. Não reverta migrations automaticamente nem reutilize os containers do Curso.Dev.

Na Vercel, [vercel.json](vercel.json) define `npm run migrations:deploy && npm run build`. O runner exige `DATABASE_URL_UNPOOLED` direta e usa TLS, trava e transação. Falhas de migration interrompem o build; falha posterior de compilação não desfaz migrations concluídas. [Procedimento de deploy](docs/deployment-migrations.md).

Envio real de e-mails, ambientes remotos, comportamento da barra de formatação com teclado e seleção no smartphone físico (especialmente Safari no iPhone) e aparência do DOCX em Word/LibreOffice ainda exigem as validações do roadmap. Implementação local não significa deploy ou validação de produção.

## Documentação

- [Roadmap e pendências](docs/roadmap.md)
- [Regras editoriais](docs/editorial-rules.md)
- [E-mails e recuperação de senha](docs/email.md)
- [Migrations no deploy](docs/deployment-migrations.md)
- [Obra piloto e continuidade](docs/example-work.md)
- [Termos de Uso](docs/terms-of-use.md), [Aviso de Privacidade](docs/privacy-notice.md) e [revisão jurídica](docs/legal-review.md)
- [Ideia de escrita acadêmica](docs/academic-writing-idea.md)
- [Orientações de desenvolvimento](AGENTS.md)
