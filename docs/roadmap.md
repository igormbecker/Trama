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
- [x] Menu autenticado com Minhas obras, Minha conta e Usuários para administradores.
- [x] Administração de usuários: listar, buscar na lista, adicionar, editar e remover.
- [x] Edição de perfil administrativo, bloqueio de exclusão da própria conta e proteção para manter ao menos um administrador.
- [x] Minha conta: editar dados pessoais e alterar a própria senha com confirmação.
- [x] Confirmação de senha também na edição administrativa.
- [x] Tema persistido em cookie do navegador. Após o login, o seletor fica em Minha conta; visitantes continuam com acesso ao seletor público.
- [x] Página de status no novo estilo, conteúdo técnico em inglês e retorno à página anterior.
- [x] Ajustes de alinhamento dos formulários e suporte aos temas claro e escuro.

Esses itens descrevem funcionalidades existentes, não uma garantia permanente de testes ou deploy. A página Minhas obras ainda é uma estrutura inicial; a prévia de capítulos da página pública é ilustrativa. Ainda não há gestão editorial real.

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

## 1. Próximo passo recomendado: obras

Entregar uma primeira fatia utilizável, do banco à interface, sem tentar construir toda a gestão editorial de uma vez.

### Decisões antes da implementação

- Quem pode criar obras: qualquer usuário autenticado ou somente administradores?
- Quem pode ver e editar uma obra? O administrador global terá acesso editorial a todas elas?
- Quais campos são obrigatórios? Sugestão inicial: título e descrição opcional, com responsável identificado pela sessão.
- Uma obra pode ser excluída ou deve ser arquivada? Como preservar seu histórico?
- A obra pertence a uma pessoa, a uma editora ou a uma organização? Há necessidade de múltiplas organizações desde o início?

A permissão global de administrador não deve ser confundida automaticamente com um papel dentro de uma obra.

### Primeira entrega proposta

- [ ] Definir o modelo mínimo e criar a migration de obras.
- [ ] Escrever testes de criação, validação, listagem e acesso a uma obra.
- [ ] Confirmar a falha esperada antes de implementar cada comportamento.
- [ ] Implementar as regras no model e os endpoints na API existente.
- [ ] Substituir o conteúdo provisório de /works por listagem real, estado vazio e ação de criar.
- [ ] Criar a tela de detalhes da obra.
- [ ] Validar os estados de carregamento, erro e sucesso e o uso em celular.
- [ ] Acrescentar edição e arquivamento ou exclusão após definir a regra.

Critério de conclusão: uma pessoa autorizada cria e abre sua obra; outra pessoa sem permissão não consegue acessá-la por interface, URL ou API. O fluxo deve preservar os dados de desenvolvimento durante os testes.

## 2. Participantes e convites

- [ ] Definir papéis por obra e uma matriz de permissões para cada ação.
- [ ] Definir se autores e organizadores precisam de cadastro próprio além da conta de acesso.
- [ ] Implementar inclusão e remoção de participantes com autorização no servidor.
- [ ] Definir convites para contas existentes e pessoas ainda não cadastradas.
- [ ] Implementar aceite, recusa, expiração e cancelamento de convites.
- [ ] Escolher o canal de convite e, se necessário, o serviço de e-mail.
- [ ] Testar acesso cruzado entre obras e revogação de participação.

Critério de conclusão: uma pessoa convidada aceita participar e recebe somente as permissões previstas para sua obra. Convites inválidos, expirados ou cancelados não concedem acesso.

## 3. Partes e capítulos

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

## Preparação para publicação e operação

Esta lista registra trabalho a verificar, não afirma que a configuração de produção foi auditada ou que esses controles já existem.

- [ ] Revisar a exposição de /api/v1/migrations: GET e POST atualmente não têm autenticação no handler. Definir execução de migrations e acesso apropriados antes da publicação.
- [ ] Conferir banco de produção, SSL, variáveis de ambiente e PASSWORD_PEPPER exclusivo, sem versionar segredos.
- [ ] Definir criação explícita do primeiro administrador em cada ambiente, sem promoção automática por e-mail, nome ou ordem de cadastro.
- [ ] Revisar limites de tentativas de login, cadastro e recuperação de senha.
- [ ] Revisar proteção das operações autenticadas, cookies e exposição dos tokens de sessão; avaliar hash dos tokens armazenados.
- [ ] Definir backup, retenção e testar restauração do banco e dos arquivos.
- [ ] Definir o que acontece com obras, autoria e histórico ao remover uma conta; a exclusão atual remove o usuário e suas sessões.
- [ ] Conferir CI existente e estabelecer verificações de formatação, análise, testes isolados e build conforme os scripts do projeto.
- [ ] Validar configurações de preview e produção na Vercel e o processo de deploy; publicação automática pela main foi informada pelo usuário.
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

> Leia AGENTS.md e docs/roadmap.md neste repositório. Confira o código e o estado do Git e vamos retomar pela primeira entrega de obras. Antes de implementar, confirme comigo as decisões de negócio ainda pendentes. Preserve a arquitetura atual e desenvolva com TDD.

Na retomada:

1. Confirmar que a cópia é /home/bectec-laptop/projects/Trama no Ubuntu/WSL.
2. Ler AGENTS.md, este roadmap e os arquivos envolvidos.
3. Conferir branch, alterações locais e histórico; consultar o remoto quando for necessário saber o que foi enviado.
4. Escolher uma entrega pequena e resolver apenas as decisões que afetam essa entrega.
5. Escrever teste, observar a falha esperada, implementar e verificar o fluxo.
6. Atualizar este documento com o que foi entregue, decisões tomadas e próximo passo.

Ao manter o roadmap, marcar como concluído somente o que estiver implementado e verificado. Registrar propostas como propostas e não transformar resultados de uma execução de testes em garantias permanentes.
