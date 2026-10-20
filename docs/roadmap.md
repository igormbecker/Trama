# Roadmap do Trama

Revisado em 20/10/2026. Este documento reúne decisões que devem continuar e **trabalho pendente**. As entregas estão resumidas no [README](../README.md); regras e operação ficam nas referências abaixo.

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

Projetos podem ser obras literárias (`literary`) ou trabalhos em grupo (`group_assignment`), escolhidos na criação. Registros anteriores continuam literários. A lista Meus projetos tem filtros por tipo. Novos trabalhos recebem duas partes: Elementos textuais, com Introdução, Desenvolvimento e Conclusão; e Elementos pós-textuais, com Referências. As descrições orientam o preenchimento e o editor começa vazio. A estrutura é livre para editar, acrescentar, reordenar e excluir; trabalhos existentes não são modificados. Reutiliza rotas, tabelas, permissões, pedidos editoriais e exportações. Não há tipo científico próprio, ABNT, modelo obrigatório ou campos escolares; uma evolução científica exige definição própria. O tipo não é alterado pela edição de título/descrição.

O responsável pode mover projetos, partes e capítulos/seções para a lixeira, com confirmação na interface. A lixeira fica em `/trash`, acessível na listagem e nos detalhes. O conteúdo permanece no banco com `deleted_at` até a restauração ou exclusão definitiva; não há expiração automática. Excluir para sempre exige digitar o título exato e só aceita itens já na lixeira. DELETE `/api/v1/trash` remove o item e seus descendentes, rascunhos salvos e históricos editoriais em uma transação com trava por obra. Remover um projeto também apaga participações, convites e créditos do projeto, preservando as contas das pessoas. Não há restauração pela interface após essa operação. Arquivos exportados, cópias locais nos navegadores, auditoria operacional e backups seguem suas políticas próprias e não são apagados por essa ação. Itens removidos e seus descendentes ficam indisponíveis na leitura, exportação, convites, pedidos e salvamento. Reservas de edição próprias e de contribuição são invalidadas; após restaurar é necessário obter outra reserva. Rascunhos locais seguem a política de recuperação existente. Restaurar um pai preserva a situação dos filhos excluídos separadamente: primeiro restaura-se projeto/parte, depois esses filhos. Partes e capítulos restaurados retornam ao final da lista, com posições ativas contínuas e reordenação disponível. Créditos salvos manualmente permanecem como estavam; sugestões do histórico ignoram itens na lixeira. Organizadores e administradores sem responsabilidade não gerenciam a lixeira. Participações e convites são preservados; ao restaurar, o acesso segue as permissões e a validade atuais.

- [ ] Conferir os dois tipos no navegador e smartphone, incluindo filtros, seções, contribuições e exportação nos editores finais.

- [ ] Definir transferência e eventual arquivamento de obras e efeitos sobre conteúdo, participações e créditos. Edição de título/descrição e exclusão recuperável já existem.
- [ ] Definir eventual arquivamento de partes e capítulos, se houver necessidade além da lixeira recuperável.
- [ ] Definir prazos de entrega e alteração dos prazos; só depois classificar participações como atrasadas.
- [ ] Avaliar papéis/permissões adicionais se necessário. Organizadores ativos e atribuição por capítulo já existem; autoria não concede acesso.
- [ ] Exercitar falhas reais de rede e sessão expirada na criação de obras, estrutura e envio de convites.
- [ ] Conferir os fluxos completos de participantes/convites em tema escuro e smartphone físico.

## 3. Colaboração e acompanhamento

Contribuição por cópia, revisão por comentários, indicadores nos capítulos e Minhas participações estão implementados. O contador atualiza a cada 30 segundos, ao recuperar foco e reconectar; não é uma central de notificações ou envio de e-mail editorial.

Seu espaço também destaca até cinco pedidos de revisão/contribuição aguardando ação, com dados iniciais do servidor e atualização pelo mesmo fluxo. O painel ativo abre ao acessar o capítulo como pessoa atribuída. Comentários têm painel lateral persistente no computador e painel inferior expansível no celular, filtros e navegação entre apontamento e trecho. O responsável pode resolver/reabrir comentários, inclusive de revisões anteriores, preservando autor/data de cada ação e sem alterar texto ou parecer. Não requer migration: os metadados ficam no JSONB existente. Conferência visual no navegador e no iPhone físico permanece pendente.

O salvamento de comentários não consulta histórico sem identificador: após sucesso, limpa o campo e a seleção e exibe confirmação no cabeçalho do painel, inclusive no celular. Falhas preservam o texto para nova tentativa.

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
      Confirmação de e-mail implementada para novas contas administrativas e por convite: link de uso único com 24 horas, hash SHA-256 no banco e reenvio limitado a uma vez por minuto e cinco por hora/endereço. Login exige confirmação após validar a senha; sessões também bloqueiam contas pendentes. Contas existentes ficam dispensadas, sem fabricar uma data de confirmação. Trocar o endereço exige nova confirmação, inclusive nas contas dispensadas, e invalida links antigos. Envio usa a infraestrutura existente com `waitUntil`; falhas exigem nova solicitação em `/verify-email`, sem fila durável. Validar Resend/Preview antes de afirmar entrega remota.

Login mantém erro genérico e executa comparação de senha também para e-mail desconhecido. Cadastro por convite retorna o mesmo `202` e mensagem para endereço novo ou existente, sem devolver dados da conta. Validação administrativa de duplicidade continua explícita porque a administração já tem acesso à lista de contas. Isso não implementa rate limiting de login, proteção por IP, CAPTCHA ou defesa completa contra ataques distribuídos.

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

A página inicial pública apresenta obras literárias e trabalhos em grupo, com chamadas próprias para cada uso e a estrutura inicial dos trabalhos. O fluxo segue organizar, distribuir contribuições, escrever, revisar e exportar, com entrada pelo botão “Entrar no Trama”. Descreve os recursos disponíveis de editor, revisão por comentários, leitura completa, créditos e exportação PDF/DOCX. A prévia permanece ilustrativa, com estados de pedidos editoriais e papéis coerentes com as permissões atuais; autoria continua declarada nos créditos. Identidade visual e aviso de produto em desenvolvimento são preservados. Não anuncia recursos científicos futuros nem direcionamento específico a menores. A atualização de conteúdo não inclui mensagem sobre acesso restrito, conforme preferência do usuário.

Carregamento compartilhado: navegação mostra barra indeterminada e “Carregando…” sem cobrir o conteúdo, encerra em conclusão/erro e bloqueia repetição de links internos durante a transição, preservando âncoras, downloads e novas abas. Ações de conta, autenticação, obras, estrutura, participantes, convites, créditos, pedidos editoriais e exportação usam trava imediata por componente (`useActionState`) e estados de espera; envios mostram spinner via `aria-busy`, e operações de painel usam `LoadingMessage`. Não altera permissões nem contratos de API e não substitui proteções no servidor. A lentidão de produção ainda exige investigação própria; esta entrega melhora o retorno visual. Validar o próximo Preview/Production e smartphone físico antes de afirmar funcionamento remoto.

Títulos de seções expansíveis compartilham a cor de destaque do tema, peso 500, cursor de mão e foco visível: créditos, pedidos editoriais, históricos e texto anterior à aprovação. O estilo é centralizado para incluir novos `summary` automaticamente.

Profundidade aprovada nos painéis e cartões do sistema: sombra estática mais profunda e difusa no topo e à direita, centralizada em `--panel-shadow`. Aplicada aos painéis de obras/convites/participações, formulários de autenticação/conta/usuários, tabela e diálogo de usuários, cartões de Seu espaço, prévia pública, painéis editoriais/comentários, sumário/recuperação e status. Blocos internos, campos e mensagens não recebem sombra indiscriminadamente. O efeito dos botões permanece intacto. Não há elevação nem efeito de pressão nos painéis; conferência visual completa nas demais telas permanece pendente.

Padrão visual aprovado para os botões do sistema: sombra suave e difusa no topo e à direita, elevação sutil ao passar o mouse e redução da sombra ao clicar. O CSS global `components/shared/buttons.css` aplica o efeito aos botões atuais e futuros; links com aparência de botão usam `data-button`. Cores e dimensões de cada tela são preservadas. Na obra, salvar/enviar e escrever capítulo usam destaque de cor; leitura, edição e organização ficam neutras. Ações destrutivas usam fundo vermelho e texto branco como padrão compartilhado (`--danger-button-bg` e `--danger-button-text`), inclusive nos dois temas, separado das cores de mensagens de erro. Preserva foco, transformações de posicionamento e preferência de movimento reduzido; desabilitados ficam sem sombra. O fundo clicável do menu é uma exceção por ser uma sobreposição transparente. Conferência visual completa nas demais telas permanece pendente.

O botão Sair fica no menu lateral, abaixo do perfil (Administrador ou Sua conta), no computador e no celular. No computador, a lateral e o controle acompanham a rolagem dentro da área autenticada usando sticky, com margem superior de 12 px e rolagem própria se os itens ultrapassarem a altura disponível. O controle fica no alto da divisória, somente com setas duplas indicando recolher/expandir; acompanha o recolhimento e permanece acessível à esquerda. No celular, permanece no canto superior esquerdo, com hambúrguer ao fechar e X ao abrir. A transição de recolhimento e a sobreposição com fundo escurecido no celular são preservadas.

Durante a personificação, menu, botões flutuantes e sobreposição respeitam a altura real do aviso fixo, acompanhada por `ResizeObserver`. O aviso e a ação de encerrar permanecem visíveis; o menu mantém rolagem no espaço disponível. Ao remover o aviso, o deslocamento é limpo. No computador, a lateral inteira tem rolagem quando falta altura, incluindo perfil e Sair, sem uma área de rolagem separada nos links. A altura disponível é medida pela posição real da lateral na janela, com margem inferior de 12 px, e atualizada ao rolar, redimensionar ou mudar o layout; não desconta uma altura fixa de cabeçalho.

As ações na lista de usuários têm estilo local de botão compacto, com borda, espaçamento e altura mínima de 44 px. Personificar e Editar usam superfície neutra; Remover usa os tokens destrutivos. Preserva o efeito global dos botões sem alterar outras telas.

O rodapé usa uma assinatura Bectec menor e links legais no mesmo tamanho do Status do sistema. Todos os botões da tela de detalhes da obra, incluindo leitura, edição, créditos, estrutura e participantes/convites, seguem o tamanho compacto no celular e no computador, com área mínima de toque de 44 px e setas de ordenação agrupadas. Conferência visual nos dois tamanhos e no iPhone físico permanece pendente.

- [ ] Validar teclado, contraste, foco, mensagens e telas pequenas nos fluxos completos, incluindo créditos e participações.
- [ ] Avaliar custo da renderização global para ler o cookie de tema antes de alterar cache/desempenho.
- [ ] Definir prioridade/escopo do [apoio à escrita acadêmica](academic-writing-idea.md), modelos, etapas e eventual uso de IA.

A identidade visual do site da Bectec é uma intenção separada. Não introduzir serviços, IA ou módulos do legado apenas porque aparecem nas referências.

## 9. Preparação para cadastro público

Planejamento combinado em 19/10/2026. O cadastro continua fechado; registrar estas tarefas não autoriza abrir o acesso nem executar testes de carga em produção. Priorizar confirmação de e-mail, proteção contra abuso e restauração verificada; depois concluir limites e fluxo de cadastro antes de uma abertura gradual.

- [ ] Implementar proteção contra abuso no cadastro e login, com limites de tentativas por conta/endereço e IP, considerando redes compartilhadas e sem expor a existência de contas. Aproveitar a proteção existente da recuperação e avaliar proteção adicional conforme os sinais de abuso.
- [ ] Validar confirmação obrigatória de e-mail em Preview/Production antes de abrir o cadastro. O fluxo já existe para novas contas e troca de endereço, com bloqueio de login e operações autenticadas até confirmar; eventual cadastro público deve reutilizá-lo.
- [ ] Definir e aplicar no servidor limites de obras por conta, capítulos e conteúdo total, além de frequência e concorrência de exportações. O limite atual de 1 MiB por capítulo não limita o armazenamento total. Valores e mensagens ainda precisam ser definidos; não há decisão sobre planos pagos.
- [ ] Integrar o cadastro público ao aceite explícito dos documentos pelo próprio usuário, reutilizando o controle existente de versão e data, com acesso aos textos e bloqueio das operações protegidas enquanto houver pendência. Não fabricar aceite nem tratar aceite dos Termos como consentimento genérico para qualquer uso de dados. Concluir a revisão jurídica indicada na seção 7.
- [ ] Definir frequência e retenção dos backups, perda máxima de dados aceitável e prazo desejado de recuperação. Testar restauração em banco separado, verificando contas, obras, capítulos, comentários e seus vínculos, sem sobrescrever produção. A existência de um backup não comprova que a restauração funciona.
- [ ] Acompanhar erros, latência, conexões, uso de recursos, armazenamento e custos, com alertas e orçamento definidos. Preservar credenciais, tokens e conteúdo privado nos registros.
- [ ] Medir capacidade em ambiente de teste com configuração equivalente à produção, usando cenários de leitura, escrita/salvamento, revisão e exportação. Avaliar etapas de 10, 25, 50 e 100 usuários ativos como alvos de teste, sem tratá-las como capacidade já comprovada. Confirmar recursos e planos atuais antes de estimar simultaneidade ou abrir um beta controlado.

## Ambiente local e continuidade

- Executar Node, npm, Git e Docker pelo Ubuntu/WSL em `/home/bectec-laptop/projects/Trama`. Conferir `.nvmrc` antes de selecionar versão.
- Desenvolvimento: HTTP 3001, PostgreSQL 5433, MailCatcher 1026/1081. Testes: HTTP 3002, banco descartável 5434, MailCatcher 1027/1082. Preservar volumes e a trava dos testes.
- Acesso doméstico: configuração local do Windows restrita à sub-rede e porta 3001, sem expor PostgreSQL. IPs podem mudar; `TRAMA_DEV_ORIGINS` define origens adicionais no desenvolvimento. Não é deploy público.
- Datas de migrations usam `pgm.func("timezone('utc', now())")`. [Deploy](deployment-migrations.md) usa conexão direta, TLS, trava e transação.
- Atualizar regras e pendências a cada entrega. Retirar tarefas concluídas sem eliminar decisões importantes ou declarar validações não executadas.
