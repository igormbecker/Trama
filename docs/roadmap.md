# Roadmap do Trama

Referência revisada em 16/10/2026. Este documento registra o estado observado, as pendências e uma sequência sugerida para continuar o desenvolvimento. Deve ser atualizado conforme as entregas e decisões acontecerem.

O roadmap não autoriza implementar todos os itens de uma vez nem publicar alterações. As etapas editoriais são propostas até que suas regras sejam validadas com o usuário. Antes de retomar, confira o código e as instruções de AGENTS.md; eles podem ter evoluído depois desta revisão.

## Objetivo e referências

A obra piloto “Memórias do Futuro” tem uma versão textual completa em quatro partes e oito capítulos, revisada em 18/10/2026 para tornar ações e falas mais claras. A continuidade e os textos ficam em `docs/example-work.md` e `docs/example-chapter-01.md` a `docs/example-chapter-08.md`. A entrega dos DOCX não significa inserção no banco ou validação do copiar e colar em produção.

O Trama é uma aplicação de gestão editorial colaborativa: organizar obras, pessoas, capítulos, entregas e revisões até a aprovação.

A base técnica segue o Curso.Dev: JavaScript, Next.js com Pages Router, handlers de API, models para regras de negócio, PostgreSQL com pg e migrations. Preserve essa arquitetura e desenvolva comportamentos com TDD.

O sistema Obras, em D:/Projects/obras3, serve como referência de funcionalidades e regras, sem alterar seu código. O documento original docs/trama-contexto.md dessa referência foi consultado para este planejamento; suas descrições de implementação ainda não iniciada são históricas. As funcionalidades do legado são candidatas, não um escopo fechado. A integração com PublicA foi explicitamente excluída do Trama.

## O que já está implementado

- [x] Cadastro público fechado: POST /api/v1/users exige sessão administrativa e /register informa o acesso restrito. A exceção é o cadastro pelo link de convite válido para uma obra, limitado ao e-mail convidado; a nova conta continua comum e precisa aceitar pessoalmente os documentos e o convite.

### Publicação restrita — decisões de 17/10/2026

- Página inicial e login poderão ser públicos; somente contas cadastradas pelo administrador entram na área autenticada.
- Projeto vazio `trama` criado na Vercel, separado do Curso.Dev, com framework Next.js e Node 24. Nenhum deploy foi executado. Painel: https://vercel.com/igor-m-becker-jrs-projects/trama.
- Projeto Neon `trama` identificado como `jolly-boat-90353896`, na região AWS US East 2 (Ohio), com branches `production` e `preview`. O usuário manteve `production` como padrão e escolheu configurar preview manualmente, sem branches automáticas por deployment.
- Ambas as branches receberam uma cópia consistente de `trama_dev` em 17/10/2026: três contas, uma obra, duas partes e quatro capítulos, incluindo os documentos salvos. A importação verificou as nove tabelas por contagem e checksum antes de confirmar cada transação; sessões ficaram vazias e reservas de edição foram liberadas. Novas alterações de dados serão independentes entre os ambientes. Backups com dados privados ficam em `.vercel/backups`, ignorados pelo Git.
- Vercel recebeu `DATABASE_URL`, `DATABASE_URL_UNPOOLED` e `PASSWORD_PEPPER` como segredos, em entradas separadas para Production e Preview. O desenvolvimento e os testes locais continuam no Docker. A conexão da aplicação aceita a URL do ambiente, com fallback para os campos locais existentes; migrations usam a URL direta quando disponível. A trava dos testes verifica as URLs e sobrescreve a URL direta herdada com a de `trama_test`.
- Preservar o PASSWORD_PEPPER de origem ao copiar contas para manter a validação das senhas. Nunca registrar seu valor em documentação ou commits.
- Antes da importação, conferir os destinos, os dados já existentes e fazer cópia de segurança. Não copiar sessões e reservas de edição ativas como credenciais válidas para a internet.
- Pendentes: enviar a branch de cadastro restrito mediante autorização de commit/push, concluir o vínculo com GitHub, executar o primeiro deploy e verificar build remoto, login, permissões, editor e exportações no ambiente online. Scripts `build` e `start` estão disponíveis; `.vercel`, arquivos `.env*.local`, `.env.production` e dumps ficam ignorados pelo Git. Nenhum deploy está confirmado por este registro.

- [x] Exportação da obra salva em DOCX editável e PDF de leitura, organizada por partes e capítulos. Botões na leitura completa; GET /api/v1/works/[id]/export?format=docx|pdf exige acesso atual à obra e usa cache privado. Geração em memória, sem guardar arquivos no banco. PDF com Inter estática incorporada, somente a marca Trama no rodapé e número da página. DOCX com estilos editáveis, A4 e numeração. Revisão/comentários/preparação continuam planejados dentro do Trama; importar arquivos permanece fora do escopo. Conferência visual do DOCX pendente em Word/LibreOffice (renderizador indisponível no ambiente).

- [x] Menu autenticado recolhível pelo cabeçalho, com transição para a esquerda e expansão do conteúdo. O controle permanece disponível ao ocultar, informa o estado e impede foco nos links ocultos; respeita preferência por movimento reduzido.

- [x] Responsável edita título e descrição da obra nos detalhes, por `PATCH /api/v1/works/[id]`, com os mesmos limites da criação, cache privado e confirmação visual. Organizadores e administradores sem responsabilidade sobre a obra não podem editar; transferência e arquivamento continuam pendentes.
- [x] Entrada autenticada em `/home` (“Seu espaço”), com retomada do último capítulo, até cinco obras acessadas recentemente e aviso de convites pendentes. Histórico local por conta e navegador, com apenas identificadores e sem conteúdo ou tokens. Obras são filtradas pela lista autorizada atual e capítulos consultados pela API antes da exibição. O editor mantém reserva e recuperação existentes. A lista completa e criação continuam em `/works`; login, menu e marca levam à nova entrada. Sincronização de acessos entre dispositivos permanece futura.
- [x] Ambiente local separado do Curso.Dev: aplicação na porta 3001 e PostgreSQL de desenvolvimento na 5433, com projeto Compose e volume próprios.
- [x] Testes isolados: aplicação na 3002, PostgreSQL na 5434 e banco descartável exclusivo, com trava contra limpeza do banco de desenvolvimento.
- [x] Página inicial do produto, fonte Inter, temas de papel e carvão quente e assinatura Bectec no rodapé.
- [x] Cadastro administrativo, login e logout, com validações e senhas armazenadas como hash. O cadastro público anterior foi fechado para a publicação restrita.
- [x] Sessões no PostgreSQL, cookie de autenticação HttpOnly e expiração fixa de 24 horas.
- [x] Proteção das páginas autenticadas e das APIs administrativas.
- [x] API de migrations protegida: GET e POST exigem sessão válida e administrador, sem cache. A preparação inicial do banco é feita pelo comando de migrations.
- [x] Menu autenticado com Minhas obras, Minha conta e Usuários para administradores.
- [x] Primeira versão de obras: criar, listar e abrir obras privadas e bloquear exclusão de contas responsáveis por obras.
- [x] Minhas obras apresenta miniaturas de capas com título e marca Trama, em uma paleta de cores definida pelo identificador da obra. A cor permanece estável entre atualizações, contas e temas, sem imagens ou novos dados no banco.
- [x] Participantes e convites do MVP: responsável convida organizadores por e-mail, com aceite pela conta do endereço correspondente e acesso de consulta revogável.
- [x] Administração de usuários: listar, buscar na lista, adicionar, editar e remover.
- [x] Edição de perfil administrativo, bloqueio de exclusão da própria conta e proteção para manter ao menos um administrador.
- [x] Minha conta: editar dados pessoais e alterar a própria senha com confirmação.
- [x] Confirmação de senha também na edição administrativa.
- [x] Tema persistido em cookie do navegador. Após o login, o seletor fica em Minha conta; visitantes continuam com acesso ao seletor público.
- [x] Página de status no novo estilo, conteúdo técnico em inglês e retorno à página anterior.
- [x] Ajustes de alinhamento dos formulários e suporte aos temas claro e escuro.

Esses itens descrevem funcionalidades existentes, não uma garantia permanente de testes ou deploy. A página Minhas obras já permite criar, listar e abrir obras próprias. A prévia de capítulos da página pública continua ilustrativa; os detalhes da obra já mostram partes e capítulos reais, mas a escrita e o fluxo editorial ainda não foram implementados. Organizadores aceitos já podem consultar as obras das quais participam.

## Sequência sugerida

| Ordem    | Entrega                     | Resultado esperado                                   |
| -------- | --------------------------- | ---------------------------------------------------- |
| 1        | Primeira versão de obras    | Criar, listar e abrir uma obra com acesso controlado |
| 2        | Participantes e convites    | Vincular pessoas à obra e definir suas permissões    |
| 3        | Partes e capítulos          | Estruturar o conteúdo e atribuir responsáveis        |
| 4        | Editor, rascunhos e versões | Escrever conteúdo com salvamento e acesso autorizado |
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
- A personificação de usuários para suporte foi implementada em uma entrega separada da primeira versão de obras. Ela permite acesso administrativo indireto às obras privadas, usando as permissões do usuário representado; implementação descrita na seção de personificação.

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
- Convites por e-mail, inclusive para pessoas ainda sem cadastro, são enviados pelo serviço transacional. O link recebido permite criar uma conta restrita ao endereço convidado; a criação não aceita documentos nem concede participação automaticamente.
- O aceite ou a recusa exige sessão de uma conta com o mesmo e-mail do convite, comparado sem diferenciar maiúsculas e minúsculas. Convites pendentes não concedem acesso.
- Validade de sete dias. Reenviar para o mesmo e-mail cancela o convite pendente anterior. Convites expirados, recusados, cancelados ou já aceitos não podem ser usados para obter acesso.
- Remover um organizador revoga o acesso e preserva o registro de participação e os convites. O responsável não pode remover a si mesmo. Um participante removido só volta por novo convite e novo aceite.

### Entrega implementada

- [x] Datas de envio e validade dos convites exibem data, hora e minuto em `America/Sao_Paulo` (horário de Brasília), no formato `16/10/2026 às 14:47`, sem o sufixo UTC. O fuso explícito mantém a apresentação consistente entre servidor e navegador; os valores persistidos e as regras de expiração não mudam.
- [x] Painel da obra com botão vermelho compacto "Remover" ao lado do organizador, maior espaçamento antes do título Organizadores e somente convites pendentes. O histórico de enviados fica em `/invitations`, separado dos recebidos e visível apenas ao responsável pelas obras; inclui aceitos, recusados, cancelados e expirados, sem tokens ou hashes. A obra oferece um link para esse histórico; pendentes continuam sendo gerenciados na obra.
- [x] Página `/invitations` (Meus convites) no menu da conta, com contador de pendentes, título da obra, papel, validade, aceite e recusa em vermelho. A lista usa o e-mail atual da conta e exibe somente convites pendentes e válidos; sair da página não exige recuperar o link. Aceitar abre a obra e recusar remove o item da lista. Listagem, isolamento por conta, consumo único entre lista e link, concorrência, estado vazio, navegação, temas e largura de celular foram verificados no ambiente isolado de testes.
- [x] Criar migrations de participantes e convites com chaves estrangeiras, unicidade de participação por obra/conta e apenas um convite pendente por obra/e-mail.
- [x] Implementar criação, listagem e cancelamento de convites, com validação de responsável no model.
- [x] Na implementação anterior, o botão de cópia de link foi verificado no navegador pelo IP do WSL. A interface atual envia o convite por e-mail e não apresenta esse botão.
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

Próximo passo editorial: validar o editor por capítulo descrito na seção 4. Nesta etapa somente o responsável escreve; organizadores continuam com acesso de consulta. Atribuição de autores fica para depois.

## 3. Partes e capítulos

Referência criativa para a obra piloto: [Memórias do Futuro e seus quatro capítulos](example-work.md), ideia que o usuário pediu para preservar.

### Regras aprovadas e primeira entrega

- [x] Estrutura obra → partes/seções → capítulos. Cada capítulo pertence a uma parte; subcapítulos não entram nesta entrega.
- [x] Somente o responsável cria, edita e ordena partes e capítulos. Organizadores ativos podem consultar; administradores globais não recebem acesso editorial automático.
- [x] Partes possuem título obrigatório e ordem. Capítulos possuem título obrigatório, descrição opcional e ordem dentro da parte. Títulos têm até 255 caracteres e descrições até 5.000; espaços externos são removidos. Não há coordenador, autor, prazo ou conteúdo rico nesta entrega.
- [x] Criar, listar, editar e ordenar partes e capítulos na tela de detalhes da obra, com numeração derivada da ordem e controles para subir/descer.
- [x] Testar acesso, validação, isolamento entre obras e partes, revogação do organizador e criações concorrentes. A ordenação exige a lista completa, sem repetições ou identificadores externos.

Implementação: tabelas `work_parts` e `chapters`, regras em `models/workStructure.js`, interface em `components/works/StructurePanel.js`. As rotas ficam em `/api/v1/works/[id]/parts` e `/api/v1/works/[id]/parts/[partId]/chapters`: GET lista, POST cria e PATCH na coleção reordena por `{ ids }`. PATCH por identificador edita os dados. As APIs exigem sessão e usam cache privado sem armazenamento. Mutações usam transação e trava por obra, com posições únicas por pai. A migration `1792230000000_create-work-structure` foi aplicada no banco isolado de testes e no desenvolvimento local, criando apenas as novas tabelas.

A criação de parte e capítulo, edição de capítulo e ordenação foram conferidas no navegador com dados descartáveis. Ainda falta conferir os novos controles no tema escuro e em largura de celular e simular falhas de rede/sessão na interface. Nenhum editor rico foi instalado ou implementado nesta etapa.

Descrições longas de capítulos têm altura visual limitada e rolagem própria: até 320 px (ou 50% da altura da janela) e, em telas estreitas, até 240 px (ou 45% da altura). Título e ações ficam fora dessa área. A região é identificada e acessível por teclado. Isso não altera o limite de 5.000 caracteres nem substitui o futuro conteúdo no editor rico.

### Próximas definições

- [ ] Associar autores, organizadores e revisores conforme os papéis definidos.
- [ ] Definir os estados iniciais e as transições permitidas.
- [ ] Definir prazos e regras de alteração ou remoção de capítulos com histórico.
- [ ] Definir exclusão e arquivamento de partes e capítulos. Não há rotas ou controles de exclusão nesta primeira entrega.
- [ ] Testar permissões de escrita tanto na obra quanto no capítulo quando os papéis forem definidos.

O legado possui estados como configuração, espera por convites, entrega, revisão, aprovação, aprovação com restrições e atualização. Revisar suas regras antes de reutilizá-los; os nomes da prévia pública não definem uma máquina de estados pronta.

Critério de conclusão: uma obra apresenta sua estrutura real e cada participante entende em quais capítulos atua e quais ações pode realizar.

## 4. Editor, rascunhos e versões

### Decisões confirmadas para a V1 em 16/10/2026

Estas regras registram o escopo aprovado. A primeira implementação por capítulo está descrita abaixo; os itens ainda não verificados continuam explícitos. Substituem a proposta inicial de entregas por arquivos do legado.

- O conteúdo dos capítulos será escrito em um editor de texto rico dentro do Trama e persistido no PostgreSQL, preservando a arquitetura atual.
- O editor escolhido é o **Tiptap**, integrado ao React do projeto e executado no próprio Trama, usando somente o núcleo e as extensões de código aberto sob licença MIT. A V1 não dependerá de assinatura, Tiptap Cloud ou extensões pagas. Preservar os avisos de autoria e licença; conferir as licenças dos pacotes e fixar as versões ao instalar. A versão obtida sob MIT pode continuar sendo usada gratuitamente conforme seus termos, inclusive em uso comercial; isso não garante as condições de versões futuras, que devem ser verificadas antes de atualizar. Hospedagem e banco têm custos independentes. Referências: [licença MIT do Tiptap](https://github.com/ueberdosis/tiptap/blob/main/LICENSE.md) e [editor aberto e plataforma](https://tiptap.dev/open-source-to-platform). A escolha está aprovada, mas nenhuma dependência do editor foi instalada nesta decisão.
- O usuário poderá escrever em outro aplicativo e copiar e colar no editor. A colagem deve limpar conteúdo e formatação incompatíveis; não há promessa de reprodução idêntica ao documento original.
- A V1 terá títulos, parágrafos, negrito, itálico, listas e links. Importação e exportação de arquivos, anexos e imagens ficam fora desta primeira entrega. Não será necessário contratar um serviço adicional de colaboração em tempo real; a hospedagem do banco continua sujeita ao plano escolhido.
- Somente o responsável pela obra escreve nesta etapa; organizadores ativos leem. Atribuição de autores fica para depois.
- Apenas uma aba poderá editar cada capítulo por vez, inclusive entre abas da mesma conta. A reserva vence após 90 segundos sem contato, renova a cada 25 segundos e ao salvar, e é liberada ao voltar à leitura. Fechamento inesperado depende da expiração. Edição simultânea colaborativa fica para depois.
- O rascunho completo é enviado à API após aproximadamente dois segundos sem digitação, ou a cada 15 segundos durante digitação contínua. Há também um botão "Salvar agora". Os intervalos poderão ser ajustados após validar a experiência.
- Uma cópia temporária do rascunho será mantida no navegador usando IndexedDB, para oferecer recuperação de alterações pendentes após falha de conexão, fechamento ou recarga da aba. Essa cópia não substitui o banco nem garante recuperação se os dados do navegador forem apagados.
- O estado de salvamento será explícito: alterações pendentes, salvando, salvo e falha de salvamento/conexão. "Salvo" só será exibido após confirmação do servidor. Falhas devem preservar o texto e permitir nova tentativa; sessão expirada deve orientar nova autenticação sem descartar o rascunho.
- Cada gravação usará um número de revisão para detectar conteúdo alterado por outra aba ou sessão. Conflitos não podem sobrescrever silenciosamente o texto já salvo nem descartar o rascunho pendente, mesmo com a regra de um editor por vez.
- O salvamento automático atualizará um único rascunho por capítulo, sem gerar uma versão histórica completa a cada gravação. Histórico editorial e marcos de entrega/revisão serão definidos em uma etapa posterior.
- A recuperação local separa rascunhos por conta e capítulo. Alterações pendentes permanecem em IndexedDB após sair da página ou da conta e podem ser recuperadas pela mesma conta após novo login. A cópia é removida após confirmação do salvamento no servidor ou descarte explícito. Não há expiração automática; em computador compartilhado, os dados locais continuam no perfil do navegador até serem removidos. Esse armazenamento não é criptografado e não substitui backup.

### Primeira implementação por capítulo

- [x] A colagem reconhece estilos explícitos de título do Word: `MsoTitle` como Título 1, `MsoSubtitle` como Título 2, `MsoHeading1/2/3`, `mso-outline-level` de 1 a 3 e nomes de estilo em português/inglês. Não infere títulos apenas pelo tamanho ou negrito da fonte. Verificados reconhecimento, salvamento e leitura no navegador com HTML representativo do Word; textos já colados não são reclassificados automaticamente. Colagem real do documento pelo usuário continua sendo a confirmação final de compatibilidade com seu Word.

- Os links da marca Trama no cabeçalho e no rodapé levam a `/home` para contas autenticadas e à página inicial para visitantes, acompanhando o estado de autenticação compartilhado.
- A edição de partes também retorna ao item salvo com confirmação acima do título. As confirmações de salvamento da obra, estrutura e editor usam peso normal, sem negrito, e ícone SVG de círculo com visto no mesmo traço do menu, substituindo o emoji.
- Salvar a descrição retorna ao capítulo editado, com confirmação verde acima dele e foco na mensagem. O formulário só fecha após salvar e atualizar a estrutura; falhas preservam os campos para nova tentativa.
- Ao abrir um formulário da estrutura, a página revela o painel e posiciona o foco na descrição para editar capítulos ou no título nas demais ações. A edição identifica o capítulo no cabeçalho; cancelar retorna o foco ao botão de origem.
- Os botões da obra e do editor preservam o preenchimento original da identidade do Trama, com ícones nas ações da estrutura. A alternativa de contornos por função foi avaliada e revertida por preferência visual do usuário.
- A estrutura diferencia “Escrever capítulo” (abre o editor com aquisição da reserva) de “Editar descrição” (formulário de título e descrição). O título do capítulo mantém o acesso à leitura. Ações de adicionar e editar usam ícones no estilo do menu.
- O salvamento apresenta confirmação verde com ícone SVG de círculo e visto e indicador de andamento no status e no botão. O clique manual também confirma quando não há alterações pendentes; o botão fica desabilitado durante o salvamento.
- A barra de formatação segue a referência visual de editores como Word e Pages: controles compactos, ícones com nomes acessíveis, seletor de estilos e separadores entre grupos, preservando os recursos da V1 e os temas do Trama.
- [x] Instalar `@tiptap/react`, `@tiptap/pm` e `@tiptap/starter-kit` na versão estável 3.32.0, fixada e sob MIT.
- [x] Abrir o capítulo pelo título na estrutura e apresentar leitura própria, preservando negrito, itálico, títulos, listas e links. A descrição anterior continua separada e não é migrada automaticamente.
- [x] Somente o responsável abre a edição. Conteúdo salvo como JSONB na tabela separada `chapter_drafts`, sem carregar o texto completo nas listas de estrutura.
- [x] Validar no servidor a árvore do documento e os formatos permitidos. Limite inicial: 1 MiB de JSON UTF-8 por capítulo, até 20.000 nós e profundidade 30. Não equivale a um número fixo de caracteres. Imagens, anexos, HTML arbitrário e links com protocolos incompatíveis são rejeitados; a colagem pelo editor mantém apenas o esquema aceito.
- [x] Salvamento automático e manual com revisão crescente, reserva exclusiva por aba, transação no banco e resposta 409 para conflitos. Requisições de salvamento da mesma tela são serializadas; digitação durante uma requisição permanece pendente para o próximo salvamento.
- [x] Recuperação local em IndexedDB, com escolha explícita de recuperar ou descartar. Se a revisão do servidor mudou, o aviso pede comparar os textos antes de recuperar. Falhas de armazenamento local têm aviso; falhas de sessão/reserva pausam a edição sem descartar o texto e oferecem reabertura.
- [x] Cobertura de API para leitura/escrita autorizada, isolamento entre obras, organizador removido, validação, reserva concorrente, renovação, expiração, liberação e revisão antiga. Testes unitários verificam o JSON real das extensões, formatos incompatíveis e alterações durante salvamento.
- [x] Conferir no navegador escrita, salvamento, leitura em negrito, bloqueio de segunda aba e recuperação local após expiração da reserva. Dados usados somente no ambiente descartável de testes.

Implementação: `models/chapterContent.js`, `models/chapterDocument.js`, GET/PUT `/api/v1/works/[id]/chapters/[chapterId]`, POST/DELETE na sub-rota `/lease` e página `/works/[id]/chapters/[chapterId]`. A migration `1792240000000_create-chapter-drafts` foi executada apenas no banco de testes. Em desenvolvimento, a criação da tabela ocorre pelo fluxo habitual de `npm run dev`.

### Validações e evoluções pendentes

- [ ] Validar visualmente tema escuro, celular físico, textos próximos do limite e colagem real de Word/Pages/Google Docs.
- [ ] Exercitar queda real de rede, fechamento abrupto do navegador e login após expiração de sessão no fluxo completo da interface. A reserva expirada e a recuperação local já foram exercitadas no navegador; respostas concorrentes e falhas de salvamento têm testes automatizados.
- [x] Leitura contínua em `/works/[id]/read`, acessível pelo botão Ler obra, com sumário e capítulos salvos em ordem editorial. Somente responsável e organizadores ativos consultam. Descrições e alterações locais não salvas ficam fora da leitura; a atualização ocorre ao reabrir a página.
- [x] Exportar DOCX e PDF do texto atual. DOCX e PDF incluem capa colorida com a mesma cor da miniatura da obra, título centralizado e marca Trama; no DOCX, o título permanece editável. Capas ilustradas e opções avançadas de diagramação permanecem futuras.
- [ ] Definir posteriormente versões editoriais, responsável e data de cada entrega e vínculo da revisão com a versão correta.
- [ ] Definir retenção do conteúdo e do histórico ao arquivar obras ou excluir contas.

Critério de conclusão da V1: uma pessoa autorizada edita o capítulo, acompanha o estado real do salvamento, reabre o conteúdo salvo e consegue recuperar rascunhos locais pendentes; outra aba ou pessoa não sobrescreve o conteúdo silenciosamente. A verificação deve cobrir falhas e isolamento entre contas.

Importação e exportação continuam como possibilidades futuras. Se forem retomadas, a preferência já discutida é processar os documentos sem armazenar permanentemente os arquivos importados ou exportados. Formatos e eventual suporte a imagens exigem decisão própria.

## 5. Contribuição e revisão opcionais — primeira implementação local

Escopo definido em 18/10/2026 e implementado localmente na branch de trabalho. Regras completas e referência histórica: [regras editoriais](editorial-rules.md). Esta versão substitui o fluxo anterior de revisão e avaliação obrigatórias em etapas separadas. Os testes de integração cobrem o ciclo principal, mas a interface ainda requer verificação interativa antes de declarar a V1 validada.

- [x] Definir escrita individual livre, sem aprovação obrigatória, e pedidos opcionais de contribuição ou revisão por capítulo.
- [x] Definir um pedido ativo por capítulo, uma pessoa participante ativa atribuída por vez e aprovação somente pelo responsável pela obra. Organizador permanece leitor sem atribuição explícita.
- [x] Definir fluxo comum do pedido: Em escrita → Aguardando aprovação → Aprovada; solicitação de ajustes com mensagem retorna para Em escrita, seguida de reenvio.
- [x] Implementar atribuição de contribuição (desenvolver conteúdo) ou revisão (corrigir e melhorar texto existente), com instruções do responsável.
- [x] Implementar cópia de trabalho separada do texto atual do capítulo e preservar a versão enviada enquanto aguarda decisão.
- [x] Implementar aprovação que incorpora a entrega ao capítulo e preserva o texto anterior para recuperação. Se o capítulo mudou desde o início do pedido, exigir conferência antes da substituição.
- [x] Implementar solicitação de ajustes, reenvio e cancelamento pelo responsável sem incorporar o texto pendente.
- [ ] Validar permissões no servidor, revogação de acesso, transições, concorrência e preservação do histórico.

Fora desta V1: colaboradores simultâneos no mesmo capítulo, revisor e avaliador em etapas obrigatórias separadas, delegação de aprovação, comentários por trecho, prazos, notificações e aprovação com restrições.

Critério de conclusão: escrever sozinho → atribuir contribuição ou revisão → receber entrega → pedir ajustes → receber reenvio → aprovar e incorporar o resultado com recuperação do texto anterior. Ainda validar no navegador o ciclo completo, falhas de rede e reserva, temas e largura de celular; não houve aplicação da migration em desenvolvimento nem deploy.

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

### Base de e-mails — primeira implementação em 18/10/2026

- [x] Centralizar envio em `infra/email.js`: Resend nos ambientes Vercel production/preview e MailCatcher no desenvolvimento e testes, sem depender da API autenticada.
- [x] Gerar mensagens HTML e texto simples com React Email, identidade do Trama e assinatura Bectec; escapar textos e validar links de ação.
- [x] Isolar MailCatcher local (SMTP 1026/painel 1081) e de testes (1027/1082), dentro dos projetos Compose próprios, somente em loopback.
- [x] Bloquear destinatários de preview fora da lista explícita `EMAIL_PREVIEW_RECIPIENTS`; sem lista, bloquear todos os envios. Desenvolvimento e testes nunca usam Resend, mesmo com credenciais herdadas.
- [x] Usuário confirmou o cadastro de destinatários de teste em `EMAIL_PREVIEW_RECIPIENTS`, somente no ambiente Preview da Vercel; envio real ainda pendente de validação.
- [ ] Validar envio real pelo Resend e aparência nas caixas Gmail/Outlook após conectar os fluxos; revisar o aviso de privacidade para o novo provedor antes dos envios reais.
- [ ] Implementar convite administrativo de acesso à conta com definição inicial da senha pelo destinatário. O cadastro restrito por convite de obra já existe; não substitui esse fluxo administrativo.
- [x] Conectar envio automático aos convites para obras, com tratamento de falhas e reenvio; envio local verificado no MailCatcher de testes. Entrega real pelo Resend continua pendente de validação.

Configuração confirmada pelo usuário: domínio `etrama.bectec.com.br` verificado, `RESEND_API_KEY` própria por ambiente e `EMAIL_FROM` configurado em Production e Preview. Nenhuma chave consta no código. A implementação local não significa deploy nem envio real confirmado. Detalhes e uso interno em [docs/email.md](email.md). Sem fila durável ou repetição automática nesta etapa; os futuros fluxos devem aguardar o envio e usar idempotência por evento.

### Próximos fluxos de conta

- [x] Recuperação de senha: `/forgot-password`, `/reset-password`, link no login e POST/PATCH `/api/v1/password-recovery`, com token aleatório de uso único válido por 15 minutos e somente hash no banco. Senha de 8–128 caracteres, confirmação obrigatória, consumo transacional, invalidação de links e sessões da conta e aviso após a troca. Resposta de pedido genérica, limite de um pedido/minuto e cinco/hora por endereço; envio via `waitUntil`. Personificação não permite recuperar senhas. Aceite pendente não bloqueia recuperação nem é fabricado por ela. Detalhes em [docs/email.md](email.md).
- [ ] Aplicar a migration `1792270000000_create-password-recovery` no desenvolvimento e nos ambientes remotos antes de habilitar a recuperação; aplicada somente no banco de testes nesta entrega. Validar entrega real no preview, restrições de destinatários e aparência em Gmail/Outlook; não houve deploy.
- [ ] Definir confirmação de e-mail e verificação ao alterar o endereço.
- [ ] Avaliar exigência de senha atual ou nova autenticação para mudanças sensíveis.
- [x] Invalidar todas as sessões da conta e sessões que a personificam após recuperação de senha.
- [ ] Definir invalidação de outras sessões após troca de senha pelos fluxos de conta/administração existentes.
- [ ] Avaliar encerramento de todas as sessões e consulta de dispositivos.
- [ ] Persistir a preferência de tema por usuário no banco, desejo já informado pelo usuário.
- [ ] Definir a precedência entre preferência da conta e cookie, incluindo login em outro dispositivo e logout.
- [ ] Paginar e buscar usuários no servidor quando a quantidade de contas exigir; hoje a busca ocorre sobre a lista carregada.

A sessão atual expira em 24 horas sem renovação automática. Não alterar essa decisão silenciosamente. A preferência de tema atual é do navegador, não da conta; a futura persistência pode sincronizar no login sem consultar o banco a cada navegação.

## Personificação de usuários para suporte

Implementada em 18/10/2026 para administradores reproduzirem problemas com as permissões de contas comuns, sem conhecer suas senhas. A sessão mantém o administrador como titular e guarda a conta representada separadamente; outros logins permanecem independentes. O modo vale para todas as abas que compartilham a mesma sessão.

- [x] Iniciar pela ação Personificar em Usuários, com confirmação e aviso de dados reais. Não permite representar a própria conta, outros administradores ou encadear personificações.
- [x] GET/POST/DELETE `/api/v1/impersonation`, com cache privado e sem armazenamento. POST inicia e DELETE encerra; a sessão original é validada no banco. O prazo é de até 15 minutos, limitado à expiração original, sem renovação automática.
- [x] Aplicar identidade e permissões da conta representada, sempre sem perfil administrativo; validar o perfil atual do administrador a cada autenticação. Edição de conta, senha e funções administrativas ficam bloqueadas pela API.
- [x] Aviso global com nome, alerta de alterações reais e ação de retorno. O aviso é consultado ao carregar, ao recuperar foco e a cada 15 segundos. Início e encerramento recarregam a página para limpar estado React/SWR da identidade anterior. Salvar o trabalho antes de mudar de modo.
- [x] Expiração ou remoção da conta representada bloqueiam novas autenticações nesse modo; nunca restauram privilégios administrativos silenciosamente. Encerrar explicitamente exige sessão original vigente e perfil administrativo atual. Se a sessão expirar ou o administrador perder o perfil, sair e autenticar novamente.
- [x] Migration aditiva `1792250000000_add-session-impersonation` acrescenta dados na sessão e tabela `impersonation_audit`. O identificador da conta representada não usa exclusão com SET NULL, para sua remoção não restaurar acidentalmente o administrador. A auditoria preserva identificadores mesmo após exclusão de contas.
- [x] Registrar início/encerramento explícitos na transação, tentativas de alterações e exportações e resultado HTTP com identificador de correlação. Não guardar corpo, conteúdo, cookies, query strings ou tokens de convite. A gravação da tentativa precede a operação; falha nela bloqueia a requisição. Resultado é gravado após o handler; se essa etapa falhar, permanece a tentativa e um erro operacional, sem presumir conclusão. A expiração é determinada pelo prazo registrado; não há tarefa agendada para um evento de encerramento automático.
- [x] Testes de autorização, concorrência, atribuição das alterações, expiração, revogação, logout, retorno e proteção de exportações. Interface do aviso também tem teste de renderização.
- [ ] Definir retenção e acesso operacional à auditoria e concluir a revisão jurídica das minutas antes de publicá-las. Não há painel de auditoria nesta entrega.

O recurso permite acesso administrativo indireto ao conteúdo privado; as minutas dos Termos e do Aviso de Privacidade refletem essa regra. Não reproduz necessariamente navegador ou dispositivo do usuário. Rascunhos locais e histórico da conta representada seguem as regras existentes por conta e navegador, inclusive permanência de cópias pendentes após logout.

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

## Padrão de mensagens de sucesso

Confirmações de conta, usuários, cadastro, obras, estrutura, participantes e convites usam círculo com visto em SVG, verde do tema e texto sem negrito. Os componentes compartilhados ficam em components/shared. Carregamento, erros e avisos preservam sua semântica; o status de cópia só recebe aparência de sucesso após copiar o link.

## TODO para retomar em 18/10/2026

- [x] Configuração versionada para aplicar migrations antes do build da Vercel em production e preview, usando exclusivamente `DATABASE_URL_UNPOOLED`, TLS e trava nativa do runner. Falhas interrompem o build. Detalhes em [deployment-migrations.md](deployment-migrations.md).
- [ ] Validar no próximo deploy de preview o comando de build, a conexão direta do ambiente e as migrations aplicadas; validar concorrência real antes de afirmar a automação remota como confirmada. Esquema deve continuar compatível com o deploy anterior durante o build.

- [x] Exportações incluem a descrição da obra preenchida após a capa e sumário com partes e capítulos antes do texto, preservando a capa colorida. No PDF, as páginas são calculadas na geração e as entradas têm links internos. No DOCX, o sumário tem entradas visíveis, links e campos de página, com atualização solicitada ao abrir; até atualizar os campos no Word/LibreOffice, as páginas aparecem como “—”. Descrições dos capítulos continuam fora da exportação.
- [ ] Conferir a aparência e a atualização dos campos do sumário DOCX em Word/LibreOffice; renderizador indisponível neste ambiente. A geração e a estrutura do arquivo são verificadas por testes unitários.
- [ ] Adicionar opção de PDF para leitura em tela com fundo creme #F7F2E9 e texto #30313A, e opção para impressão com fundo branco. Validar contraste, margens, entrelinha e paginação. O fundo atual permanece branco até essa entrega.
- [ ] Definir campos de autor e coautores na edição da obra, inclusive pessoas sem conta, e incluir os créditos na folha de rosto dos documentos. Não inferir autoria a partir do responsável ou dos organizadores; os créditos não alteram permissões.
- Revisões, comentários e preparação editorial devem acontecer dentro do Trama em etapas futuras; a exportação não substitui esse fluxo.

## Documentos legais e aceite — 18/10/2026

- [x] Preparadas minutas de [Termos de Uso](terms-of-use.md) e [Aviso de Privacidade](privacy-notice.md), com autoria, convites, exportações, compartilhamento de cópias, dados pessoais e limites legais de responsabilidade. Responsável informada: Becker Tecnologia e Desenvolvimento de Software; contato: imbjr.work@gmail.com.
- [x] Identificação fornecida: Becker Tecnologia e Desenvolvimento de Software, CNPJ 65.457.811/0001-61, Rua General Salvador Pinheiro, 725, Vila Jardim, Porto Alegre/RS; contato imbjr.work@gmail.com. Vercel e Neon confirmados pelo usuário. Uso por menores exige participação do responsável e avaliação antes da liberação administrativa; não há verificação automática de idade ou autorização parental implementada.
- [x] Páginas públicas `/terms`, `/privacy` e `/legal/support`, com links no rodapé compartilhado; histórico de documentos aceitos por versão. Cadastro público continua fechado.
- [x] Aceite obrigatório em `/legal/accept` para contas existentes/administrativas sem aceite atual. Páginas protegidas redirecionam e APIs retornam `LegalAcceptanceRequiredError` (403). Documentos, contato, logout e consulta da própria conta continuam acessíveis. Na recusa, oferecer revisão posterior, contato para recuperação de conteúdo/dados e encerramento, sem apagar dados automaticamente.
- [x] GET/POST `/api/v1/legal/acceptance` com cache privado. Registrar ação explícita, data e versão, sem IP/dispositivo, com snapshots e hashes SHA-256 em `legal_document_releases` e vínculos em `legal_acceptances`. Aceite é idempotente; não aceitar versão antiga, corpo incompleto ou aceite por personificação. Administrador e conta representada precisam de aceite antes de iniciar personificação.
- [x] Versão ativa `2026-10-18-v1` em `infra/legal/2026-10-18-v1.json`. Preservar versões publicadas; mudanças exigem novo arquivo/identificador. Nenhum aceite real foi fabricado ou retroagido. Cadastro administrativo não aceita pelo usuário.
- [ ] Definir política e rotinas de retenção/exclusão para contas, logs, auditoria e backups, conforme decisão do usuário de tratar depois. O aviso descreve critérios e a ausência de prazos numéricos definidos; o aceite não substitui essa entrega. Concluir avaliação jurídica, contratos/transferências, atendimento e proteção de menores conforme [legal-review.md](legal-review.md).
- [ ] Na futura abertura do cadastro público, integrar aceite explícito antes de concluir o cadastro, preservando a separação entre aceite dos Termos/ciência do Aviso e consentimentos opcionais. Essa abertura não faz parte desta entrega.

Implementação e ativação local não significam publicação remota. As páginas usam textos revisados com as informações fornecidas; a adequação jurídica e as pendências operacionais continuam explícitas.

## Exportação exclusiva do responsável — 18/10/2026

- [x] Botões DOCX/PDF visíveis somente quando a conta efetiva é responsável pela obra. A API exige responsabilidade e retorna 404 para organizadores, administradores sem responsabilidade e demais contas sem autorização, preservando a leitura para organizadores ativos.
- [x] Durante personificação, exportação usa a conta representada: disponível somente se ela for a responsável. Minutas legais atualizadas; restringir o download não impede capturas ou cópias do texto durante leitura autorizada.
