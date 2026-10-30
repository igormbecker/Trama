# Orientações para trabalhar neste projeto

## Escopo e colaboração

Estas orientações se aplicam a todo o repositório. Respeite as instruções atuais do usuário e mantenha este documento coerente com a evolução do projeto.

- Converse em português brasileiro, explique as decisões e considere que o usuário está aprendendo e retomando a prática.
- Ao escrever código novo, mantenha os padrões atuais do projeto, incluindo nomes de variáveis, funções e demais identificadores em inglês, a arquitetura e a formatação existentes. Priorize nomes claros, fluxo explícito e soluções que o usuário consiga ler, entender e acompanhar durante o aprendizado. O inglês não é uma dificuldade para o usuário; evite minificações, compactações excessivas e abreviações que dificultem acompanhar a lógica. Expressões curtas em uma linha podem ser usadas quando continuarem claras. Refatorações no estilo preferido do agente devem ser feitas quando o usuário as solicitar explicitamente.
- Nos arquivos do projeto, use chaves em blocos condicionais, separe validações longas em etapas com nomes descritivos e escreva consultas SQL em template literals com cláusulas em linhas separadas, listas de colunas e atribuições alinhadas, incluindo consultas curtas e interpoladas. Comandos transacionais simples (BEGIN, COMMIT e ROLLBACK) podem permanecer em uma linha. Evite encadear acesso ao resultado de uma consulta diretamente no await quando um resultado nomeado tornar o fluxo mais claro. Preserve expressões curtas e JSX legível sem compactar fluxos complexos; não altere a configuração do Prettier para isso.
- Todos os botões de ação do sistema, inclusive os de confirmação, cancelamento e links com aparência de botão, devem apresentar um ícone relacionado à ação. Reutilize os componentes existentes de ícones e mantenha os textos e nomes acessíveis; ícones decorativos devem usar aria-hidden. Preserve os símbolos próprios dos controles de formatação e não adicione ícones visíveis às sobreposições transparentes de fechamento.
- Mantenha desenhos SVG em componentes de ícones ou de marca, com nomes descritivos, fora dos arquivos de tela e layout. Preserve geometria, cores, acessibilidade e estilos ao extraí-los; não adicione bibliotecas só para isso.
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

- Para retomar a história da obra piloto, consulte `docs/example-work.md` (continuidade, personagens, pistas e capítulos pendentes) e `docs/example-chapter-01.md` (primeiro capítulo completo). Atualize esses registros após escrever novos capítulos; não confunda títulos/descrições sugeridos com capítulos integralmente escritos ou conteúdo confirmado no banco.

- Consulte docs/roadmap.md ao retomar o projeto: ele registra entregas existentes, pendências, decisões em aberto e a sequência sugerida. Confira o código antes de assumir que o retrato continua atual.
- Atualize o roadmap quando houver entregas ou decisões efetivas. Os itens propostos não constituem autorização para implementar todo o escopo ou publicar alterações.
- O escopo e a primeira implementação da V1 de escrita estão em `docs/roadmap.md`, seção "4. Editor, rascunhos e versões": Tiptap MIT fixado em 3.32.0, sem importação/exportação, anexos ou imagens. Somente o responsável escreve, organizadores ativos leem. Conteúdo JSONB separado da descrição, até 1 MiB de JSON UTF-8 por capítulo, salvamento após 2 segundos de pausa ou a cada 15 segundos, recuperação em IndexedDB por conta/capítulo e reserva de edição por aba por 90 segundos, renovada a cada 25 segundos. Controle de revisão impede sobrescritas. Cópias locais pendentes permanecem após logout para recuperação pela mesma conta e são removidas ao salvar ou descartar. Consulte as validações pendentes antes de afirmar que a V1 está inteiramente validada.

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
- `DELETE /api/v1/sessions` expira somente a sessão identificada pelo cookie `trama_session_id` e remove esse cookie. Retorna `204`, sem corpo e sem cache, inclusive quando o cookie está ausente, inválido ou expirado. Outras sessões permanecem válidas. A tela de login fica em `/login`, usa a API de sessões e redireciona para `/home`. A página `/works` valida a sessão em `getServerSideProps` e redireciona visitantes sem sessão válida para `/login`; há criação, listagem real e detalhes de obras privadas em /works e /works/[id], com acesso ao responsável e aos organizadores que aceitaram convite e não foram removidos, sem acesso automático para administradores. A interface usa somente o cookie para autenticação, sem salvar o token em localStorage. O layout preserva Inter e os temas de papel e carvão quente. O cadastro público está fechado: POST /api/v1/users exige sessão administrativa e contas são criadas em /users. /register informa o acesso restrito; visitantes autenticados são redirecionados para /home. O cadastro valida nome, usuário (até 30 caracteres, letras ASCII, números, ponto, hífen ou sublinhado), e-mail e senha de 8 a 128 caracteres, normaliza espaços dos dados de perfil e retorna somente os dados públicos da conta. Recuperação de senha está implementada em /forgot-password e /reset-password, com POST/PATCH /api/v1/password-recovery; depende da migration e da configuração de e-mail descritas em docs/email.md.
- A área autenticada usa `components/app/AppLayout.js`, com menu para `/home` (Seu espaço), `/works`, `/account` e, somente para administradores, `/users`. Minha conta permite editar nome, usuário e e-mail, alterar a própria senha com confirmação e escolher o tema neste navegador. A tela de usuários permite buscar, listar, adicionar, editar e remover contas; confirma a remoção e bloqueia a exclusão da própria conta.
- `users.is_admin` é booleano, com padrão `false`. A criação administrativa de usuários exige administrador e sempre cria contas comuns; a exceção de cadastro por convite válido de obra também cria somente conta comum. Promoções continuam na edição administrativa. Administradores podem alterar o perfil na edição de usuários. A edição da própria conta não aceita alteração de perfil. Promoções automáticas por nome, e-mail ou ordem de cadastro em migrations são proibidas. Alterações de perfil e remoções preservam ao menos um administrador usando trava transacional.
- `GET /api/v1/users` e `GET/PATCH/DELETE /api/v1/users/[username]` são administrativos: retornam `401` sem sessão e `403` para contas comuns, não expõem hashes e não permitem cache. A edição administrativa aceita nome, usuário, e-mail, senha e is_admin booleano. PATCH /api/v1/user edita somente os dados da conta vinculada à sessão e rejeita campos privilegiados. Para trocar a senha, tanto na própria conta quanto na edição administrativa, exige password e password_confirmation coincidentes; campos vazios preservam a senha atual e a confirmação nunca é armazenada. Remover uma conta apaga suas sessões e o usuário em uma transação.
- A página pública `/status` usa o `HomeLayout` e a identidade visual compartilhada do Trama, rótulos e mensagens técnicas em inglês e atualização automática a cada 5 segundos. O link do rodapé informa a página de origem no parâmetro returnTo. O botão Voltar retorna a esse caminho interno e, na abertura direta, à página inicial; caminhos externos são recusados.
- `/api/v1/status` consulta versão do PostgreSQL, limite de conexões e conexões abertas, retornando também um horário.
- `GET /api/v1/migrations` consulta migrations pendentes; `POST` as aplica e retorna 201 se executou alguma, ou 200 quando não há pendências. Ambos exigem sessão válida e perfil de administrador e usam `Cache-Control: private, no-store`. Outros métodos retornam 405 após autenticação administrativa. A preparação inicial do banco deve ocorrer pelo comando de migrations, pois a autenticação depende das tabelas de usuários e sessões.

- Obras são persistidas na tabela `works`, com `owner_id` ligado a `users` por chave estrangeira restritiva. `models/work.js` centraliza criação e consultas autorizadas. GET/POST `/api/v1/works` e GET `/api/v1/works/[id]` exigem sessão válida e usam cache privado sem armazenamento. O título é obrigatório (até 255 caracteres), a descrição é opcional (até 5.000), títulos repetidos são permitidos e o responsável vem da sessão. O acesso a obra alheia ou inexistente retorna 404. A exclusão administrativa de uma conta responsável por obras retorna erro de validação e preserva conta, sessões e obras. Organizadores ativos também podem consultar obras e vê-las em Minhas obras; somente o responsável gerencia convites e participantes. A edição de título e descrição está disponível somente ao responsável por PATCH /api/v1/works/[id], com os mesmos limites da criação. Transferência e arquivamento ainda não existem; personificação administrativa está implementada conforme o roadmap, com sessão original preservada, permissões da conta representada e auditoria.

- Convites do MVP são para o papel `organizer`, enviados por e-mail pelo serviço transacional e válidos por sete dias. A API de criação não devolve o token; o banco guarda seu hash em `work_invitations`. A pessoa sem conta pode criar uma conta comum pelo link recebido, limitada ao e-mail convidado; isso não concede participação nem registra aceite legal. Após entrar e aceitar os documentos, responde ao convite. Aceite e recusa exigem sessão com o e-mail correspondente; a validação usa o e-mail cadastrado. Reenvio cancela o pendente anterior; uma falha de envio cancela o novo e tenta preservar o anterior. Convites expirados, cancelados, recusados ou consumidos não concedem acesso. `models/workInvitation.js` e `models/workParticipant.js` centralizam regras e transações. A remoção preenche `work_participants.removed_at`, revoga consulta e preserva registros; o responsável não pode remover a si mesmo. A interface fica nos detalhes da obra e em `/invitations/[token]`. O envio real pelo Resend ainda exige validação em preview e revisão do aviso de privacidade.

- A área autenticada inclui `/invitations` (Meus convites), com convites pendentes e válidos para o e-mail atual da conta, ações de aceitar/recusar e contador no menu. GET `/api/v1/invitations` lista sem tokens ou hashes; POST responde com `invitation_id` e `action`, validando a conta e as mesmas regras transacionais dos links. Os links existentes continuam funcionando e não são necessários para responder pela lista. O contador é atualizado ao responder, ao retornar o foco e periodicamente. A página também tem a seção Enviados, com histórico dos convites somente das obras de que a conta é responsável, incluindo aceitos, recusados, cancelados e expirados. Os detalhes da obra mostram apenas os pendentes e um link para o histórico; o botão Remover é compacto e fica ao lado do organizador.

- A estrutura editorial da obra já possui partes e capítulos em `work_parts` e `chapters`, com regras em `models/workStructure.js` e interface em `components/works/StructurePanel.js`. Somente o responsável cria, edita e ordena; organizadores ativos consultam. Partes têm título e ordem; capítulos têm título, descrição opcional e ordem dentro da parte. GET/POST/PATCH nas coleções `/api/v1/works/[id]/parts` e `/api/v1/works/[id]/parts/[partId]/chapters` listam, criam e reordenam por `{ ids }`; PATCH por identificador edita. Posições são únicas por pai e mutações usam transação com trava por obra. Atribuição de autores, prazos e arquivamento permanecem pendentes; exclusão recuperável está disponível pela lixeira.
- O título do capítulo abre `/works/[id]/chapters/[chapterId]`, com leitura formatada e edição Tiptap para o responsável. `models/chapterContent.js` centraliza consulta, reserva e salvamento; `models/chapterDocument.js` valida o esquema. GET/PUT `/api/v1/works/[id]/chapters/[chapterId]` e POST/DELETE em `/lease` usam sessão e cache privado sem armazenamento. `chapter_drafts` mantém documento, revisão e reserva; tokens de reserva só são retornados na aquisição/renovação, nunca na consulta. Salvamento exige token vigente e revisão atual em transação. Descrições existentes são preservadas, sem migração automática para o editor. A leitura completa está em /works/[id]/read, com sumário, textos salvos em ordem editorial e acesso ao responsável e organizadores ativos; não inclui descrições nem alterações locais pendentes. Exportações DOCX e PDF ficam em GET /api/v1/works/[id]/export?format=docx|pdf, somente para o responsável pela obra, inclusive pela API (404 para demais contas), com geração em memória; ambos incluem a descrição da obra preenchida após a capa e sumário de partes e capítulos. Descrições de capítulos continuam excluídas. O PDF calcula as páginas do sumário na geração, oferece links internos e incorpora Inter estática de infra/fonts/inter, com somente a marca Trama e paginação no rodapé. O DOCX inclui entradas visíveis, links e campos de página atualizáveis no Word/LibreOffice; até a atualização, as páginas aparecem como “—”. A aparência e a atualização de campos do DOCX ainda exigem validação nesse editor. A preparação editorial futura continuará dentro do Trama.

- Pedidos editoriais opcionais por capítulo ficam em `chapter_requests` e `chapter_request_events`, com regras em `models/chapterRequest.js`. O responsável atribui uma pessoa participante ativa. Contribuição usa cópia editável com reserva, revisão e recuperação próprias; entrega, ajustes e incorporação cabem ao fluxo existente, com aprovação exclusiva do responsável e preservação do texto anterior. Revisão usa uma versão fixa em leitura, comentários ancorados por trecho e parecer Aprovado ou Correções solicitadas da pessoa atribuída; nunca edita ou incorpora texto, inclusive pela API. O responsável corrige o capítulo e pode solicitar nova revisão. Comentários só podem ser adicionados/removidos antes do parecer; correções exigem ao menos um comentário. A remoção da pessoa participante revoga imediatamente o acesso, preservando o histórico. Migrations locais não significam aplicação remota nem deploy; consulte `docs/editorial-rules.md` e `docs/roadmap.md`.

## Banco, configurações e migrations

- Projetos têm tipo `literary` ou `group_assignment`, escolhido na criação; obras anteriores continuam literárias. A lista Meus projetos reúne os dois tipos com filtros. Trabalhos usam partes/seções, com títulos livres, sem ABNT, campos escolares ou modelo científico obrigatório. Reutilizar rotas `/works`, tabelas e permissões atuais; o tipo é preservado ao editar título/descrição. Os rótulos ficam em `components/works/projectLabels.js`.
- Novos trabalhos recebem estrutura inicial editável de `models/groupAssignmentStructure.js`, criada na mesma transação do projeto: Elementos textuais (Introdução, Desenvolvimento, Conclusão) e Elementos pós-textuais (Referências), com orientações nas descrições e editor vazio. Não preencher ou reorganizar projetos existentes automaticamente.
- Exclusão de projeto, parte e capítulo/seção usa lixeira recuperável (`deleted_at`), centralizada em `models/projectTrash.js`, somente pelo responsável. DELETE nas rotas existentes move para lixeira; GET/POST `/api/v1/trash` lista/restaura e `/trash` oferece a interface. DELETE `/api/v1/trash` implementa exclusão definitiva expressamente solicitada pelo usuário: somente itens já na lixeira, autorização do responsável e confirmação pelo título exato, removendo descendentes e dependências em transação com trava por obra. A interface deve informar irreversibilidade; não apagar dados reais para testar esse fluxo. Arquivos baixados, cópias locais, backups e auditoria operacional não são apagados por essa ação. Não implementar expiração automática por iniciativa própria. Bloquear descendentes em leitura, exportação, pedidos, convites e mutações enquanto o pai estiver removido. Invalidar reservas ao excluir; restaurar não revive tokens de edição. Restaurar pai não restaura filhos excluídos separadamente. Itens de estrutura restaurados vão ao final e podem ser reordenados; posições ativas ficam contínuas. Toda mutação concorrente de conteúdo/estrutura deve respeitar a trava por obra e verificar `deleted_at` dentro da transação.
- Novas contas exigem confirmação de e-mail antes do login, inclusive as criadas pelo administrador ou por convite. Contas existentes ficam dispensadas, sem inventar data de confirmação. Toda troca efetiva de e-mail exige confirmar o novo endereço e invalida links anteriores por geração. `/verify-email` e POST/PATCH `/api/v1/email-verification` usam token aleatório com hash, 24 horas, uso único e reenvio limitado; não fabricam sessão ou aceite legal. Personificação não confirma por outra pessoa. Sessões não concedem acesso a contas pendentes. Validar entrega real e ambiente antes de afirmar funcionamento remoto.
- Login mantém resposta genérica e executa bcrypt também para e-mail desconhecido. Cadastro por convite responde `202` com a mesma mensagem para conta nova/existente, sem dados da conta e sem alterar a conta existente. A administração mantém validação explícita de duplicidade. Cadastro público continua fechado. Confirmação não substitui limites contra abuso de login/IP, ainda pendentes.

- Comentários de revisão podem ser resolvidos/reabertos somente pelo responsável, inclusive em pedidos anteriores, exceto cancelados. O JSONB existente preserva conta/data e histórico de resolução; comentários com esse histórico não podem ser removidos. Resolver não muda texto, versão revisada ou parecer. A interface oferece painel lateral persistente no computador e painel inferior expansível no celular, com filtros e retorno ao trecho. `/home` destaca até cinco pedidos de revisão/contribuição aguardando ação e o painel ativo abre para a pessoa atribuída no capítulo. Conferência visual e gestos no iPhone continuam pendentes; consulte `docs/editorial-rules.md`.

- Créditos de exportação ficam em `work_credits`, com regras em `models/workCredits.js` e GET/PUT `/api/v1/works/[id]/credits`, somente para o responsável. Autoria, contribuições e revisão são confirmadas manualmente e não alteram permissões. Sugestões do histórico não são publicadas automaticamente. PDF/DOCX incluem os créditos preenchidos após a capa e antes da descrição/sumário; autoria pode incluir pessoas sem conta e nunca é inferida do responsável ou organizadores.

- `vercel.json` executa `npm run migrations:deploy && npm run build`. O script `infra/scripts/run-deploy-migrations.js` exige ambiente Vercel production/preview e `DATABASE_URL_UNPOOLED` direta do Neon, sem fallback nem carregamento de `.env.development`. Usa TLS, trava nativa com espera limitada e transação; falha impede build. Não desabilitar a trava nem aplicar `down` automaticamente. Migrations devem ser compatíveis com o deploy anterior; falha posterior no build não desfaz migrations concluídas. Consulte `docs/deployment-migrations.md` e valide o próximo deploy antes de afirmar funcionamento remoto.

- O Compose roda PostgreSQL e MailCatcher; o Next.js executa no Ubuntu. O MailCatcher local do Trama usa SMTP 1026 e painel 1081; o exclusivo de testes usa SMTP 1027 e painel 1082, todos em loopback.
- O banco local do Trama usa `127.0.0.1:5433`, banco `trama_dev`, usuário `trama_user` e o arquivo `.env.development`. A porta interna do PostgreSQL continua sendo `5432`.
- Para campos de data nas migrations, use `pgm.func("timezone('utc', now())")` como padrão de data atual. Para expiração, derive desse padrão e preserve o intervalo definido pela regra de negócio.
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

- Em 17/10/2026, o usuário decidiu preparar a publicação restrita na Vercel: página inicial e login públicos, contas criadas pelo administrador, Neon production e preview com cópias iniciais de trama_dev, mantidas independentemente depois da importação. A configuração e a validação online ainda precisam ser concluídas; consulte docs/roadmap.md antes de assumir deploy ou integração existentes. Não presuma deploy automático ao fazer merge na `main`.
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

## Página inicial autenticada

- Carregamento: `NavigationLoading` em `_app.js` acompanha início/conclusão/erro de rotas do Pages Router, com barra indeterminada e mensagem acessível, sem bloquear a tela inteira. Enquanto uma rota estiver pendente, cliques comuns em links internos são bloqueados; âncoras na página, downloads, links externos e abertura em nova aba são preservados. Não usar esse estado para atualizações periódicas em segundo plano. Ações assíncronas usam `useActionState` com `pendingRef.current` antes de iniciar, bloqueando repetições antes da renderização; liberar no `finally` ou erro conforme o fluxo. Botões de envio usam `disabled` e `aria-busy` para o spinner compartilhado; ações de painel usam `LoadingMessage`. Erros devem devolver o controle e preservar os dados digitados. Respeitar movimento reduzido. Esses controles de interface não substituem validação, transações ou idempotência no servidor.

- Seções expansíveis (`details`/`summary`), como créditos e históricos editoriais, usam título e marcador na cor `--accent`, peso 500, cursor de mão e foco visível. O padrão fica no layout compartilhado e acompanha os temas; preservar a interação nativa por teclado.

- Painéis e cartões de superfície usam `box-shadow: var(--panel-shadow)`, sombra estática difusa mais profunda no topo e à direita, definida no layout compartilhado para os dois temas. Aplicar a novos painéis equivalentes, preservando cores, bordas e espaçamento. Não aplicar indiscriminadamente a todas as divs, campos, mensagens ou linhas internas nem duplicar o efeito em contêineres aninhados. O padrão de sombra e movimento dos botões permanece independente.

- Padrão visual de botões: sombra suave e difusa no topo e à direita, elevação sutil no hover e sombra reduzida ao pressionar. O estilo global `components/shared/buttons.css`, importado em `pages/_app.js`, aplica o efeito automaticamente aos elementos `button`; links apresentados como botões devem receber `data-button`. Preserve cores por ação, foco visível, dimensões e a preferência de movimento reduzido. Use `translate` independente para não substituir transformações de posicionamento. Não duplique sombras nos CSS Modules. Áreas transparentes de sobreposição, como o fundo clicável do menu, usam `data-button-effect="none"` por não serem controles visuais. Desabilitados não têm elevação nem sombra.

- Botões destrutivos (remover, excluir e cancelar ações destrutivas) usam fundo vermelho `--danger-button-bg` e texto branco `--danger-button-text` nos dois temas. Preserve tokens específicos de botão; cores de mensagens de erro não definem a aparência dessas ações.

- A entrada após login e os links da marca para contas autenticadas levam a /home (Seu espaço). /works mantém a listagem completa e a criação. A nova página mostra o último capítulo acessado, até cinco obras recentes e um aviso de convites pendentes quando houver. O histórico guarda somente identificadores em localStorage, separado por conta e navegador; não sincroniza entre dispositivos. A lista autorizada atual filtra as obras e a API valida o capítulo antes de exibir o atalho. Continuar escrevendo usa o fluxo existente de reserva e recuperação. Falhas de armazenamento não devem bloquear a navegação.

- Padrão visual de sucesso do sistema: círculo com visto em SVG de traço fino, verde dos tokens approved e texto com peso normal (400). Use components/shared/SuccessMessage para confirmações e SuccessIcon para status embutidos, sem emojis. Não aplicar esse visual a erros, avisos, carregamento ou contadores.

- O botão “Começar a escrever” em Seu espaço usa POST `/api/v1/works/quick-drafts` e `models/quickDraft.js`: cria obra literária, Parte 1 e Capítulo sem título numa transação e abre o editor existente com `?write=1`. Somente a obra recebe data/hora no título, com instante do servidor e fuso do navegador. UUIDs estáveis por conta/tentativa e trava transacional protegem repetições enquanto a obra existir; nunca recriar filhos ausentes nem restaurar itens na lixeira por uma repetição. `quickDraftClient.js` mantém tentativa em sessionStorage por conta/aba, sem conteúdo ou autenticação, e reaproveita o destino após falha de navegação. Preservar a recuperação e as reservas existentes.

- Captura por voz usa `components/voice/VoiceCapture.js` no capítulo/contribuição e no atalho de ideia. Até 2 minutos sem contar pausas; envio explícito à Groq via POST `/api/v1/voice-transcriptions`, sessão/aceite atuais e chave `GROQ_API_KEY` somente no servidor. A prévia é editável, sem segunda chamada de reescrita. Áudio concluído/prévia ficam em IndexedDB por conta/destino até aplicar/descartar, inclusive após logout; o servidor não os persiste. `voice_transcription_attempts` registra conta/horário/segundos com trava: até 30 minutos por conta em 24 horas, reserva inicial de 120 segundos e acerto pela duração da Groq (mínimo 10 segundos). Falhas sem duração confiável preservam a reserva; proteções globais de frequência continuam separadas. Ideias usam `initial_document` validado e salvo na transação de quick-drafts, sem sobrescrita nas repetições. Não colocar a chave em `.env.development`, que é versionado; usar arquivo local ignorado. Validar transcrição real, smartphone, migrations e privacidade antes de afirmar funcionamento remoto. Consulte `docs/voice-capture.md`.

## Personificação administrativa

- Administradores podem personificar somente contas comuns por até 15 minutos, limitados pela sessão original de 24 horas, pela ação Personificar em Usuários e GET/POST/DELETE `/api/v1/impersonation`. A sessão conserva o administrador em `user_id` e registra a conta representada separadamente, sem emitir token para essa conta. O modo afeta todas as abas da mesma sessão; outros logins permanecem independentes.
- As operações usam a identidade e permissões da conta representada, sempre sem perfil administrativo. Edição de conta, senha, funções administrativas e personificação encadeada são bloqueadas. O aviso global permite encerrar; a mudança recarrega a página para descartar estado React/SWR anterior. Salvar trabalho antes de iniciar ou encerrar.
- Expiração ou exclusão da conta representada bloqueiam o modo; não restauram automaticamente privilégios do administrador. Encerrar exige sessão original válida e perfil administrativo atual; após perda desses requisitos, sair e autenticar novamente. Não usar FK com SET NULL na conta representada, pois sua exclusão não pode restaurar acesso administrativo.
- `impersonation_audit` registra atores, sessão, prazo, eventos e metadados de alterações/exportações, sem corpos, senhas, cookies ou conteúdo. Início e encerramento explícitos são transacionais; tentativas são gravadas antes da operação e resultados depois, correlacionados por identificador. Falha na gravação do resultado deixa a tentativa e erro operacional, sem comprovar conclusão. Não há painel de auditoria nem evento agendado de término por expiração. Retenção e acessos à auditoria exigem definição antes da publicação das minutas.
- A personificação permite acesso administrativo indireto a obras privadas; manter Termos e Aviso coerentes com isso. Históricos e rascunhos locais da conta representada seguem as regras de persistência por conta e navegador.

## Documentos e aceite legal

- A base de e-mails está em `infra/email.js` e os templates React Email em `models/transactional/index.js`. Resend exige `VERCEL_ENV=production|preview`, `RESEND_API_KEY` e `EMAIL_FROM`; preview também exige o destinatário em `EMAIL_PREVIEW_RECIPIENTS`. `NODE_ENV=development|test` sempre usa MailCatcher isolado, mesmo com chaves herdadas. Não há endpoint genérico de disparo. Recuperação, confirmação de e-mail e convites de projeto estão conectados; convite administrativo com definição inicial de senha permanece pendente. A recuperação usa token aleatório de 48 bytes, hash SHA-256, expiração de 15 minutos, confirmação e senha de 8–128 caracteres; consome os links e encerra sessões em transação, sem fabricar aceite ou autenticar automaticamente. Pedidos são limitados por endereço e têm resposta genérica, com envio mantido por waitUntil. O token viaja no fragmento da página e no corpo do PATCH, nunca em logs ou query string. Consulte `docs/email.md`; não registrar chaves, links privados ou conteúdo em logs e aguardar o envio nos futuros handlers.

- `/terms`, `/privacy` e `/legal/support` são públicos. `/legal/accept` exige sessão, mas fica acessível sem aceite. O cadastro público permanece fechado; a criação administrativa nunca fabrica aceite.
- `models/legalAcceptance.js` exige a versão ativa antes de liberar operações autenticadas. Páginas redirecionam pendências; APIs retornam `LegalAcceptanceRequiredError` (403). GET da própria conta, registro/consulta de aceite, documentos, contato, status, login/logout e encerramento de personificação mantêm os caminhos necessários. Não ampliar exceções a operações de obras ou administração.
- `infra/legal/2026-10-18-v1.json` contém a versão ativa. Nunca editar texto de versão já aceita: criar arquivo e identificador novos. O primeiro aceite arquiva textos e hashes SHA-256 em `legal_document_releases` e conta/data/versão em `legal_acceptances`, em transação; repetição mantém a primeira data. Não registrar IP/dispositivo como prova sem nova justificativa.
- Personificação não pode aceitar documentos por outra pessoa; iniciar exige aceite atual do administrador e da conta representada. GET do aceite informa esse modo e a tela impede ação por terceiros.
- Os fixtures de `tests/orchestrator.js` são aceitos por padrão somente para testes; `skipLegalAcceptance` cria cenários pendentes. Não reproduzir esse comportamento na criação real de usuários.
- O usuário forneceu CNPJ/endereço e confirmou Vercel/Neon e participação de responsável para menores. Não há verificação automática de idade/autorização parental. Prazos e rotinas de retenção/exclusão de logs e backups continuam pendentes, por decisão do usuário; o aviso não promete prazos inexistentes. Consulte `docs/legal-review.md` antes de alterar textos ou afirmar conformidade.
