# Aviso de Privacidade do Trama

**Minuta para revisão — versão 0.1, de 18/10/2026. Ainda não publicada. Os campos pendentes impedem tratá-la como aviso definitivo.**

## 1. Quem responde pelos dados

A responsável pelo Trama é **Becker Tecnologia e Desenvolvimento de Software**. O canal para assuntos de privacidade é **imbjr.work@gmail.com**.

**Pendente:** confirmar identificação jurídica completa, endereço e eventual identificação do encarregado ou regime aplicável ao canal de atendimento. Informar este e-mail não representa nomeação automática de encarregado.

Este aviso abrange dados de visitantes, contas, convidados e participantes tratados na operação do Trama. Quanto a dados de terceiros inseridos nas obras, os papéis e responsabilidades dependem das decisões efetivamente tomadas por cada envolvido; a Becker não presume ser controladora de todo conteúdo nem transfere integralmente suas obrigações aos autores.

## 2. Dados presentes no serviço

| Categoria                  | Dados e origem                                                                                                                                       | Uso no Trama                                                  |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Cadastro                   | Nome, nome de usuário, e-mail, identificador, perfil administrativo e datas; informados pelo administrador e atualizados pela conta ou administração | Identificar contas, permitir acesso e administrar o serviço   |
| Autenticação               | Senha fornecida no acesso, hash da senha, dados e token de sessão, datas de criação e expiração                                                      | Validar acesso, manter sessões e encerrar o acesso            |
| Obras e escrita            | Títulos, descrições, textos, identificadores, revisões e reservas de edição                                                                          | Organizar, salvar, recuperar, ler e exportar conteúdo         |
| Colaboração                | E-mail informado por quem convida, convites, participantes, respostas, remoções e datas                                                              | Gerenciar convites e autorizações de acesso                   |
| Preferências e recuperação | Tema, identificadores de acesso recente e rascunhos locais                                                                                           | Personalizar a interface e recuperar trabalho neste navegador |
| Atendimento                | Informações que a pessoa encaminhar ao canal de contato                                                                                              | Analisar pedidos e responder                                  |

A senha é processada para autenticação e armazenada como hash; não se deve interpretar isso como criptografia de todos os demais dados. Os textos podem conter dados pessoais que seus autores decidam inserir. Evite incluir informações sensíveis desnecessárias.

**Pendente de inventário:** metadados tratados pela infraestrutura, como endereço IP, registros de acesso, dispositivo e erros; categorias efetivamente registradas, finalidades, acesso e prazos devem ser confirmados antes da publicação. Não se declara ausência de registros de infraestrutura.

## 3. Finalidades e fundamentos

A proposta de enquadramento abaixo deve ser validada por operação antes da publicação. Ela não presume que todas as atividades possam usar a mesma base legal.

- Manter a conta e executar as funções solicitadas: execução de contrato ou procedimentos relacionados, quando seus requisitos forem atendidos.
- Atender obrigações legais e determinações válidas: cumprimento de obrigação aplicável, identificada conforme o caso.
- Defender direitos em processos: exercício regular de direitos, quando cabível.
- Prevenir abuso e gerenciar convites a pessoas ainda sem conta: avaliar fundamento específico; eventual legítimo interesse depende de necessidade, avaliação dos impactos e salvaguardas, não apenas da menção neste aviso.
- Usos opcionais que dependam de consentimento: informar separadamente a finalidade e permitir escolha e revogação. Não se considera o fornecimento do e-mail autorização genérica para marketing.

## 4. Quem pode ter acesso

O responsável e os organizadores ativos podem ler as obras conforme suas permissões. A exportação pelos recursos do Trama é exclusiva do responsável. O responsável gerencia convites e participantes. Administradores gerenciam cadastros; esse perfil não concede acesso direto às obras alheias. Para suporte, administradores podem personificar temporariamente contas comuns e acessar o conteúdo e as operações permitidos à conta representada, sem conhecer sua senha. A personificação dura até 15 minutos, tem aviso e ação de encerramento e não permite editar dados da conta nem usar funções administrativas.

A operação técnica pode exigir acesso restrito por pessoas autorizadas e fornecedores de infraestrutura para hospedagem, banco, suporte e segurança. Isso não equivale a acesso editorial irrestrito ou autorização de publicação. Solicitações de autoridades serão avaliadas conforme sua validade e necessidade.

**Pendente de confirmação operacional:** fornecedores efetivamente usados em produção, entidades contratadas, funções, regiões, suboperadores e condições de acesso. A documentação técnica cita Vercel e Neon, mas esse registro não substitui a conferência dos contratos e das configurações atuais.

A auditoria de personificação registra identificadores do administrador, da conta representada e da sessão, início, encerramento, prazo, método e caminho das operações de alteração e exportação, identificador de correlação e resultado HTTP quando disponível. Não registra corpos das requisições, senhas, cookies, tokens de convite ou conteúdo das obras. A auditoria é usada para atribuição de ações e investigação; sua base legal, retenção e acessos devem ser validados antes da publicação. Inícios e encerramentos explícitos são registrados em transação; uma tentativa registrada não comprova alteração concluída, e falhas no registro do resultado podem deixar a tentativa sem conclusão registrada.

A personificação utiliza a mesma sessão entre abas. Dados locais de navegação e rascunhos da conta representada podem permanecer neste navegador conforme as regras de recuperação; quem presta suporte deve usar dispositivo autorizado e tratar essas cópias com confidencialidade.

## 5. Processamento fora do Brasil

A infraestrutura pode envolver armazenamento ou acesso no exterior. **Antes da publicação, identificar países ou regiões e o mecanismo aplicável às transferências internacionais, conferindo contratos e salvaguardas dos fornecedores.** Não se presume que o aceite destes Termos autorize qualquer transferência ou que os dados permaneçam exclusivamente no Brasil.

## 6. Cookies e dados no navegador

| Recurso                   | Finalidade                                                                    | Duração ou comportamento observado                                                                          |
| ------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Cookie `trama_session_id` | Autenticação                                                                  | Expiração de 24 horas; o logout remove o cookie e expira a sessão atual                                     |
| Cookie `trama_theme`      | Preferência de tema                                                           | Validade de um ano                                                                                          |
| `localStorage`            | Identificadores de obras e capítulo recentes, separados por conta e navegador | Não sincroniza entre dispositivos; permanece até remoção ou limpeza aplicável                               |
| IndexedDB                 | Recuperação de rascunhos por conta e capítulo                                 | Cópias pendentes permanecem após logout para recuperação pela mesma conta; removidas ao salvar ou descartar |

A expiração de cookie ou sessão não significa necessariamente eliminação do registro correspondente no servidor. Em dispositivos compartilhados, considere a permanência de rascunhos locais ao encerrar o uso. A limpeza dos dados do navegador pode impedir sua recuperação.

**Pendente:** verificar cookies ou tecnologias adicionais usados na hospedagem real. Esta minuta não autoriza implantação de publicidade ou rastreamento opcional.

## 7. Exportações e compartilhamentos

A aplicação gera DOCX e PDF em memória para download, sem criar um acervo permanente dos arquivos exportados no banco. Os textos salvos que originam as exportações permanecem sujeitos às regras de armazenamento do serviço.

Quem baixa ou recebe um arquivo pode armazená-lo em outros dispositivos ou serviços. A remoção de acesso no Trama não elimina essas cópias. Limites de compartilhamento estão detalhados nos [Termos de Uso](terms-of-use.md).

## 8. Conservação e eliminação

**Pendente antes da publicação:** definir e informar os prazos ou critérios objetivos por categoria, incluindo cadastro, textos, convites, sessões expiradas, registros técnicos, atendimento, provas de aceite, auditoria de personificação e backups. Expiração de acesso, cancelamento de convite e remoção de participante não representam exclusão automática dos registros.

Os dados devem permanecer somente pelo período necessário às finalidades justificadas e às hipóteses legais de conservação. Retenções excepcionais devem ter fundamento, acesso limitado e duração definida. Cópias de backup exigem ciclo de expiração próprio a ser informado; não há promessa de apagamento instantâneo de toda cópia.

Pedidos de eliminação serão analisados mesmo quando a exclusão depender de procedimento administrativo ou adequação técnica. O vínculo de uma conta a obras não afasta automaticamente seus direitos.

## 9. Seus direitos e atendimento

Pelo contato informado, você pode solicitar confirmação e acesso, correção, informações sobre compartilhamento e análise de anonimização, bloqueio, eliminação, portabilidade e revogação de consentimento, quando aplicáveis. Cada pedido será tratado conforme seus requisitos e os direitos de outras pessoas.

Podemos solicitar elementos proporcionais para confirmar a identidade, sem exigir sua senha. Havendo impedimento, explicaremos a razão e o encaminhamento disponível. O atendimento observará os prazos aplicáveis; você também pode recorrer à ANPD e aos demais órgãos competentes.

## 10. Segurança e incidentes

O código atual utiliza controle de acesso, hash de senhas e cookies de sessão com proteções específicas. Essas medidas reduzem riscos, mas não garantem ausência de incidentes. Não se promete criptografia ponta a ponta ou criptografia de todos os campos do banco.

Suspeitas devem ser relatadas ao canal de contato. A Becker avaliará contenção, investigação e comunicações exigíveis às pessoas afetadas e às autoridades, conforme a situação e as regras aplicáveis. O compartilhamento indevido feito por um usuário não elimina deveres da Becker quando houver contribuição ou falha própria.

## 11. Crianças e adolescentes

**Política em definição:** não foi aprovada uma restrição automática a maiores de 18 anos. A admissão de menores exige avaliar capacidade civil, melhor interesse, bases legais e medidas proporcionais de proteção, inclusive requisitos do ECA Digital quando aplicáveis. Esta minuta não declara implementados verificação de idade, representação, assistência, supervisão parental ou consentimento de responsável.

Antes de disponibilizar o serviço a esse público, completar a avaliação e substituir este trecho por informações claras sobre o funcionamento efetivamente adotado, inclusive canal de atendimento a responsáveis. Uma declaração genérica de autorização não resolve, por si só, essas exigências.

## 12. Alterações e contato

A versão vigente deverá ser identificada e permanecer acessível. Mudanças relevantes serão comunicadas; finalidades que exijam escolha específica não serão introduzidas por simples alteração silenciosa do texto.

Contato para privacidade: **imbjr.work@gmail.com**.
