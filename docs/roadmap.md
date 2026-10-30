# Roadmap do Trama

Revisado em 30/10/2026. Este documento reúne decisões que devem continuar e **trabalho pendente**. As entregas estão resumidas no [README](../README.md); regras e operação ficam nas referências abaixo.

As tarefas concluídas foram retiradas da lista. Implementação local não significa validação de produção. Este documento não autoriza implementar todos os itens nem publicar alterações. Confira o código e [AGENTS.md](../AGENTS.md) antes de retomar.

## Decisões e referências

- Manter os roadmaps também no AI-Memory do projeto, atualizando a memória quando houver mudanças de planejamento. Cópia de referência em `planning/roadmap.md`, no workspace `default`, projeto `igormbecker-trama`. Consultar este arquivo e conferir o código antes de retomar.
- Preservar JavaScript, Pages Router, controllers de API, models e infraestrutura PostgreSQL com consultas parametrizadas. Não migrar arquitetura por iniciativa própria.
- Interface em português brasileiro; arquivos e identificadores em inglês. Preservar Inter, temas de papel/carvão quente, marca Trama e créditos Bectec.
- Responsável gerencia e escreve livremente. Organizador ativo consulta; contribuição/revisão exige atribuição por capítulo. Revisão comenta uma versão fixa e emite parecer, sem alterar o capítulo. [Regras editoriais](editorial-rules.md).
- Autoria é declarada pelo responsável, inclusive para pessoas sem conta. Papéis de acesso não atribuem autoria. Exportação exclusiva do responsável.
- Cadastro público fechado; criação administrativa ou por convite não fabrica aceite legal. Sessões fixas de 24 horas, sem renovação automática.
- TDD para comportamento, mudanças focadas, bancos isolados e commits Conventional Commits em inglês. Legibilidade do código: condicionais com chaves, validações longas separadas por etapa, identificadores descritivos e SQL curto ou extenso por cláusula e SVGs separados em componentes nomeados de ícones/marca, conforme AGENTS.md. Commit, push e deploy dependem do escopo autorizado.
- O legado `D:/Projects/obras3` é referência histórica, não escopo obrigatório. Integração com PublicA está excluída.
- A obra piloto tem quatro partes e oito capítulos em [example-work.md](example-work.md) e `example-chapter-01.md` a `example-chapter-08.md`. Texto escrito em arquivo não comprova inserção no banco.

A tabela administrativa de usuários agrupa Personificar, Editar e Remover no botão de três pontos por conta em todas as larguras, preservando confirmações e restrições existentes.

## 1. Publicação e operação

Existem configuração de migrations antes do build da Vercel e workflows de testes, ESLint, Prettier e commitlint em pull requests. As pendências tratam da execução e operação reais.

- [ ] Validar no próximo Preview as migrations, URL direta do banco, comando de build e compatibilidade com o deploy anterior; exercitar concorrência da trava. [Procedimento](deployment-migrations.md).
- [ ] Conferir estado atual de Preview/Production, variáveis, TLS e segredo de senhas. Registros anteriores de configuração não substituem verificação remota.
- [ ] Confirmar preparação inicial do banco e criação explícita do primeiro administrador por ambiente, sem promoção por nome ou e-mail.
- [ ] Validar workflows remotos e definir gates de entrega, incluindo build; não presumir proteção de branch ou deploy automático pela `main`.
- [ ] Definir backups/retenção e testar restauração.
- [ ] Planejar migração coordenada do Neon e das funções Vercel para São Paulo, preparando o banco antes da virada da aplicação. Conferir região do deploy ativo, versões PostgreSQL, conexões e variáveis de produção/preview; criar novo projeto Neon em `sa-east-1`, preservando os ambientes independentes. Fazer backup privado com `pg_dump`, restauração de ensaio e conferência de registros, relacionamentos e textos; preservar os segredos necessários às contas sem registrá-los no Git. Validar em Preview com funções em `gru1`: login, projetos, capítulos, salvamento, revisão, exportação e migrations antes do build. Na virada de produção, impedir gravações inclusive por APIs/deploys antigos, fazer cópia final, conferir dados, atualizar conexões da aplicação e `DATABASE_URL_UNPOOLED`, selecionar `gru1` e realizar novo deploy. Validar antes de liberar gravações e comparar latência antes/depois. Manter origem e backups até concluir a validação; rollback após novas gravações exige preservar/reconciliar esses dados, nunca simplesmente voltar ao banco antigo. Este item registra planejamento, não execução nem autorização para migrar/publicar.
- [ ] Revisar logs e erros sem registrar credenciais, tokens ou conteúdo sensível.

Continuidade: em 17/10/2026 foram configurados projeto Vercel `trama`, Neon `trama` (US East 2), branches independentes `production`/`preview` e variáveis por ambiente. Ambas receberam cópias iniciais de `trama_dev`, sem sessões ou reservas ativas; alterações posteriores são independentes. Backups privados ficam fora do Git. Ao copiar contas, preservar o segredo de senhas correspondente sem registrá-lo nos documentos.

As migrations até `1792320000000_create-work-credits` foram aplicadas no desenvolvimento, incluindo recuperação de senha, pedidos editoriais, comentários e créditos. A aplicação remota precisa ser conferida no próximo build. Não aplicar `down` automaticamente.

## 2. Obras, estrutura e participantes

A Lixeira tem atalho próprio como último item do menu da conta, disponível também no celular e destacado em /trash; os atalhos Abrir lixeira da lista e dos detalhes dos projetos foram removidos.

A listagem Meus projetos começa com o formulário de criação recolhido, aberto pelo botão + Criar projeto alinhado ao título Meus projetos, com o estilo de Adicionar parte; Cancelar fica ao lado do envio no formulário e recolhe preservando os valores digitados.

Acima de 800 px, cada parte/capítulo recolhe as ações no menu de três pontos quando elas não cabem em uma linha; ao recuperar espaço, os botões reaparecem. A verificação usa a largura real da linha, incluindo mudanças ao abrir/recolher o menu da conta.

No celular (até 800 px), partes e capítulos/seções apresentam opções pelos três pontos junto ao título. Adicionar capítulo/seção fica junto ao título da parte e aos três pontos; até 420 px, essa ação passa para a linha seguinte. Escrever capítulo/seção fica no menu de três pontos, preservando espaço para o título; edição, ordenação e exclusão ficam em painel inferior, com uma ação por linha, botões arredondados e confirmação de lixeira preservada. Leitores não recebem controles de gerenciamento. Menu e Voltar não foram alterados por essa reorganização. Conferência visual e de toque no aparelho permanece pendente.

Projetos podem ser obras literárias (`literary`) ou trabalhos em grupo (`group_assignment`), escolhidos na criação. Registros anteriores continuam literários. A lista Meus projetos tem filtros por tipo. Novos trabalhos recebem duas partes: Elementos textuais, com Introdução, Desenvolvimento e Conclusão; e Elementos pós-textuais, com Referências. As descrições orientam o preenchimento e o editor começa vazio. A estrutura é livre para editar, acrescentar, reordenar e excluir; trabalhos existentes não são modificados. Reutiliza rotas, tabelas, permissões, pedidos editoriais e exportações. Não há tipo científico próprio, ABNT, modelo obrigatório ou campos escolares; uma evolução científica exige definição própria. O tipo não é alterado pela edição de título/descrição.

O responsável pode mover projetos, partes e capítulos/seções para a lixeira, com confirmação na interface. A lixeira fica em `/trash`, acessível pelo último item do menu da conta. O conteúdo permanece no banco com `deleted_at` até a restauração ou exclusão definitiva; não há expiração automática. Excluir para sempre exige digitar o título exato e só aceita itens já na lixeira. DELETE `/api/v1/trash` remove o item e seus descendentes, rascunhos salvos e históricos editoriais em uma transação com trava por obra. Remover um projeto também apaga participações, convites e créditos do projeto, preservando as contas das pessoas. Não há restauração pela interface após essa operação. Arquivos exportados, cópias locais nos navegadores, auditoria operacional e backups seguem suas políticas próprias e não são apagados por essa ação. Itens removidos e seus descendentes ficam indisponíveis na leitura, exportação, convites, pedidos e salvamento. Reservas de edição próprias e de contribuição são invalidadas; após restaurar é necessário obter outra reserva. Rascunhos locais seguem a política de recuperação existente. Restaurar um pai preserva a situação dos filhos excluídos separadamente: primeiro restaura-se projeto/parte, depois esses filhos. Partes e capítulos restaurados retornam ao final da lista, com posições ativas contínuas e reordenação disponível. Créditos salvos manualmente permanecem como estavam; sugestões do histórico ignoram itens na lixeira. Organizadores e administradores sem responsabilidade não gerenciam a lixeira. Participações e convites são preservados; ao restaurar, o acesso segue as permissões e a validade atuais.

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

Na escrita do responsável, telas acima de 800 px entram automaticamente em modo foco: menu recolhido (pode ser reaberto), retorno à obra no topo, parte/título e pedidos editoriais à direita inicialmente ocultos, com botão para mostrar/ocultar os detalhes, largura disponível da janela aproveitada inclusive com o menu aberto e editor mais alto com barra fixa durante a rolagem. Encerrar a edição restaura a apresentação de leitura. No celular, a formatação começa recolhida no botão “Formatar texto” da linha superior e abre um painel abaixo dos controles, com botões de 40 px; os botões superiores de menu/voltar e a barra móvel do editor acompanham o deslocamento da área visível via VisualViewport quando o teclado abre. A validação com teclado real no celular permanece pendente. A conferência visual desse layout em navegador ainda está pendente.

Seu espaço oferece “Começar a escrever” junto da saudação. O atalho cria uma obra literária privada chamada “Rascunho sem título — DD/MM/AAAA às HHhMM”, usando o fuso do navegador e o instante do servidor, com “Parte 1” e “Capítulo sem título”, descrições vazias e editor vazio. Abre o capítulo em modo de escrita pelo fluxo existente de reserva, salvamento e recuperação. Os nomes podem ser editados normalmente; salvar o texto não muda o título.

POST `/api/v1/works/quick-drafts` recebe `{ request_id, time_zone, initial_document? }`, exige sessão e aceite legal atuais e retorna `{ work_id, chapter_id }`: 201 na criação e 200 na repetição. UUIDs derivados da conta e da tentativa e uma trava transacional evitam duplicação concorrente; obra, parte e capítulo são criados juntos, sem migration. Repetir não altera títulos ou conteúdo existentes. Itens na lixeira retornam 409, sem restauração automática. A proteção depende da permanência da obra no banco: uma exclusão definitiva também remove essa referência.

A tentativa pendente fica em sessionStorage por conta e aba até concluir a navegação; não guarda texto ou token de sessão. Falhas de rede, resposta ou navegação retomam a mesma tentativa, e o botão permite reabrir um rascunho já criado. Se o armazenamento estiver bloqueado, a proteção local permanece apenas enquanto a página estiver aberta. “Continuar escrevendo” permanece disponível como ação secundária.

- [ ] Conferir visualmente o atalho nos dois temas, em smartphone físico e no próximo Preview, incluindo falha de conexão e retorno ao Seu espaço. A abertura do navegador automatizado ficou indisponível no ambiente da implementação; testes HTTP e do cliente não substituem essa validação.

A barra de formatação é compartilhada pelo capítulo e pela contribuição. Até 800 px, as opções começam ocultas e abrem pelo botão “Formatar texto”, alinhado aos controles superiores de menu e retorno. O painel aberto fica abaixo dessa linha; não exige abrir “Mais” para acessar listas, estilo de parágrafo, link e refazer. Os controles têm 40 px. Botões preservam a seleção ao toque/clique e a formatação não força rolagem. Acima de 800 px, o capítulo principal em modo foco usa barra sticky e texto expandido; a contribuição preserva a apresentação desktop existente.

O observador de VisualViewport atualiza somente o deslocamento superior usado pelos controles móveis e pelo painel de formatação. Não reposiciona a página nem cria espaço inferior dinâmico. Uma solução anterior acima do teclado foi rejeitada após uso no iPhone; isso não valida esta implementação. Confirmar que os controles atuais não cobrem o trecho selecionado nem impedem chegar ao fim do texto. A apresentação atual exige validação no Safari do iPhone e em Preview; simulação de tela reduzida não substitui teclado e aparelho físicos.

- [ ] Validar a barra em smartphone físico, especialmente Safari no iPhone: texto longo, teclado aberto/fechado, último parágrafo selecionado, negrito/itálico, abrir/fechar “Formatar texto”, listas, títulos, links, desfazer/refazer, rotação, zoom e temas. Conferir capítulo principal e contribuição, menu lateral/personificação e salvamento; o trecho deve continuar selecionado e visível sem voltar ao topo. Confirmar também em Preview antes de considerar a melhoria validada remotamente.

Referência da V1: Tiptap MIT 3.32.0, JSONB separado da descrição, limite de 1 MiB por capítulo, salvamento após 2 segundos de pausa ou a cada 15 segundos, IndexedDB por conta/capítulo e reserva por aba de 90 segundos renovada a cada 25 segundos. Revisões de gravação impedem sobrescrita. Cópias locais pendentes permanecem após logout e saem ao salvar/descartar. Sem importação, anexos ou imagens no editor.

- [ ] Validar tema escuro, smartphone físico, textos próximos do limite e colagem de Word, Pages e Google Docs.
- [ ] Exercitar queda de rede, fechamento abrupto e novo login após expiração, preservando rascunhos. Reserva expirada/recuperação já foram exercitadas; falhas e concorrência também têm testes.
- [ ] Avaliar histórico de versões além dos marcos de entrega/incorporação. Revisões por comentários já preservam sua versão de referência.
- [ ] Definir retenção de conteúdo/histórico ao arquivar obras ou excluir contas.
- [ ] Avaliar o esforço para permitir que cada usuário escolha o idioma do Trama: português, inglês ou espanhol. Levantar textos e formatos a internacionalizar, definir o alcance sobre interface, e-mails e exportações, a persistência da preferência e a estratégia compatível com o Pages Router. Estimar etapas, testes e manutenção das traduções; distinguir idioma da interface do conteúdo escrito nas obras.

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

- [ ] Futuro, sem prioridade atual: avaliar importação de EPUB para leitura pessoal e narração, preservando autoria e acesso privado. “Minha biblioteca” é apenas um nome sugerido; decidir se pertence ao Trama ou a outro produto antes de definir menu, arquitetura ou implementação. Retomar depois da avaliação da narração dos projetos existentes. Nesse estudo futuro, considerar EPUB sem DRM, extração de metadados/sumário/texto, validação segura, armazenamento, exclusão, permissões e custos. Não versionar livros nem enviar seu conteúdo a provedores sem autorização. PDF/OCR não integram esta hipótese inicial.

- [ ] Evolução futura após a captura por voz: estudar e planejar a narração por IA das obras literárias e trabalhos em grupo já existentes no Trama, usando o texto salvo em ordem editorial. Abranger capítulos e seções; importação de livros fica para um TODO futuro. Prever reproduzir/pausar, avançar/voltar, velocidade, escolha de capítulo e progresso por conta para continuar de onde parou, inclusive entre dispositivos. Avaliar primeira versão com uma voz de qualidade em português brasileiro; destaque sincronizado do texto, outras vozes e interpretação de personagens são evoluções a estudar. Vincular áudio à versão do conteúdo, reutilizar trechos inalterados e definir aviso/regeneração e recuperação da posição após edições. Estudar geração sob demanda por capítulo/trecho, processamento assíncrono, armazenamento privado, entrega autorizada e revogação conforme permissões/lixeira, sem expor a obra por URLs públicas permanentes. Comparar provedores por naturalidade, fidelidade ao texto, pronúncia, limites, latência, custos de geração/regeneração, armazenamento e tráfego; definir privacidade, retenção e limites por conta. Validar reprodução com tela bloqueada, controles do sistema, interrupções e retomada no celular, especialmente Safari/iPhone, sem prometer suporte antes do teste real. Referências iniciais do estudo: [síntese longa](https://docs.cloud.google.com/text-to-speech/docs/create-audio-text-long-audio-synthesis), [custos de síntese](https://cloud.google.com/text-to-speech/pricing) e [Media Session](https://www.w3.org/TR/mediasession/). Estudo e planejamento; provedor e implementação ainda não definidos.

A captura por voz foi implementada localmente no editor compartilhado de capítulos/seções e contribuições, e em Registrar ideia por voz em Seu espaço. Oferece iniciar, pausar, continuar, concluir, ouvir e descartar, com até 4 minutos de áudio sem contar pausas. Transcrever envia o áudio à Groq somente por ação explícita; a prévia é editável, sem segunda IA de reescrita. Inserir no final preserva o texto e usa o salvamento/reserva/recuperação atuais. Ideias criam obra, parte, capítulo e documento inicial na mesma transação por quick-drafts; repetições não sobrescrevem conteúdo. Áudio concluído e prévia ficam em IndexedDB por conta/destino até aplicar ou descartar, inclusive após logout; gravação em andamento não tem recuperação. [Configuração e limites](voice-capture.md).

O usuário relatou gravação correta no celular, com silêncio na primeira tentativa de reprodução e funcionamento após voltar ao início. A preparação da prévia agora carrega explicitamente a fonte Blob e posiciona o áudio no início ao receber metadados, sem reprodução automática nem reposicionamento nas buscas seguintes. Revalidar a primeira reprodução no aparelho; a causa exata ainda não foi reproduzida no ambiente automatizado.

- [ ] Validar a captura por voz em navegador e smartphone físico, incluindo Safari/iPhone: permissões/HTTPS, limite, pausa/retomada, ocultação da página, reprodução, descarte, temas, desfazer, contribuição, sessão/reserva expirada e recuperação local. A abertura do navegador automatizado falhou no ambiente; testes e build não substituem esta conferência.
- [ ] Testar transcrição real em português. GROQ_API_KEY local está configurada no arquivo ignorado .env.development.local; a migration aditiva de duração foi aplicada no banco local trama_dev após conferência do destino. O usuário informou configuração da variável em Preview/Production, ainda sem verificação remota ou deploy nesta tarefa. Avaliar pontuação, parágrafos, nomes, ruído e silêncio antes de propor pós-processamento.
- [ ] Validar migration, cotas reais, retenção dos metadados de tentativas e tratamento dos dados pela Groq no próximo Preview; revisar aviso de privacidade antes de disponibilizar remotamente. Controle de duração exercitado em trama_test e migration aditiva aplicada no desenvolvimento local trama_dev; aplicação remota ainda não validada.

### Estudo de cota gratuita para transcrição com Groq

Referência consultada em 30/10/2026: [limites oficiais da Groq](https://console.groq.com/docs/rate-limits). Para `whisper-large-v3` e `whisper-large-v3-turbo`, a tabela pública do plano gratuito informa 20 solicitações/minuto, 2.000 solicitações/dia, 7.200 segundos de áudio/hora (120 minutos) e 28.800 segundos/dia (480 minutos, ou 8 horas). Os limites são simultâneos e compartilhados pela organização, não reservados por usuário; conferir os valores efetivos no painel antes de implementar ou publicar. São cotas de speech-to-text, não de narração de obras.

| Simulação com 100 usuários usando transcrição  | Resultado                                                       |
| ---------------------------------------------- | --------------------------------------------------------------- |
| Divisão igual dos 480 minutos diários          | 4 minutos e 48 segundos por usuário/dia                         |
| Divisão igual dos 120 minutos por hora         | 1 minuto e 12 segundos por usuário/hora                         |
| Proposta de até 4 minutos por usuário/dia      | 400 minutos/dia, com margem nominal de 80 minutos               |
| Todos usando 4 minutos na mesma hora           | 400 minutos solicitados para uma capacidade de 120 minutos/hora |
| Gravações de 2 minutos, enviadas uma única vez | Até 60 transcrições/hora e 240/dia pelo limite de duração       |

A simulação de 100 usuários acima é referência histórica de capacidade, não o limite atual. Decisão atual: 30 minutos por conta em janela móvel de 24 horas, com até 4 minutos por gravação. Com 5 pessoas, o teto pessoal soma 150 minutos/dia e deixa margem nominal de 330 minutos da cota externa de 480 minutos; uso simultâneo continua limitado pela cota compartilhada por hora.

O beta usa a conta compartilhada do Trama na Groq e chave somente no servidor. Cada envio reserva 240 segundos sob trava transacional; após sucesso, contabiliza a duração reconhecida, arredondada para cima, com mínimo de 10 segundos e máximo de 240 segundos. Falhas e respostas sem duração confiável mantêm 240 segundos. É necessário saldo de 240 segundos para iniciar outro envio; o saldo final inferior a esse valor aguarda liberação na janela móvel. A migration aditiva 1793361000000_add-voice-transcription-duration preserva tentativas anteriores com 120 segundos. A migration 1793370000000_extend-voice-recordings-to-four-minutes amplia a restrição/default para 240 segundos sem alterar o histórico, validada no banco descartável; conferir no próximo Preview. Os limites globais de proteção (15 envios/minuto, 50/hora e 200/24 horas, além de 100 minutos de áudio/hora e 400 minutos/24 horas contabilizados ou reservados) continuam separados, com resposta 429 e sem fallback pago. Bancos independentes não compartilham o contador, mas podem compartilhar a organização Groq. A validação de duração depende da resposta do provedor, após o envio; avaliar inspeção anterior para arquivos adulterados antes de abrir ao público. A margem nominal não garante atendimento em picos nem cobre outros usos da organização.

A página inicial pública apresenta obras literárias e trabalhos em grupo, com chamadas próprias para cada uso e a estrutura inicial dos trabalhos. O fluxo segue organizar, distribuir contribuições, escrever, revisar e exportar, com entrada pelo botão “Entrar no Trama”. Descreve os recursos disponíveis de editor, revisão por comentários, leitura completa, créditos e exportação PDF/DOCX. A prévia permanece ilustrativa, com estados de pedidos editoriais e papéis coerentes com as permissões atuais; autoria continua declarada nos créditos. Identidade visual e aviso de produto em desenvolvimento são preservados. Não anuncia recursos científicos futuros nem direcionamento específico a menores. A atualização de conteúdo não inclui mensagem sobre acesso restrito, conforme preferência do usuário.

Carregamento compartilhado: navegação mostra barra indeterminada e “Carregando…” sem cobrir o conteúdo, encerra em conclusão/erro e bloqueia repetição de links internos durante a transição, preservando âncoras, downloads e novas abas. Ações de conta, autenticação, obras, estrutura, participantes, convites, créditos, pedidos editoriais e exportação usam trava imediata por componente (`useActionState`) e estados de espera; envios mostram spinner via `aria-busy`, e operações de painel usam `LoadingMessage`. Não altera permissões nem contratos de API e não substitui proteções no servidor. A lentidão de produção ainda exige investigação própria; esta entrega melhora o retorno visual. Validar o próximo Preview/Production e smartphone físico antes de afirmar funcionamento remoto.

Títulos de seções expansíveis compartilham a cor de destaque do tema, peso 500, cursor de mão e foco visível: créditos, pedidos editoriais, históricos e texto anterior à aprovação. O estilo é centralizado para incluir novos `summary` automaticamente.

Profundidade aprovada nos painéis e cartões do sistema: sombra estática mais profunda e difusa no topo e à direita, centralizada em `--panel-shadow`. Aplicada aos painéis de obras/convites/participações, formulários de autenticação/conta/usuários, tabela e diálogo de usuários, cartões de Seu espaço, prévia pública, painéis editoriais/comentários, sumário/recuperação e status. Blocos internos, campos e mensagens não recebem sombra indiscriminadamente. O efeito dos botões permanece intacto. Não há elevação nem efeito de pressão nos painéis; conferência visual completa nas demais telas permanece pendente.

Os botões de ação do sistema, inclusive confirmações e cancelamentos, e links com aparência de botão usam ícones relacionados à ação. SVGs ficam em componentes próprios, com traço e cor herdada e aria-hidden quando decorativos. Os símbolos da barra de formatação são preservados. Confirmações de descarte/saída da gravação e de alterações pendentes no editor usam diálogo visual alinhado à lixeira, com Cancelar e Esc; fechar/recarregar a aba continua exigindo o aviso nativo do navegador. Conferência visual completa em desktop e smartphone permanece pendente.

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
