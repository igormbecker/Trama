# Roadmap do Trama

Referência revisada em 16/10/2026. Este documento registra o estado observado, as pendências e uma sequência sugerida para continuar o desenvolvimento. Deve ser atualizado conforme as entregas e decisões acontecerem.

O roadmap não autoriza implementar todos os itens de uma vez nem publicar alterações. As etapas editoriais são propostas até que suas regras sejam validadas com o usuário. Antes de retomar, confira o código e as instruções de AGENTS.md; eles podem ter evoluído depois desta revisão.

## Objetivo e referências

O Trama é uma aplicação de gestão editorial colaborativa: organizar obras, pessoas, capítulos, entregas e revisões até a aprovação.

A base técnica segue o Curso.Dev: JavaScript, Next.js com Pages Router, handlers de API, models para regras de negócio, PostgreSQL com pg e migrations. Preserve essa arquitetura e desenvolva comportamentos com TDD.

O sistema Obras, em D:/Projects/obras3, serve como referência de funcionalidades e regras, sem alterar seu código. O documento original docs/trama-contexto.md dessa referência foi consultado para este planejamento; suas descrições de implementação ainda não iniciada são históricas. As funcionalidades do legado são candidatas, não um escopo fechado. A integração com PublicA foi explicitamente excluída do Trama.

## O que já está implementado

- [x] Ambiente local separado do Curso.Dev: aplicação na porta 3001 e PostgreSQL de desenvolvimento na 5433, com projeto Compose e volume próprios.
- [x] Testes isolados: aplicação na 3002, PostgreSQL na 5434 e banco descartável exclusivo, com trava contra limpeza do banco de desenvolvimento.
- [x] Página inicial do produto, fonte Inter, temas de papel e carvão quente e assinatura Bectec no rodapé.
- [x] Cadastro público, login e logout, com validações e senhas armazenadas como hash.
- [x] Sessões no PostgreSQL, cookie de autenticação HttpOnly e expiração fixa de 24 horas.
- [x] Proteção das páginas autenticadas e das APIs administrativas.
- [x] API de migrations protegida: GET e POST exigem sessão válida e administrador, sem cache. A preparação inicial do banco é feita pelo comando de migrations.
- [x] Menu autenticado com Minhas obras, Minha conta e Usuários para administradores.
- [x] Primeira versão de obras: criar, listar e abrir obras privadas e bloquear exclusão de contas responsáveis por obras.
- [x] Participantes e convites do MVP: responsável convida organizadores por link, com aceite pelo e-mail correspondente e acesso de consulta revogável.
- [x] Administração de usuários: listar, buscar na lista, adicionar, editar e remover.
- [x] Edição de perfil administrativo, bloqueio de exclusão da própria conta e proteção para manter ao menos um administrador.
- [x] Minha conta: editar dados pessoais e alterar a própria senha com confirmação.
- [x] Confirmação de senha também na edição administrativa.
- [x] Tema persistido em cookie do navegador. Após o login, o seletor fica em Minha conta; visitantes continuam com acesso ao seletor público.
- [x] Página de status no novo estilo, conteúdo técnico em inglês e retorno à página anterior.
- [x] Ajustes de alinhamento dos formulários e suporte aos temas claro e escuro.

Esses itens descrevem funcionalidades existentes, não uma garantia permanente de testes ou deploy. A página Minhas obras já permite criar, listar e abrir obras próprias. A prévia de capítulos da página pública continua ilustrativa; capítulos e o fluxo editorial ainda não foram implementados. Organizadores aceitos já podem consultar as obras das quais participam.

## Sequência sugerida

| Ordem    | Entrega                     | Resultado esperado                                   |
| -------- | --------------------------- | ---------------------------------------------------- |
| 1        | Primeira versão de obras    | Criar, listar e abrir uma obra com acesso controlado |
| 2        | Participantes e convites    | Vincular pessoas à obra e definir suas permissões    |
| 3        | Partes e capítulos          | Estruturar o conteúdo e atribuir responsáveis        |
| 4        | Entregas e versões          | Receber arquivos com histórico e acesso autorizado   |
| 5        | Revisão e aprovação         | Executar um fluxo editorial rastreável               |
| 6        | Tarefas e acompanhamento    | Mostrar pendências, responsáveis e prazos reais      |
| Contínua | Qualidade, conta e operação | Preparar o produto para uso e publicação seguros     |

A ordem pode ser ajustada após definir as regras. Preparação de produção e recuperação de conta devem ser tratadas antes de abrir o sistema a usuários reais, conforme a forma de lançamento.

## 1. Primeira versão de obras

Entregar uma primeira fatia utilizável, do banco à interface, sem tentar construir toda a gestão editorial de uma vez.

### Decisões confirmadas em 16/10/2026

- Qualquer usuário autenticado poderá criar sua própria obra.
- Cada obra terá um único responsável principal, inicialmente a pessoa que a criou, identificada pela sessão.
- Na primeira entrega, as obras serão privadas e somente o responsável terá acesso direto à listagem e aos detalhes de suas obras.
- O administrador global não terá acesso editorial direto automático a todas as obras. Essa permissão poderá ser revista futuramente, preservando a distinção entre administração do sistema e responsabilidade pela obra.
- Outros participantes poderão colaborar na gestão conforme seus papéis, a definir na entrega de participantes.
- A personificação de usuários para suporte foi aceita como entrega futura, separada da primeira versão de obras. Ela permitirá acesso administrativo indireto às obras privadas, usando as permissões do usuário representado.

- O título será obrigatório, com até 255 caracteres; a descrição será opcional, com até 5.000 caracteres. Títulos repetidos serão permitidos.
- A exclusão de uma conta será bloqueada enquanto ela for responsável por obras, preservando os dados.

### Detalhes para entregas posteriores

- Confirmar o vínculo inicial apenas à pessoa responsável, deixando editora e organizações para depois.
- Definir edição, transferência de responsabilidade, arquivamento, restauração e eventual exclusão em entregas posteriores.

A permissão global de administrador não deve ser confundida automaticamente com um papel dentro de uma obra. As regras de autorização devem ficar no servidor, nos models, e ser cobertas por testes.

### Primeira entrega proposta

- [x] Definir o modelo mínimo e criar a migration de obras.
- [x] Escrever testes de criação, validação, listagem e acesso a uma obra.
- [x] Confirmar a falha esperada antes de implementar cada comportamento.
- [x] Implementar as regras no model e os endpoints na API existente.
- [x] Substituir o conteúdo provisório de /works por listagem real, estado vazio e ação de criar.
- [x] Criar a tela de detalhes da obra.
- [x] Conferir estado vazio, envio em andamento, sucesso, listagem e detalhes no navegador, incluindo o formulário em largura de celular.
- [ ] Exercitar falhas de rede e sessão expirada durante o envio pela interface; o servidor já tem cobertura para sessões inválidas e dados inválidos.
- [ ] Acrescentar edição e arquivamento ou exclusão após definir a regra.

Critério de conclusão: uma pessoa autorizada cria e abre sua obra; outra pessoa sem permissão não consegue acessá-la por interface, URL ou API. O fluxo deve preservar os dados de desenvolvimento durante os testes.

Implementação: tabela `works`, model `models/work.js`, GET/POST `/api/v1/works`, GET `/api/v1/works/[id]` e páginas `/works` e `/works/[id]`. O responsável vem da sessão, campos adicionais são rejeitados, descrições omitidas viram texto vazio e títulos/descrições têm espaços externos removidos. A listagem usa criação mais recente primeiro, com desempate por identificador. Acesso a obra alheia, inexistente ou com identificador inválido retorna 404. A chave estrangeira impede remover um responsável; a remoção administrativa também valida essa regra em transação e retorna erro compreensível.

A migration foi executada somente no banco de testes nesta entrega. A aplicação do esquema em desenvolvimento continua pelo fluxo habitual de `npm run dev`. A etapa seguinte de participantes e convites está descrita abaixo.

## 2. Participantes e convites

### Regras confirmadas para o MVP

- Manter simples: apenas responsável e organizador nesta entrega; autores, revisores e permissões sobre capítulos serão definidos quando esses módulos existirem.
- Somente o responsável convida, gerencia participantes e cancela convites. O organizador tem acesso de consulta à obra e não gerencia convites nem participantes. Administradores globais continuam sem acesso editorial automático.
- Convites por e-mail, inclusive para pessoas ainda sem cadastro, compartilhados por link; nenhum e-mail é enviado automaticamente.
- O aceite ou a recusa exige sessão de uma conta com o mesmo e-mail do convite, comparado sem diferenciar maiúsculas e minúsculas. Convites pendentes não concedem acesso.
- Validade de sete dias. Reenviar para o mesmo e-mail cancela o convite pendente anterior. Convites expirados, recusados, cancelados ou já aceitos não podem ser usados para obter acesso.
- Remover um organizador revoga o acesso e preserva o registro de participação e os convites. O responsável não pode remover a si mesmo. Um participante removido só volta por novo convite e novo aceite.

### Entrega implementada

- [x] Página `/invitations` (Meus convites) no menu da conta, com contador de pendentes, título da obra, papel, validade, aceite e recusa em vermelho. A lista usa o e-mail atual da conta e exibe somente convites pendentes e válidos; sair da página não exige recuperar o link. Aceitar abre a obra e recusar remove o item da lista. Listagem, isolamento por conta, consumo único entre lista e link, concorrência, estado vazio, navegação, temas e largura de celular foram verificados no ambiente isolado de testes.
- [x] Criar migrations de participantes e convites com chaves estrangeiras, unicidade de participação por obra/conta e apenas um convite pendente por obra/e-mail.
- [x] Implementar criação, listagem e cancelamento de convites, com validação de responsável no model.
- [x] Adicionar botão de cópia por ícone com nome acessível e tooltip, confirmação de sucesso e alternativa por seleção para acesso pelo IP em HTTP. Falhas oferecem orientação para cópia manual. Cópia e permanência do link foram verificadas no navegador pelo IP do WSL.
- [x] Destacar o cancelamento de convites em vermelho e preservar a marca original Trama no rodapé, com o símbolo de elos à direita da frase “Pessoas, ideias e capítulos. Uma obra construída em conjunto.”.
- [x] Implementar consulta, aceite e recusa de convite com e-mail correspondente, expiração e consumo único.
- [x] Listar organizadores e permitir remoção com confirmação na interface, sem apagar a participação do banco.
- [x] Incluir obras com participação ativa em Minhas obras e autorizar seus detalhes; remover o acesso após a revogação.
- [x] Cobrir com testes convites antes do cadastro, reenvio, expiração, recusas, cancelamentos, isolamento, remoção e aceites concorrentes.
- [x] Conferir no navegador geração de link, cadastro posterior, aceite, listagem e detalhes para organizador, remoção e acesso negado após remoção.
- [ ] Conferir visualmente os novos controles no tema escuro e em celular e simular falhas de rede durante o envio.
- [ ] Enviar convites por e-mail automaticamente, somente quando essa integração for necessária e escolhida.

Implementação: `models/workInvitation.js`, `models/workParticipant.js`, tabela `work_invitations` e tabela `work_participants`. As rotas de gestão ficam em `/api/v1/works/[id]/invitations` e `/api/v1/works/[id]/participants`, com rotas de cancelamento/remoção por identificador. GET/POST `/api/v1/invitations/[token]` consultam e respondem ao convite. Todos os endpoints exigem sessão e usam cache privado sem armazenamento. A página `/invitations/[token]` orienta visitantes a entrar ou se cadastrar e reabrir o link; somente a conta correspondente vê o título da obra e as ações de resposta.

O token aleatório é retornado somente na criação; o banco guarda seu hash SHA-256. Para compartilhar novamente, o responsável gera um novo convite, invalidando o pendente anterior. Páginas e APIs de convite usam `Referrer-Policy: no-referrer`. Mutações de convites e participantes usam transações e trava por obra; o aceite revalida o convite dentro da transação para evitar consumo duplicado. A remoção registra `removed_at`; a exclusão de uma conta participante preserva a linha com `user_id` nulo. Não há exclusão de contribuições nessa operação; o módulo de conteúdo ainda não existe e sua retenção deve ser definida quando for implementado.

As migrations desta etapa foram aplicadas somente no banco de testes. Para desenvolvimento, o fluxo habitual de `npm run dev` aplica as pendentes. A verificação de e-mail das contas continua como pendência antes da publicação; esta entrega compara o e-mail cadastrado e não implementa confirmação de posse do endereço.

Próximo passo recomendado: validar a entrega com o usuário e definir a estrutura de partes e capítulos e as permissões do organizador antes de implementar o próximo módulo.

## 3. Partes e capítulos

Referência criativa para a obra piloto: [Memórias do Futuro e seus quatro capítulos](example-work.md), ideia que o usuário pediu para preservar.

- [ ] Validar a necessidade de partes/seções e sua relação com os capítulos.
- [ ] Criar, listar, editar e ordenar capítulos dentro da obra.
- [ ] Associar autores, organizadores e revisores conforme os papéis definidos.
- [ ] Definir os estados iniciais e as transições permitidas.
- [ ] Definir prazos e regras de alteração ou remoção de capítulos com histórico.
- [ ] Testar permissões tanto na obra quanto no capítulo.

O legado possui estados como configuração, espera por convites, entrega, revisão, aprovação, aprovação com restrições e atualização. Revisar suas regras antes de reutilizá-los; os nomes da prévia pública não definem uma máquina de estados pronta.

Critério de conclusão: uma obra apresenta sua estrutura real e cada participante entende em quais capítulos atua e quais ações pode realizar.

## 4. Entregas, arquivos e versões

- [ ] Definir formatos, tamanhos, quantidade de arquivos e regras de substituição.
- [ ] Escolher armazenamento e configurar ambientes separados.
- [ ] Implementar envio e download autorizados, sem expor arquivos por URLs públicas permanentes sem uma decisão explícita.
- [ ] Registrar versão, responsável e data de cada entrega.
- [ ] Preservar versões anteriores e vincular a revisão à versão correta.
- [ ] Definir retenção e remoção dos arquivos ao arquivar obras ou excluir contas.
- [ ] Testar falhas de envio e consistência entre banco e armazenamento.

Critério de conclusão: um autor envia uma nova versão, as anteriores permanecem identificáveis e somente pessoas autorizadas podem consultar os arquivos.

## 5. Revisão, comentários e aprovação

- [ ] Validar quem pode iniciar revisão, solicitar ajustes e aprovar.
- [ ] Implementar comentários e apontamentos vinculados ao capítulo e à versão.
- [ ] Definir aprovação, aprovação com restrições e reabertura após ajustes.
- [ ] Impedir transições incompatíveis no servidor.
- [ ] Registrar autor, data e motivo das mudanças relevantes.
- [ ] Testar concorrência e preservação do histórico.

Critério de conclusão: executar com uma obra piloto o fluxo criar obra → adicionar capítulo → convidar autor → enviar arquivo → revisar → aprovar. Usar a experiência desse piloto para ajustar as regras antes de ampliar o produto.

## 6. Tarefas, painéis e comunicação

Itens candidatos após o fluxo editorial básico funcionar:

- [ ] Tarefas com responsável, prazo e situação.
- [ ] Painéis com capítulos pendentes, entregas e revisões reais.
- [ ] Histórico de atividades por obra.
- [ ] Notificações de convite, entrega, revisão e aprovação, com preferência de recebimento.
- [ ] Mensagens e termos de participação, se confirmada a necessidade.
- [ ] Gestão de editoras e equipes, se o modelo de negócio exigir.

Não criar todos esses módulos apenas porque existem no legado. Validar a necessidade e a prioridade de cada um.

## Ideias futuras — escrita acadêmica

Proposta da esposa do usuário: apoiar a construção individual ou colaborativa de artigos, resumos e resumos expandidos para congressos e simpósios, com modelos e orientações por etapa. Detalhes e decisões em aberto estão em [Apoio à escrita acadêmica](academic-writing-idea.md). A ideia foi registrada para não se perder; prioridade, editor de texto e uso de IA ainda não foram definidos.

## Acesso local pela rede doméstica

O acesso ao desenvolvimento pela rede foi solicitado para testar convites em outro aparelho. O encaminhamento da porta 3001 e a regra restrita à sub-rede doméstica são configurações locais do Windows; o PostgreSQL não foi liberado. Os IPs podem mudar ao reiniciar e exigir atualização. `TRAMA_DEV_ORIGINS` define os hosts adicionais permitidos pelo Next.js em desenvolvimento, separados por vírgula; sem a variável, nenhum host adicional é permitido. A configuração local atual usa o IP Wi-Fi do notebook. Esse acesso não constitui deploy na internet.

## Padrão de datas nas migrations

Usar `pgm.func("timezone('utc', now())")` nos defaults de data atual, conforme preferência confirmada pelo usuário. A migration nova de participantes e convites segue esse padrão, incluindo o intervalo de sete dias na expiração dos convites. Uma migration adicional altera apenas os defaults de `sessions.created_at` e `sessions.updated_at`, preservando os valores existentes e a migration histórica. A expiração das sessões continua calculada pelo model, fixa em 24 horas. Essas migrations foram validadas no banco de testes; sua aplicação no desenvolvimento ocorre pelo fluxo habitual de migrations.

## Pendências de conta e preferências

- [ ] Recuperação de senha: fluxo de e-mail e tokens com expiração e uso único.
- [ ] Definir confirmação de e-mail e verificação ao alterar o endereço.
- [ ] Avaliar exigência de senha atual ou nova autenticação para mudanças sensíveis.
- [ ] Definir invalidação de outras sessões após troca ou recuperação de senha.
- [ ] Avaliar encerramento de todas as sessões e consulta de dispositivos.
- [ ] Persistir a preferência de tema por usuário no banco, desejo já informado pelo usuário.
- [ ] Definir a precedência entre preferência da conta e cookie, incluindo login em outro dispositivo e logout.
- [ ] Paginar e buscar usuários no servidor quando a quantidade de contas exigir; hoje a busca ocorre sobre a lista carregada.

A sessão atual expira em 24 horas sem renovação automática. Não alterar essa decisão silenciosamente. A preferência de tema atual é do navegador, não da conta; a futura persistência pode sincronizar no login sem consultar o banco a cada navegação.

## Personificação de usuários para suporte — entrega futura

Permitir que administradores reproduzam problemas navegando com as permissões de outro usuário, sem conhecer sua senha. A implementação não faz parte da primeira entrega de obras.

Direção proposta para detalhar antes da implementação:

- [ ] Restringir o início da personificação a administradores e definir quais contas podem ser representadas.
- [ ] Preservar a identidade do administrador e a do usuário representado na sessão e na auditoria.
- [ ] Exibir aviso permanente com o usuário representado e uma ação para encerrar e retornar à conta administrativa.
- [ ] Aplicar as permissões do usuário representado, sem herdar privilégios administrativos durante a personificação.
- [ ] Registrar início, encerramento e alterações relevantes com o administrador que executou a ação.
- [ ] Bloquear troca de senha, alteração de perfil administrativo e personificação encadeada nesse modo.
- [ ] Definir prazo curto, encerramento e revogação do acesso.
- [ ] Testar autorização, expiração, retorno à conta administrativa e identificação correta das ações.

Esse recurso permite acesso administrativo indireto ao conteúdo privado e deverá ser comunicado como regra do produto. Ele ajuda a reproduzir problemas de dados e permissões; não reproduz necessariamente o navegador ou dispositivo do usuário.

## Preparação para publicação e operação

O usuário esclareceu em 16/10/2026 que o projeto ainda não está integrado à Vercel e que pretende disponibilizá-lo na internet somente depois de pronto e validado. Até lá, o desenvolvimento e a validação seguem localmente.

Esta lista registra trabalho a verificar, não afirma que a configuração de produção foi auditada ou que esses controles já existem.

- [ ] Definir o procedimento operacional de migrations em produção e de preparação inicial do banco. GET e POST de /api/v1/migrations já exigem sessão válida e administrador; a autenticação depende das tabelas existentes.
- [ ] Conferir banco de produção, SSL, variáveis de ambiente e PASSWORD_PEPPER exclusivo, sem versionar segredos.
- [ ] Definir criação explícita do primeiro administrador em cada ambiente, sem promoção automática por e-mail, nome ou ordem de cadastro.
- [ ] Revisar limites de tentativas de login, cadastro e recuperação de senha.
- [ ] Revisar proteção das operações autenticadas, cookies e exposição dos tokens de sessão; avaliar hash dos tokens armazenados.
- [ ] Definir backup, retenção e testar restauração do banco e dos arquivos.
- [x] Bloquear a exclusão de contas responsáveis por obras.
- [ ] Definir o que acontece com participações, autoria e histórico ao remover uma conta depois que esses módulos existirem.
- [ ] Conferir CI existente e estabelecer verificações de formatação, análise, testes isolados e build conforme os scripts do projeto.
- [ ] Quando chegar a etapa de publicação, configurar a integração com a Vercel e validar preview, produção e o processo de deploy; atualmente não há integração confirmada nem deploy automático pela main.
- [ ] Revisar logs e tratamento de erros para apoiar diagnóstico sem registrar credenciais ou conteúdo sensível.
- [ ] Validar navegação por teclado, contraste, mensagens de erro e telas pequenas nos fluxos completos.
- [ ] Avaliar o custo da renderização global usada para ler o cookie de tema antes de otimizar cache ou desempenho.
- [ ] Atualizar a apresentação do README e metadados que ainda descrevem o projeto como template.

Melhorias de infraestrutura, como pool de conexões, devem atender a uma necessidade demonstrada. Não fazem parte de uma troca de arquitetura autorizada por este roadmap.

## Decisões e preferências que devem continuar

- Código, arquivos, pastas e rotas em inglês; interface em português brasileiro, com detalhes técnicos da página de status em inglês.
- Manter a fonte Inter, o conforto de leitura dos temas aprovados e a assinatura Bectec.
- Usar TDD para funcionalidades e correções de comportamento; documentação exige revisão de conteúdo e formatação.
- Preservar o isolamento dos bancos de desenvolvimento e testes.
- Não introduzir PublicA nem copiar segredos ou configurações de produção do legado.
- Não migrar o Pages Router ou alterar a arquitetura sem autorização explícita.
- Commits em inglês, no padrão Conventional Commits do projeto.
- Commit e push dependem de solicitação; escrever o roadmap não autoriza publicar na main.

O usuário também deseja aplicar essa identidade visual ao site da Bectec no futuro. Isso é uma tarefa separada, fora do desenvolvimento atual do Trama.

## Como continuar em outro chat

Mensagem sugerida:

> Leia AGENTS.md e docs/roadmap.md neste repositório. Confira o código e o estado do Git e vamos retomar pela estrutura de partes e capítulos. Antes de implementar, confirme comigo as regras de estrutura e as permissões editoriais ainda pendentes. Preserve a arquitetura atual e desenvolva com TDD.

Na retomada:

1. Confirmar que a cópia é /home/bectec-laptop/projects/Trama no Ubuntu/WSL.
2. Ler AGENTS.md, este roadmap e os arquivos envolvidos.
3. Conferir branch, alterações locais e histórico; consultar o remoto quando for necessário saber o que foi enviado.
4. Escolher uma entrega pequena e resolver apenas as decisões que afetam essa entrega.
5. Escrever teste, observar a falha esperada, implementar e verificar o fluxo.
6. Atualizar este documento com o que foi entregue, decisões tomadas e próximo passo.

Ao manter o roadmap, marcar como concluído somente o que estiver implementado e verificado. Registrar propostas como propostas e não transformar resultados de uma execução de testes em garantias permanentes.

## Padrão visual de ações negativas

Botões de recusar, cancelar e remover usam a cor vermelha do tema, incluindo a recusa de convites, a gestão de participantes e os cancelamentos na administração de usuários. Ações de voltar preservam seu estilo atual.
