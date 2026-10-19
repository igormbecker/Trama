# Roadmap do Trama

Revisado em 19/10/2026. Este documento reúne decisões que devem continuar e **trabalho pendente**. As entregas estão resumidas no [README](../README.md); regras e operação ficam nas referências abaixo.

As tarefas concluídas foram retiradas da lista. Implementação local não significa validação de produção. Este documento não autoriza implementar todos os itens nem publicar alterações. Confira o código e [AGENTS.md](../AGENTS.md) antes de retomar.

## Decisões e referências

- Preservar JavaScript, Pages Router, controllers de API, models e infraestrutura PostgreSQL com consultas parametrizadas. Não migrar arquitetura por iniciativa própria.
- Interface em português brasileiro; arquivos e identificadores em inglês. Preservar Inter, temas de papel/carvão quente, marca Trama e créditos Bectec.
- Responsável gerencia e escreve livremente. Organizador ativo consulta; contribuição/revisão exige atribuição por capítulo. Revisão comenta uma versão fixa e emite parecer, sem alterar o capítulo. [Regras editoriais](editorial-rules.md).
- Autoria é declarada pelo responsável, inclusive para pessoas sem conta. Papéis de acesso não atribuem autoria. Exportação exclusiva do responsável.
- Cadastro público fechado; criação administrativa ou por convite não fabrica aceite legal. Sessões fixas de 24 horas, sem renovação automática.
- TDD para comportamento, mudanças focadas, bancos isolados e commits Conventional Commits em inglês. Commit, push e deploy dependem do escopo autorizado.
- O legado `D:/Projects/obras3` é referência histórica, não escopo obrigatório. Integração com PublicA está excluída.
- A obra piloto tem quatro partes e oito capítulos em [example-work.md](example-work.md) e `example-chapter-01.md` a `example-chapter-08.md`. Texto escrito em arquivo não comprova inserção no banco.

## 1. Publicação e operação

Existem configuração de migrations antes do build da Vercel e workflows de testes, ESLint, Prettier e commitlint em pull requests. As pendências tratam da execução e operação reais.

- [ ] Validar no próximo Preview as migrations, URL direta do banco, comando de build e compatibilidade com o deploy anterior; exercitar concorrência da trava. [Procedimento](deployment-migrations.md).
- [ ] Conferir estado atual de Preview/Production, variáveis, TLS e segredo de senhas. Registros anteriores de configuração não substituem verificação remota.
- [ ] Confirmar preparação inicial do banco e criação explícita do primeiro administrador por ambiente, sem promoção por nome ou e-mail.
- [ ] Validar workflows remotos e definir gates de entrega, incluindo build; não presumir proteção de branch ou deploy automático pela `main`.
- [ ] Definir backups/retenção e testar restauração.
- [ ] Revisar logs e erros sem registrar credenciais, tokens ou conteúdo sensível.

Continuidade: em 17/10/2026 foram configurados projeto Vercel `trama`, Neon `trama` (US East 2), branches independentes `production`/`preview` e variáveis por ambiente. Ambas receberam cópias iniciais de `trama_dev`, sem sessões ou reservas ativas; alterações posteriores são independentes. Backups privados ficam fora do Git. Ao copiar contas, preservar o segredo de senhas correspondente sem registrá-lo nos documentos.

As migrations até `1792320000000_create-work-credits` foram aplicadas no desenvolvimento, incluindo recuperação de senha, pedidos editoriais, comentários e créditos. A aplicação remota precisa ser conferida no próximo build. Não aplicar `down` automaticamente.

## 2. Obras, estrutura e participantes

- [ ] Definir transferência, arquivamento/exclusão de obras e efeitos sobre conteúdo, participações e créditos. Edição de título/descrição já existe.
- [ ] Definir exclusão/arquivamento de partes e capítulos, preservando histórico e relações editoriais.
- [ ] Definir prazos de entrega e alteração dos prazos; só depois classificar participações como atrasadas.
- [ ] Avaliar papéis/permissões adicionais se necessário. Organizadores ativos e atribuição por capítulo já existem; autoria não concede acesso.
- [ ] Exercitar falhas reais de rede e sessão expirada na criação de obras, estrutura e envio de convites.
- [ ] Conferir os fluxos completos de participantes/convites em tema escuro e smartphone físico.

## 3. Colaboração e acompanhamento

Contribuição por cópia, revisão por comentários, indicadores nos capítulos e Minhas participações estão implementados. O contador atualiza a cada 30 segundos, ao recuperar foco e reconectar; não é uma central de notificações ou envio de e-mail editorial.

Seu espaço também destaca até cinco pedidos de revisão/contribuição aguardando ação, com dados iniciais do servidor e atualização pelo mesmo fluxo. O painel ativo abre ao acessar o capítulo como pessoa atribuída. Comentários têm painel lateral persistente no computador e painel inferior expansível no celular, filtros e navegação entre apontamento e trecho. O responsável pode resolver/reabrir comentários, inclusive de revisões anteriores, preservando autor/data de cada ação e sem alterar texto ou parecer. Não requer migration: os metadados ficam no JSONB existente. Conferência visual no navegador e no iPhone físico permanece pendente.

- [ ] Exercitar no navegador correções, nova revisão e consulta de histórico nas duas contas.
- [ ] Testar seleção/comentários com gestos de smartphone físico, textos longos e seleções entre parágrafos.
- [ ] Exercitar falhas de rede, remoção da pessoa atribuída e troca/expiração de sessão na interface editorial. Permissões, revogação, transições, concorrência e histórico têm cobertura automatizada; preservar essa proteção.
- [ ] Evoluir painéis além dos pedidos atribuídos, se necessário: visão geral de entregas, pendências e revisões por obra.
- [ ] Definir histórico geral de atividades por obra.
- [ ] Definir notificações de atribuição, entrega, parecer e aprovação com preferências de recebimento. Convites de organizador já são enviados por e-mail.
- [ ] Avaliar mensagens, termos de participação e gestão de editoras/equipes após confirmar necessidade e prioridade.

## 4. Editor, rascunhos e versões

Referência da V1: Tiptap MIT 3.32.0, JSONB separado da descrição, limite de 1 MiB por capítulo, salvamento após 2 segundos de pausa ou a cada 15 segundos, IndexedDB por conta/capítulo e reserva por aba de 90 segundos renovada a cada 25 segundos. Revisões de gravação impedem sobrescrita. Cópias locais pendentes permanecem após logout e saem ao salvar/descartar. Sem importação, anexos ou imagens no editor.

- [ ] Validar tema escuro, smartphone físico, textos próximos do limite e colagem de Word, Pages e Google Docs.
- [ ] Exercitar queda de rede, fechamento abrupto e novo login após expiração, preservando rascunhos. Reserva expirada/recuperação já foram exercitadas; falhas e concorrência também têm testes.
- [ ] Avaliar histórico de versões além dos marcos de entrega/incorporação. Revisões por comentários já preservam sua versão de referência.
- [ ] Definir retenção de conteúdo/histórico ao arquivar obras ou excluir contas.

## 5. Exportação e créditos

PDF/DOCX incluem capa, créditos confirmados, descrição preenchida e sumário. Grupos vazios de créditos são omitidos. O histórico sugere contribuições incorporadas e revisões concluídas; o responsável confirma os nomes.

Antes do primeiro salvamento dos créditos, contribuições e revisão vêm preenchidas com sugestões do histórico, editáveis. A exportação continua usando somente créditos salvos. Após salvar, inclusive grupos deixados vazios, as escolhas são preservadas; novas sugestões podem ser adicionadas pelos botões. Autoria permanece manual.

- [ ] Conferir aparência, paginação dos créditos e atualização do sumário DOCX em Word/LibreOffice. A estrutura tem testes; antes da atualização, campos de página mostram “—”. O renderizador DOCX não está instalado neste ambiente.
- [ ] Disponibilizar PDF para tela com fundo creme `#F7F2E9` e texto `#30313A`, além de impressão branca. Validar contraste, margens e paginação. O PDF atual é branco.
- [ ] Validar exportações extensas e créditos longos nos editores finais.

## 6. Conta, segurança e preferências

- [ ] Validar entrega real pelo Resend e aparência Gmail/Outlook para recuperação e convites. Conferir restrições de destinatários em Preview e revisar o aviso de privacidade antes dos envios reais. [E-mails](email.md).
- [ ] Implementar convite administrativo com definição inicial de senha pelo destinatário. Cadastro por convite de obra não substitui esse fluxo.
- [ ] Definir confirmação de e-mail e verificação ao alterá-lo.
- [ ] Revisar limites de tentativas de login, criação de conta e recuperação. A recuperação já limita pedidos por endereço.
- [ ] Avaliar senha atual ou nova autenticação para mudanças sensíveis.
- [ ] Definir invalidação de outras sessões após troca de senha pelos formulários. A recuperação já invalida sessões.
- [ ] Avaliar encerramento de todas as sessões, consulta de dispositivos e hash dos tokens de sessão no banco.
- [ ] Persistir tema por conta e definir precedência entre conta/cookie no login, logout e troca de dispositivo.
- [ ] Paginar/buscar usuários no servidor quando o volume justificar; hoje a busca usa a lista carregada.

## 7. Documentos legais e retenção

- [ ] Concluir avaliação jurídica das minutas, contratos/transferências, atendimento e proteção de menores. [Revisão jurídica](legal-review.md), [Termos](terms-of-use.md) e [Aviso](privacy-notice.md).
- [ ] Definir prazos/rotinas de retenção e exclusão de contas, obras, comentários, créditos, logs, auditoria e backups. Aceite não substitui essa definição.
- [ ] Definir acesso operacional/retenção da auditoria de personificação; não existe painel de auditoria.
- [ ] Se o cadastro público abrir no futuro, integrar aceite explícito do próprio usuário. Essa abertura não está autorizada pelo roadmap.

Nunca editar textos legais de uma versão já aceita: criar novo arquivo/identificador e preservar o histórico. Personificação não pode aceitar por terceiros; seu acesso indireto a obras privadas precisa continuar refletido nos documentos.

## 8. Usabilidade e ideias futuras

O botão Sair fica no menu lateral, abaixo do perfil (Administrador ou Sua conta), no computador e no celular. No computador, a lateral e o controle acompanham a rolagem dentro da área autenticada usando sticky, com margem superior de 12 px e rolagem própria se os itens ultrapassarem a altura disponível. O controle fica no alto da divisória, somente com setas duplas indicando recolher/expandir; acompanha o recolhimento e permanece acessível à esquerda. No celular, permanece no canto superior esquerdo, com hambúrguer ao fechar e X ao abrir. A transição de recolhimento e a sobreposição com fundo escurecido no celular são preservadas.

O rodapé usa uma assinatura Bectec menor e links legais no mesmo tamanho do Status do sistema. Todos os botões da tela de detalhes da obra, incluindo leitura, edição, créditos, estrutura e participantes/convites, seguem o tamanho compacto no celular e no computador, com área mínima de toque de 44 px e setas de ordenação agrupadas. Conferência visual nos dois tamanhos e no iPhone físico permanece pendente.

- [ ] Validar teclado, contraste, foco, mensagens e telas pequenas nos fluxos completos, incluindo créditos e participações.
- [ ] Avaliar custo da renderização global para ler o cookie de tema antes de alterar cache/desempenho.
- [ ] Definir prioridade/escopo do [apoio à escrita acadêmica](academic-writing-idea.md), modelos, etapas e eventual uso de IA.

A identidade visual do site da Bectec é uma intenção separada. Não introduzir serviços, IA ou módulos do legado apenas porque aparecem nas referências.

## Ambiente local e continuidade

- Executar Node, npm, Git e Docker pelo Ubuntu/WSL em `/home/bectec-laptop/projects/Trama`. Conferir `.nvmrc` antes de selecionar versão.
- Desenvolvimento: HTTP 3001, PostgreSQL 5433, MailCatcher 1026/1081. Testes: HTTP 3002, banco descartável 5434, MailCatcher 1027/1082. Preservar volumes e a trava dos testes.
- Acesso doméstico: configuração local do Windows restrita à sub-rede e porta 3001, sem expor PostgreSQL. IPs podem mudar; `TRAMA_DEV_ORIGINS` define origens adicionais no desenvolvimento. Não é deploy público.
- Datas de migrations usam `pgm.func("timezone('utc', now())")`. [Deploy](deployment-migrations.md) usa conexão direta, TLS, trava e transação.
- Atualizar regras e pendências a cada entrega. Retirar tarefas concluídas sem eliminar decisões importantes ou declarar validações não executadas.
