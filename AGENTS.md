# Orientações para trabalhar neste projeto

## Escopo e colaboração

Estas orientações se aplicam a todo o repositório. Respeite as instruções atuais do usuário e mantenha este documento coerente com a evolução do projeto.

- Converse em português brasileiro, explique as decisões e considere que o usuário está aprendendo e retomando a prática.
- Ao escrever código novo, mantenha os padrões atuais do projeto, incluindo nomes de variáveis, funções e demais identificadores em inglês, a arquitetura e a formatação existentes. Priorize nomes claros, fluxo explícito e soluções que o usuário consiga ler, entender e acompanhar durante o aprendizado. O inglês não é uma dificuldade para o usuário; evite minificações, compactações excessivas e abreviações que dificultem acompanhar a lógica. Expressões curtas em uma linha podem ser usadas quando continuarem claras. Refatorações no estilo preferido do agente devem ser feitas quando o usuário as solicitar explicitamente.
- Antes de editar, leia o código envolvido, confira a pasta, a branch e o estado do Git. Preserve alterações existentes do usuário.
- Faça mudanças focadas. Não introduza frameworks, dependências, refatorações amplas ou atualizações de versão sem necessidade para a tarefa.
- Desenvolva funcionalidades e correções de comportamento seguindo TDD: escreva o teste, confirme a falha esperada, implemente o necessário para passar e revise o código mantendo os testes verdes.
- Quando o pedido for apenas análise, não altere arquivos nem execute operações que modifiquem dados.
- Trabalhe autonomamente no escopo autorizado. Pergunte quando faltar uma decisão que realmente afete o resultado, sem pedir confirmação para cada passo rotineiro.
- Ao concluir, explique o que mudou, como foi verificado e o que não foi validado. Não afirme que testes ou deploy passaram sem evidência.
- Mensagens de commit deste projeto devem ser escritas em inglês e seguir o padrão definido pelo próprio projeto em commitlint.config.js, que estende @commitlint/config-conventional.
- Ao sugerir comandos de commit, apresente o comando completo no formato git commit -m ..., com a mensagem entre aspas simples; mantenha crases em torno dos nomes de ferramentas quando esse for o estilo escolhido pelo usuário.
- Quando o acesso ao projeto exigir permissões adicionais, solicite acesso de leitura ou escrita conforme necessário, informando ao usuário o motivo e mantendo o escopo limitado à tarefa.
- O usuário autorizou commits e push quando solicitar diretamente essa ação para a branch em trabalho. Antes do push, confira o diff, a mensagem do commit, a branch e o remoto; nunca faça push para `main` sem autorização específica.

## Continuidade do desenvolvimento

- Consulte docs/roadmap.md ao retomar o projeto: ele registra entregas existentes, pendências, decisões em aberto e a sequência sugerida. Confira o código antes de assumir que o retrato continua atual.
- Atualize o roadmap quando houver entregas ou decisões efetivas. Os itens propostos não constituem autorização para implementar todo o escopo ou publicar alterações.

## Ambiente de trabalho

A cópia escolhida neste notebook está no Ubuntu/WSL:

```text
/home/bectec-laptop/projects/Trama
```

- Se o acesso normal à cópia Ubuntu/WSL for negado, tente novamente com permissões elevadas e limitadas ao diretório deste projeto antes de concluir que o repositório está inacessível. Não substitua essa cópia pela cópia do Windows. Para inspeções, prefira comandos somente de leitura; para edições autorizadas, use o acesso elevado sem modificar arquivos fora do repositório.

Para abrir, primeiro no PowerShell:

```powershell
wsl -d Ubuntu
```

Depois, no Ubuntu:

```bash
cd ~/projects/Trama
code .
nvm use
npm run dev
```

- Execute Node, npm, Git e Docker pelo Ubuntu para esta cópia.
- O `.nvmrc` define `24.21.0`. Confira-o antes de selecionar a versão; trate uma atualização como uma mudança própria.
- Use `npm install` para instalar dependências conforme as anotações do usuário. `npm ci` é uma alternativa para instalação fiel ao lockfile compatível; explique a diferença quando relevante.
- Preserve o `package-lock.json`; não o regenere sem necessidade. Confira seu diff após instalar dependências.
- `npm run dev` inicia o banco com Docker Compose, aguarda a disponibilidade, aplica migrations e inicia o Next.js; não instala dependências.
- O site normalmente abre em http://localhost:3001. Ctrl+C encerra o servidor; `npm run services:stop` para o banco.
- Preserve finais de linha LF e evite alterações em massa por diferenças CRLF/LF entre Windows e Linux.

## Tecnologias e arquitetura

**Regra obrigatória: respeite sempre a arquitetura atual do projeto.** Implemente novas funcionalidades e correções dentro da estrutura existente, preservando o Pages Router, a organização MVC, a separação de responsabilidades entre páginas, handlers, models e infraestrutura e os padrões de acesso ao banco.

Não migre para outra arquitetura, reorganize camadas ou substitua padrões arquiteturais por iniciativa própria. Uma solicitação de funcionalidade ou correção não autoriza implicitamente mudanças de arquitetura. Se uma mudança arquitetural for necessária, explique o motivo e o impacto e obtenha autorização explícita do usuário antes de executá-la.

Referência da análise inicial (24/09/2026): Next.js 13.1.6, React 18.2.0, PostgreSQL 16.0 no Docker, pg 8.11.3, node-pg-migrate 6.2.2, Jest 29.6.2 e Prettier 3.8.1. Confira `package.json`, lockfile e Compose antes de assumir versões futuras.

- Linguagem: JavaScript, com JSX na interface. Não há TypeScript ou ORM na base analisada.
- Next.js com Pages Router: frontend e API no mesmo projeto. Preserve essa organização nas tarefas comuns.
- Arquitetura com intenção MVC: páginas React como apresentação, handlers de API como controllers, `models` para regras de negócio e `infra` para infraestrutura.
- `pages/index.js`: página inicial.
- `pages/api/v1/`: rotas HTTP versionadas.
- `models/`: regras de negócio de usuários, conteúdo e senhas, conforme forem implementadas.
- `infra/database.js`: conexão e consultas ao PostgreSQL pelo pacote `pg`.
- `infra/compose.yaml`: banco local no Docker.
- `infra/migrations/`: evolução versionada do esquema.
- `tests/integration/`: testes HTTP com aplicação e banco reais.
- `jsconfig.json` define a raiz para imports como `infra/database.js`.
- Use a formatação existente, com dois espaços, `.editorconfig` e Prettier. `lint:check` verifica formatação; não equivale a análise com ESLint.

## Nomes de arquivos

Use nomes de arquivos, pastas, rotas, parâmetros e identificadores em inglês em todo o projeto, incluindo componentes e folhas de estilo. Mantenha os textos apresentados na interface em português brasileiro, exceto os textos técnicos da página de status, que devem permanecer em inglês. Exemplos: `HomeLayout.js`, `HomePage.js`, `homeLayout.module.css` e `home.module.css`. Ao renomear um arquivo, atualize todos os imports e referências. O conteúdo apresentado ao usuário continua em português brasileiro.

## Padrão de strings em JavaScript

Prefira template literals (crases) com interpolação `${variavel}` ao combinar textos e valores, em vez de concatenar strings com `+`. Aplique esse padrão ao escrever ou editar código, preservando a legibilidade.

Exemplo:

```javascript
export const contactLink = `mailto:${contactEmail}?subject=Vamos%20conversar%20sobre%20um%20projeto`;
```

## Estado inicial conhecido — verificar antes de assumir

- A página inicial apresenta o produto Trama, com uma prévia ilustrativa de capítulos, fluxo editorial proposto e participantes. O conteúdo fica em `components/home/HomePage.js`, o layout em `HomeLayout.js` e os estilos em dois CSS Modules separados. Preserve a fonte Inter, a seleção de tema claro/escuro e a assinatura completa da Bectec junto ao link de status no rodapé. A preferência de tema usa o cookie trama_theme (light ou dark), válido por um ano e compartilhado entre páginas via components/theme/ThemeProvider.js, incluindo /status. pages/_app.js lê o cookie em getInitialProps e envia o tema no HTML inicial; isso desativa a otimização estática automática das páginas que a usariam. As páginas recebem Cache-Control privado sem armazenamento. Visitantes usam o seletor nas páginas públicas; após autenticar, a troca de tema fica somente em Minha conta (/account). A sincronização por usuário no banco continua sendo uma intenção futura.
- `POST /api/v1/sessions` valida e-mail/senha e cria uma sessão no PostgreSQL, vinculada ao usuário, com token aleatório de 48 bytes em hexadecimal e expiração de 24 horas. Retorna apenas `id`, `token`, `expires_at`, `created_at` e `updated_at`, sem hash de senha. Envia o cookie `trama_session_id` com `HttpOnly`, `SameSite=Lax`, `Path=/`, expiração alinhada à sessão e `Secure` em produção. O nome próprio evita colisão com cookies de outros projetos em localhost. A renovação automática não está implementada; a expiração permanece fixa em 24 horas.
- `GET /api/v1/user` valida o token do cookie e a expiração da sessão no banco, retorna somente os dados do usuário autenticado sem hash de senha e usa `Cache-Control: private, no-store`. Sessões ausentes, malformadas, desconhecidas ou expiradas retornam `401`. A consulta não renova o prazo de 24 horas. As rotas administrativas de usuários exigem uma sessão válida e permissão de administrador; status e migrations mantêm o comportamento descrito abaixo.
- `DELETE /api/v1/sessions` expira somente a sessão identificada pelo cookie `trama_session_id` e remove esse cookie. Retorna `204`, sem corpo e sem cache, inclusive quando o cookie está ausente, inválido ou expirado. Outras sessões permanecem válidas. A tela de login fica em `/login`, usa a API de sessões e redireciona para `/works`. A página `/works` valida a sessão em `getServerSideProps` e redireciona visitantes sem sessão válida para `/login`; há criação, listagem real e detalhes de obras privadas em /works e /works/[id], com acesso exclusivo ao responsável, inclusive sem acesso automático para administradores. A interface usa somente o cookie para autenticação, sem salvar o token em localStorage. O layout preserva Inter e os temas de papel e carvão quente. O cadastro pela interface fica em /register, usa POST /api/v1/users e encaminha para o login com uma confirmação; visitantes autenticados são redirecionados para /works. O cadastro valida nome, usuário (até 30 caracteres, letras ASCII, números, ponto, hífen ou sublinhado), e-mail e senha de 8 a 128 caracteres, normaliza espaços dos dados de perfil e retorna somente os dados públicos da conta. Recuperação de senha ainda não está implementada.
- A área autenticada usa `components/app/AppLayout.js`, com menu para `/works`, `/account` e, somente para administradores, `/users`. Minha conta permite editar nome, usuário e e-mail, alterar a própria senha com confirmação e escolher o tema neste navegador. A tela de usuários permite buscar, listar, adicionar, editar e remover contas; confirma a remoção e bloqueia a exclusão da própria conta.
- `users.is_admin` é booleano, com padrão `false`. O cadastro público sempre cria contas comuns. Administradores podem alterar o perfil na edição de usuários. A edição da própria conta não aceita alteração de perfil. Promoções automáticas por nome, e-mail ou ordem de cadastro em migrations são proibidas. Alterações de perfil e remoções preservam ao menos um administrador usando trava transacional.
- `GET /api/v1/users` e `GET/PATCH/DELETE /api/v1/users/[username]` são administrativos: retornam `401` sem sessão e `403` para contas comuns, não expõem hashes e não permitem cache. A edição administrativa aceita nome, usuário, e-mail, senha e is_admin booleano. PATCH /api/v1/user edita somente os dados da conta vinculada à sessão e rejeita campos privilegiados. Para trocar a senha, tanto na própria conta quanto na edição administrativa, exige password e password_confirmation coincidentes; campos vazios preservam a senha atual e a confirmação nunca é armazenada. Remover uma conta apaga suas sessões e o usuário em uma transação.
- A página pública `/status` usa o `HomeLayout` e a identidade visual compartilhada do Trama, rótulos e mensagens técnicas em inglês e atualização automática a cada 5 segundos. O link do rodapé informa a página de origem no parâmetro returnTo. O botão Voltar retorna a esse caminho interno e, na abertura direta, à página inicial; caminhos externos são recusados.
- `/api/v1/status` consulta versão do PostgreSQL, limite de conexões e conexões abertas, retornando também um horário.
- `GET /api/v1/migrations` consulta migrations pendentes; `POST` as aplica e retorna 201 se executou alguma, ou 200 quando não há pendências. Ambos exigem sessão válida e perfil de administrador e usam `Cache-Control: private, no-store`. Outros métodos retornam 405 após autenticação administrativa. A preparação inicial do banco deve ocorrer pelo comando de migrations, pois a autenticação depende das tabelas de usuários e sessões.

- Obras são persistidas na tabela `works`, com `owner_id` ligado a `users` por chave estrangeira restritiva. `models/work.js` centraliza criação e consultas autorizadas. GET/POST `/api/v1/works` e GET `/api/v1/works/[id]` exigem sessão válida e usam cache privado sem armazenamento. O título é obrigatório (até 255 caracteres), a descrição é opcional (até 5.000), títulos repetidos são permitidos e o responsável vem da sessão. O acesso a obra alheia ou inexistente retorna 404. A exclusão administrativa de uma conta responsável por obras retorna erro de validação e preserva conta, sessões e obras. Participantes, edição, transferência e arquivamento ainda não existem; personificação está planejada no roadmap para uma entrega futura.

## Banco, configurações e migrations

- O Compose roda apenas o PostgreSQL; o Next.js executa no Ubuntu.
- O banco local do Trama usa `127.0.0.1:5433`, banco `trama_dev`, usuário `trama_user` e o arquivo `.env.development`. A porta interna do PostgreSQL continua sendo `5432`.
- Centralize o acesso ao banco em `infra/database.js` e use consultas parametrizadas para valores externos.
- A implementação abre clientes individuais; não há pool de conexões na base analisada.
- Preserve a separação entre desenvolvimento e produção. O código usa SSL em produção e admite certificado por `POSTGRES_CA`.
- Nunca exponha credenciais em respostas, logs ou commits. O `.env.development` está versionado: mantenha nele apenas configurações locais apropriadas, nunca segredos de produção.
- Antes de aplicar migrations ou executar operações destrutivas, confirme o banco de destino e o escopo autorizado.
- O Compose define o projeto `trama` e o volume próprio `trama_database_data`. Não reutilize containers, volumes ou o projeto Compose `infra` do Curso.Dev. `services:down` preserva o volume; `down --volumes` apaga seus dados. Prefira `services:stop` para encerrar o uso diário.

## Testes e validação

- `npm test` e `npm run test:watch` usam `infra/scripts/run-tests.js`, que carrega `.env.test`, inicia os serviços exclusivos de testes e executa Jest em sequência. Ao encerrar, para somente os serviços de teste.
- Os testes de integração fazem chamadas a `http://127.0.0.1:3002`. Usam o projeto Compose `trama-test`, banco `trama_test`, usuário `trama_test_user` e porta PostgreSQL `5434`, definidos em `infra/compose.test.yaml` e `.env.test`. O Next.js de testes gera arquivos em `.next-test`; a aplicação de desenvolvimento continua em `3001`, banco `trama_dev` na porta `5433` e diretório `.next`.
- Os testes de migrations executam `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` somente no banco descartável `trama_test`. `infra/test-environment.js` exige a configuração isolada antes de permitir a limpeza. Nunca flexibilize essa trava para aceitar o banco de desenvolvimento ou produção.
- O Jest carrega explicitamente `.env.test`, sobrescrevendo as variáveis de conexão herdadas. O mesmo carregador é usado pelo inicializador dos serviços de teste. A conta e os dados de desenvolvimento devem ser preservados ao executar a suíte.
- O teste de status depende de valores específicos de versão, limite e quantidade de conexões; considere isso ao diagnosticar falhas.
- Faça validação proporcional à mudança. Para documentação, confira conteúdo e formatação; não rode testes que apagam o banco.
- Evite `npm run lint:fix` global em mudanças pequenas, pois pode reformatar arquivos não relacionados. Formate apenas os arquivos da tarefa quando necessário.

## Git, CI/CD e publicação

- O usuário esclareceu que o projeto ainda não está integrado à Vercel e que pretende publicá-lo somente depois de pronto e validado. O desenvolvimento e a validação seguem localmente. Não presuma deploy automático ao fazer merge na `main`; a integração e o processo de publicação serão definidos depois.
- Não faça push, merge na main sem autorização que cubra essa ação. Criar ou editar arquivos localmente não é publicar.
- Antes de alterar qualquer arquivo, inclusive documentação, crie uma branch de trabalho quando estiver na `main`. Não faça alterações diretamente na `main`.
- Use a branch de trabalho apropriada; não troque de branch nem descarte mudanças do usuário automaticamente. Para novas branches criadas pelo agente, use `codex/`, salvo orientação diferente.
- Referências `origin/*` locais podem estar desatualizadas. Diferencie comparação local de consulta recente ao remoto.
- Na análise inicial, não havia workflows GitHub Actions nem `vercel.json` versionados. Não presuma que testes, proteção de branch ou configuração de deploy estejam confirmados sem consultar evidências.
- Antes de publicar, verifique as configurações relevantes de build, variáveis, banco e validações do fluxo de entrega.

## Pontos conhecidos para considerar em tarefas futuras

Estes pontos foram observados por leitura de código; não são autorização para corrigir tudo em qualquer tarefa:

- Há chamadas a `.end()` em blocos `finally` que podem receber cliente indefinido após falha de conexão, encobrindo o erro original.
- Persistência do banco local e isolamento do banco de testes precisam ser considerados conforme o uso evoluir.
- Alguns exemplos do Notion estão defasados: status antigo com `1 + 1`, configuração antiga de SSL/Jest e o nome incorreto `POSTGRESS_PASSWORD` em um comando.
- `git commit -am` inclui mudanças em arquivos já rastreados; não depende de terem sido enviados à nuvem e não adiciona arquivos novos não rastreados.

Atualize os entendimentos deste documento quando mudanças efetivas do projeto os tornarem obsoletos. Não registre estado transitório de branch ou resultados de testes como garantias permanentes.
