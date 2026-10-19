# Regras editoriais: legado e decisões para o Trama

Registro de continuidade em 18/10/2026. Inspeção estática do legado localizado em `D:/Projects/obras3` (o caminho mencionado `D:/projects/obras` não existe neste computador). Não houve execução do legado nem consulta ao banco. Este registro não autoriza implementação.

## V1 definida: escrita livre e colaboração opcional

Escopo aprovado pelo usuário em 18/10/2026. A primeira implementação local usa pedidos por capítulo, uma cópia de trabalho com reserva e revisão próprias, eventos de entrega/ajustes/decisão e recuperação do texto anterior à aprovação. A validação interativa e o deploy permanecem pendentes.

- O responsável escreve, organiza e salva seus capítulos sozinho, sem submissão ou aprovação obrigatória.
- Por capítulo, o responsável pode pedir contribuição ou revisão a uma pessoa cadastrada e participante ativa da obra, informando o que precisa.
- Contribuição tem como objetivo escrever ou desenvolver conteúdo; revisão tem como objetivo propor correções e melhorias no texto existente. Ambos usam o mesmo fluxo.
- Há somente um pedido ativo por capítulo, com uma pessoa atribuída por vez, seja contribuição ou revisão. Ao concluir uma contribuição, pode ser solicitada revisão a outra pessoa.
- Organizador continua leitor por padrão. A escrita em uma colaboração exige atribuição explícita no capítulo; não dá permissão para editar diretamente o texto atual da obra.
- A pessoa atribuída trabalha em uma cópia do texto salvo do capítulo, ou começa em branco se ele estiver vazio. O trabalho pendente fica separado do conteúdo atual da obra.
- Estados do pedido: Em escrita → Aguardando aprovação → Aprovada. Esses estados pertencem ao pedido, não são uma obrigação para o capítulo ou para a escrita individual.
- Ao enviar, a versão entregue fica preservada enquanto aguarda decisão. O responsável pode aprovar ou solicitar ajustes com uma mensagem. Ajustes retornam o pedido para Em escrita; reenviar é uma ação, sem estado próprio de nova submissão.
- A aprovação cabe somente ao responsável pela obra na V1. Ela incorpora o resultado ao texto atual do capítulo, preservando o texto anterior para recuperação.
- Se o responsável alterou o capítulo desde o início do pedido, a aprovação exige conferência antes de substituir; não pode sobrescrever silenciosamente alterações posteriores.
- O responsável pode cancelar o pedido sem incorporar o texto pendente.
- Fora da V1: vários colaboradores simultâneos no mesmo capítulo, revisão e avaliação obrigatórias em etapas separadas, delegação de aprovação a organizadores, comentários por trecho, prazos, notificações e aprovação com restrições.

Critério de conclusão: escrever sozinho → atribuir contribuição ou revisão → receber entrega → solicitar ajustes → receber reenvio → aprovar → conferir incorporação ao capítulo e preservação do texto anterior. Verificar também cancelamento, permissões e conflito com alterações do responsável. A remoção da pessoa participante bloqueia leitura e edição imediatamente, preservando pedido e entregas para consulta e cancelamento pelo responsável.

### Discussão anterior substituída para a V1

A proposta inicial de Rascunho → Em escrita → Em revisão → Em avaliação → Ajustes solicitados → Nova submissão → Aprovado e de delegação por etapa foi simplificada pelas decisões acima. Não implementar a proposta anterior como fluxo obrigatório nem assumir que organizadores podem aprovar. O legado abaixo permanece apenas como referência histórica.

## Comportamento encontrado no legado

### Estados e fluxo

`Obras.Data/ChapterStatus.cs` define Configuring (-1), WaitingInvites (0), InvitesAceppted (1), WaitingDeliver (2), WaitingAproval (3), WaitingRevision (4), Aproved (5), AprovedWithRestrictions (6) e WaitingUpdate (7). A enumeração não prova uma sequência linear obrigatória.

- `Obras.Business/ChapterDeliver.cs`: entrega cria registro com usuário, data, comentário e número de versão, vincula arquivos e cria tarefa DeliverApproval para o aprovador do capítulo. O fluxo de entrega encaminha para WaitingAproval.
- `Obras.Business/ChapterAuthor.cs`, método NeedRevision: aprovador solicita correções, muda para WaitingRevision, conclui sua tarefa de aprovação, registra comentário no histórico e cria tarefa DeliverRevision para cada autor confirmado, com prazo de sete dias calculado nessa operação.
- Portanto, WaitingRevision representa espera por correções dos autores. Não foi identificada uma etapa autônoma de revisor antes da avaliação nesse fluxo inspecionado.
- `ChapterDeliver.DeliverAfterRevision`: registra nova entrega, conclui tarefas de revisão ou atualização, retorna a WaitingAproval e cria tarefa para o aprovador. Nova submissão é uma operação, sem estado próprio na enumeração.
- `ChapterAuthor.Approve`: muda para Aproved, conclui tarefa e registra versão no log.
- `ChapterAuthor.ApproveWithRestrictions`: cria registro de entrega com comentário/arquivos, muda para AprovedWithRestrictions, conclui tarefa e registra log. O legado também possui fluxo de atualização (WaitingUpdate/DeliverUpdate), que não equivale automaticamente à proposta nova de revisão.
- Há tarefas, mensagens, arquivos, logs e notificações por e-mail. Isso descreve código existente, sem validar seu funcionamento em execução ou recomendar importar esses recursos para o Trama.

### Atribuições e permissões

- Cada capítulo tem um aprovador (`AproverId`), escolhido no formulário `Obras.Web/Admin/ChapterForm.ascx.cs`.
- Ao selecionar uma seção, seu coordenador (`CoordinatorId`) preenche o aprovador sugerido. O formulário permite definir outro usuário.
- Ao trocar aprovador de capítulo em aprovação, o formulário chama UpdateApproverChapter. A camada de banco chama a procedure `obras_ChapterChangeApproverUpdated`; seu efeito interno não foi validado.
- A busca do formulário usa `Common/Js/util.js` → `Ajax/User.aspx.cs` → `Business.Users.List(SearchName)`. Esse caminho não envia identificador da obra nem apresenta filtro de participantes da obra. Assim, não há evidência de que a seleção do legado esteja limitada aos participantes, como desejado para o Trama.
- `Admin/Chapter.aspx.cs` verifica tarefas do usuário para mostrar entrega, aprovação e correções; também distingue aprovador, organizador e perfis globais.
- `Admin/BookSummary.aspx.cs` esconde controles de montagem da estrutura para usuários sem perfil global, inclusive organizadores; organizadores mantêm visão ampla do sumário, enquanto outros usuários sem perfil têm a lista filtrada por coordenação de seção.
- Portanto, não está comprovada a regra ampla de que todo organizador possa delegar todas as etapas. O legado mistura perfis globais, organização da obra, coordenação de seção, aprovador do capítulo e tarefas. Não transportar suas permissões por suposição.

## Situação atual e próximos pontos do Trama

O responsável continua gerenciando estrutura e participantes e escrevendo sem aprovação. Organizador ativo consulta conteúdo salvo; a pessoa explicitamente atribuída a um pedido pode editar somente a cópia daquele capítulo. Existem entrega, pedido de ajustes, aprovação pelo responsável e cancelamento. Comentários por trecho e etapas obrigatórias separadas não existem.

A migration e os testes desta implementação foram aplicados somente ao banco descartável de testes. A interface ainda precisa de validação interativa; o comportamento do legado não altera as decisões aprovadas.
