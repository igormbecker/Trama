# Revisão e implantação dos documentos legais

Registro interno de 18/10/2026. O usuário autorizou implementar e ativar o fluxo para contas existentes, mantendo o cadastro público fechado. Páginas e aceite estão implementados localmente; isso não confirma deploy remoto nem constitui parecer jurídico ou comprovação de conformidade.

## Documentos

- [Termos de Uso](terms-of-use.md): conta, autoria, permissões, convites, cópias, exportações, limites de responsabilidade, disponibilidade e encerramento.
- [Aviso de Privacidade](privacy-notice.md): dados, finalidades, acesso, navegador, conservação, direitos e segurança.

Responsável informada pelo usuário: Becker Tecnologia e Desenvolvimento de Software. Contato informado: imbjr.work@gmail.com. CNPJ informado: 65.457.811/0001-61. Sede informada: Rua General Salvador Pinheiro, 725, Vila Jardim, Porto Alegre/RS. O usuário confirmou Vercel e Neon; não houve auditoria cadastral ou contratual nesta entrega.

## Decisões e conferências pendentes

- Identificação e endereço foram fornecidos pelo usuário e incorporados aos textos. Conferir enquadramento e obrigações de encarregado/canal, cadastro e contratos sem presumir auditoria realizada.
- Validar cada base legal, inclusive criação administrativa de conta, convite de pessoa ainda não cadastrada e eventual tratamento de dados de terceiros nas obras. Separar dados comuns de dados sensíveis quando necessário.
- Validar a finalidade, a base legal, os acessos e a retenção da auditoria de personificação; conferir divulgação clara do acesso administrativo indireto e procedimentos de suporte e sigilo. A implementação não substitui essa avaliação.
- Conferir fornecedores de produção, contratos, registros técnicos, regiões, suboperadores, acessos técnicos e transferências internacionais. Não publicar garantias de criptografia ou auditoria que não tenham sido verificadas.
- Definir critérios ou prazos de retenção e descarte por categoria, inclusive backups e logs; implementar o que for necessário para cumprir o que será informado. Expiração de sessão não equivale a exclusão do registro.
- Definir procedimento de encerramento e atendimento a titulares, inclusive contas responsáveis por obras: hoje a exclusão dessas contas é bloqueada e não há transferência implementada. Não apresentar esse limite técnico como exceção geral à LGPD.
- Preparar procedimento de resposta a incidentes e avaliar obrigações de registro de acesso conforme o enquadramento do serviço; não inventar prazos de retenção.
- Revisar as minutas juridicamente antes da publicação, especialmente responsabilidade, direitos autorais, direitos do consumidor, menores e papéis de tratamento.

## Faixa etária

O usuário escolheu participação do responsável para uso por menores. Não foi adotada restrição automática a maiores de 18 anos. Os textos orientam contato e avaliação antes da liberação administrativa; verificação automática de idade, prova de autorização parental e supervisão não foram implementadas. A atividade de escrita não determina, por si só, uma exclusividade para adultos; também não dispensa a avaliação de acesso por menores.

Antes da publicação, definir o público, avaliar o acesso provável por crianças e adolescentes, conteúdo disponível, convites, exportações e riscos. Verificar requisitos de privacidade e segurança, eventual representação ou assistência e medidas de idade e supervisão proporcionais e legalmente exigíveis. Não coletar documentos ou datas de nascimento sem necessidade demonstrada. Não presumir que uma cláusula “18+” ou “com autorização dos pais” resolva o enquadramento.

## Fluxo de aceite implementado em 18/10/2026

- Disponibilizar os documentos completos, com links públicos e versões identificadas, antes do aceite.
- No futuro cadastro público, solicitar antes de concluir a criação da conta uma ação explícita, desmarcada por padrão: “Aceito os Termos de Uso e declaro ciência do Aviso de Privacidade.” Para contas criadas pelo administrador e contas antigas sem aceite registrado, solicitar após autenticar e antes de acessar a área de trabalho.
- A criação administrativa da conta não registra aceite pelo usuário. Contas existentes precisam do fluxo correspondente; não retroagir ou fabricar aceite.
- Registrar no servidor usuário, data e hora, versões dos dois documentos e identificador ou hash das versões imutáveis. Minimizar dados de prova; não coletar IP ou dispositivo automaticamente sem justificar necessidade e retenção.
- A ciência do Aviso não é consentimento universal. Usos opcionais que exijam consentimento precisam de escolha própria e procedimento de revogação.
- Na recusa dos Termos, não concluir o cadastro público. Em contas existentes, restringir as funcionalidades nas páginas e nas APIs enquanto não houver aceite; manter documentos, saída e contato acessíveis e um caminho para solicitar recuperação de conteúdo/dados e encerramento. Não apagar automaticamente os dados pela recusa. A recusa de consentimentos opcionais, como marketing, não bloqueia o serviço.
- Mudanças relevantes devem ser comunicadas; avaliar novo aceite e manter as versões anteriores. Não substituir retroativamente o texto aceito.

O fluxo para contas existentes foi implementado por autorização posterior do usuário. `/terms` e `/privacy` são públicos, com histórico por `?version=`; `/legal/accept` usa sessão e `/legal/support` mantém o canal de pedidos acessível mesmo na recusa. Abertura do cadastro público e deploy remoto não foram autorizados nesta entrega.

## Versão e provas

- A versão ativa está em `infra/legal/2026-10-18-v1.json`. Não editar uma versão já aceita: criar novo arquivo e identificador e atualizar o model para a nova versão.
- Os hashes SHA-256 cobrem os textos exatos. Na primeira aceitação, a transação preserva os textos e hashes em `legal_document_releases` e grava conta/data/versão em `legal_acceptances`; repetições não alteram a primeira data. Um conflito de conteúdo com o mesmo identificador é recusado.
- Páginas protegidas redirecionam pendências para o aceite; APIs retornam `LegalAcceptanceRequiredError` (403). GET da própria conta, consulta/registro de aceite, documentos, contato, status, login e logout preservam os caminhos necessários. Personificação não aceita por terceiros e só inicia quando administrador e conta representada aceitaram.
- Nenhuma conta real recebe aceite automático. O helper de testes cria fixtures aceitas por padrão, com opção `skipLegalAcceptance`, exclusivamente no ambiente isolado.
- O usuário preferiu decidir prazos de exclusão, logs e backups posteriormente. O aviso declara essa condição e usa critérios de necessidade e obrigações aplicáveis, sem prometer rotina automática ou prazo numérico ainda inexistente. Essa pendência continua aberta e deve ser resolvida operacionalmente; habilitar o aceite não significa resolvê-la.
- Não coletamos IP ou dispositivo como prova de aceite. Aceites vinculados são removidos com a exclusão da conta; as versões dos documentos permanecem sem identificar usuários. Avaliar conservação de provas conforme necessidade e fundamento antes de alterar essa regra.

## Fontes oficiais consultadas

As cláusulas operacionais são propostas para o Trama e dependem de aprovação e correspondência com a prática. As fontes abaixo orientam a revisão e não certificam os documentos.

- [LGPD](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm): conferir bases legais, transparência, conservação, transferências, segurança e responsabilidades.
- [Direitos dos titulares — ANPD](https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados/direito-dos-titulares): referência para atendimento e exercício de direitos.
- [Lei de Direitos Autorais](https://www.planalto.gov.br/ccivil_03/leis/l9610.htm): referência para titularidade, autorização e uso de obras; permissões da interface não transferem direitos autorais.
- [Código de Defesa do Consumidor](https://planalto.gov.br/ccivil_03/leis/l8078compilado.htm): conferir limites das cláusulas de responsabilidade e direitos obrigatórios quando houver relação de consumo.
- [Enunciado da ANPD sobre crianças e adolescentes](https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-divulga-enunciado-sobre-o-tratamento-de-dados-pessoais-de-criancas-e-adolescentes): referência sobre bases legais e melhor interesse.
- [Lei nº 15.211/2025 — ECA Digital](https://planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15211.htm) e [Decreto nº 12.880/2026](https://planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/d12880.htm): avaliar incidência e medidas adequadas ao público e aos riscos reais.
