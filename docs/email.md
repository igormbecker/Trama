# Base de e-mails do Trama

## Escopo

Infraestrutura para recuperação de senha, confirmação de e-mail e convite para projeto (obra ou trabalho em grupo). Esses fluxos já usam o envio; o convite administrativo com definição inicial de senha permanece pendente. Não há endpoint genérico de disparo.

`infra/email.js` centraliza o transporte; `models/transactional/index.js` gera HTML e texto simples usando React Email. As regras de negócio continuam nos models de cada funcionalidade. A recuperação usa `waitUntil` de `@vercel/functions` para manter o envio ativo após a resposta genérica; não usar promessas soltas sem aguardar ou sem esse mecanismo nas funções da Vercel. Isso não constitui fila durável.

## Confirmação de e-mail

Novas contas, inclusive administrativas e criadas por convite de projeto, recebem confirmação. Contas anteriores à migration ficam dispensadas, sem registro fictício de confirmação. Mudanças de e-mail, inclusive administrativas, exigem confirmar o novo endereço e invalidam os links anteriores, mesmo quando o endereço antigo é restaurado.

`POST /api/v1/email-verification` aceita `{ email }` e responde sempre `202` para endereços válidos, sem revelar existência, confirmação prévia ou limitação de envio. O envio usa `waitUntil`, não uma fila durável. Reenvios são limitados por hash do endereço: uma solicitação por minuto e até cinco por hora. Falhas de entrega removem o token e registram somente mensagem operacional genérica; a pessoa pode solicitar outro link em `/verify-email`, também acessível pelo login.

O link tem token aleatório de 48 bytes no fragmento `#token=...`, expira em 24 horas e exige confirmação explícita na página. `PATCH /api/v1/email-verification` aceita `{ token }`, consome o link e os demais links da conta em transação. O banco guarda somente SHA-256, endereço e geração da verificação. Links expirados, consumidos ou vinculados a outra geração/endereço não funcionam. Não cria sessão nem aceite legal. Personificação não pode confirmar ou pedir envio em nome de terceiros.

Login só informa pendência de confirmação após a senha correta. A tela inicial não mostra link de confirmação; após essa resposta, permanece no login, limpa a senha e oferece “Precisa de outro link?” junto da orientação para confirmar o e-mail. Trocar o endereço ou iniciar outra tentativa remove esse aviso. E-mail desconhecido e senha incorreta têm a mesma resposta e ambos executam bcrypt. Sessões de contas com confirmação pendente não liberam operações autenticadas. A confirmação comprova acesso à caixa postal, não humanidade; limites de login/IP e outras proteções contra abuso seguem pendentes.

Cadastro por convite devolve a mesma mensagem `202` para endereço novo ou existente, sem dados pessoais da conta. Uma repetição não altera nome, senha, perfil ou participação da conta existente. O cadastro público continua fechado; a administração mantém informações explícitas de duplicidade por já ter acesso às contas.

## Ambientes de envio

| Ambiente        | Transporte                                                                                             | Configuração                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Desenvolvimento | MailCatcher, SMTP `127.0.0.1:1026`, caixa em `http://localhost:1081`                                   | Sem chave Resend; remetente local próprio                                         |
| Testes          | MailCatcher exclusivo do Compose `trama-test`, SMTP `127.0.0.1:1027`, caixa em `http://localhost:1082` | Sem envios externos, inclusive com variáveis de produção herdadas                 |
| Preview         | Resend                                                                                                 | `VERCEL_ENV=preview`, `RESEND_API_KEY`, `EMAIL_FROM` e `EMAIL_PREVIEW_RECIPIENTS` |
| Production      | Resend                                                                                                 | `VERCEL_ENV=production`, `RESEND_API_KEY` e `EMAIL_FROM`                          |

O modo local é determinado por `NODE_ENV=development|test` e sempre prevalece sobre credenciais ou variáveis herdadas. Fora desse modo, ambientes Vercel desconhecidos são bloqueados. As portas do Trama são próprias para evitar colisão com o MailCatcher do Curso.Dev. Os containers de e-mail não têm volume persistente e escutam somente em loopback no host.

O usuário confirmou no painel: domínio `etrama.bectec.com.br` verificado, região São Paulo, chaves separadas `trama-production` e `trama-preview`, limitadas ao envio e ao domínio, e `EMAIL_FROM=Trama <notificacoes@etrama.bectec.com.br>` cadastrado para ambos os ambientes. Valores das chaves não são versionados. Esse registro não comprova envio real nem deploy desta implementação.

### Lista permitida do preview

Antes de habilitar os fluxos no preview, cadastrar **somente em Preview** a variável `EMAIL_PREVIEW_RECIPIENTS`, com endereços de teste autorizados separados por vírgula. A lista compara endereços completos, ignorando maiúsculas e espaços externos. Não aceita domínios inteiros ou curingas. Sem lista, ou para destinatário não listado, o envio é bloqueado antes de chamar o Resend; não há redirecionamento silencioso da mensagem para outra pessoa. Chaves distintas não isolam as cotas da conta Resend.

## Uso interno

```javascript
import email from "infra/email.js";
import { renderMessage } from "models/transactional/index.js";

const content = await renderMessage({
  title: "Uma mensagem do Trama",
  paragraphs: ["Seu texto de apresentação."],
  actionLabel: "Abrir Trama",
  actionUrl: "https://trama.bectec.com.br/login",
});

await email.send({
  to: recipientEmail,
  subject: "Uma mensagem do Trama",
  ...content,
  idempotencyKey: `invitation/${invitationId}`,
});
```

O exemplo não implementa convite. A URL deve ser construída pelo model usando origem confiável do ambiente, nunca a partir de um cabeçalho Host não validado. O renderer aceita HTTPS e HTTP de loopback somente no modo local, rejeita credenciais na URL e escapa os textos. Mensagens aceitam um único destinatário simples, sem CC/BCC ou substituição do remetente pelo chamador.

O retorno `{ id }` indica aceitação pelo transporte, não comprova entrega na caixa do destinatário. Falhas resultam em `ServiceError` genérico, sem incorporar corpo, destinatário ou credenciais do provedor. O envio remoto tem timeout de dez segundos; o SMTP local também tem limites de conexão e resposta. Não há repetição automática: após timeout, o provedor pode já ter aceitado a mensagem. Usar uma chave de idempotência estável por evento ao implementar repetição no Resend. Não há fila durável ou confirmação por webhook nesta entrega.

## Verificação

`npm run dev` chama `services:up`, que inclui o MailCatcher de desenvolvimento no loopback; `services:stop` para os serviços locais preservando o volume do banco. `npm test -- tests/unit/infra/email.test.js tests/unit/models/transactional.test.js tests/integration/email/send.test.js` sobe e para somente os serviços isolados de teste. O teste SMTP usa destinatário fictício e confirma as duas partes da mensagem capturada, sem enviar ao Resend nem limpar o esquema do banco.

Convites de organizador agora são enviados ao endereço informado, usando origem confiável e link válido por sete dias. A API não devolve o token; o banco guarda somente seu hash. Se o endereço ainda não tiver conta, o link permite criar uma conta comum limitada àquele e-mail. A conta não recebe participação nem aceite legal automaticamente: a pessoa entra, aceita os documentos atuais e responde ao convite. Falha de envio cancela o novo convite e, quando ainda possível, preserva o convite pendente substituído.

Envio real pelo Resend e aparência em Gmail/Outlook ainda devem ser validados no preview. Antes dos envios reais, revisar o aviso de privacidade para refletir o provedor e o tratamento de mensagens. O convite administrativo de acesso à conta com definição inicial de senha continua pendente.

## Recuperação de senha

- `/login` oferece “Esqueci minha senha”, que abre `/forgot-password`. POST `/api/v1/password-recovery` recebe somente `{ email }` e responde 202 com a mesma mensagem para endereço cadastrado ou desconhecido. O envio é processado via `waitUntil`; a resposta não confirma entrega nem revela tokens.
- O limite persistido é de um pedido por minuto e cinco por janela de uma hora por endereço normalizado. A tabela `password_recovery_requests` guarda somente SHA-256 do endereço e contadores, inclusive para endereços desconhecidos. Isso não substitui uma proteção global contra abuso distribuído na plataforma. Retenção/limpeza desses registros e dos tokens ainda precisa de definição operacional; não existe tarefa de limpeza automática.
- O token tem 48 bytes aleatórios (96 caracteres hexadecimais), validade de 15 minutos e uso único. Somente SHA-256 é armazenado em `password_recovery_tokens`, junto à conta, ao e-mail de emissão e a uma impressão SHA-256 do hash de senha atual. Alterar e-mail ou senha invalida os links anteriores. Em falha de envio, o token daquele pedido é removido; a cota de tentativas continua consumida.
- O link usa `/reset-password#token=...`. O fragmento só é lido no navegador, não vai no HTTP inicial e não é copiado para o link de retorno da página de status. As páginas e a API têm cache privado sem armazenamento e `Referrer-Policy: no-referrer`. O token não é persistido em localStorage nem enviado em query string.
- A origem é fixa em produção (`https://trama.bectec.com.br`); em preview vem de `VERCEL_URL`, validado como hostname `*.vercel.app`; em desenvolvimento é `http://localhost:3001`, e no servidor isolado de testes é `http://127.0.0.1:3002`. Nunca é derivada de Host ou de cabeçalhos encaminhados enviados pelo cliente. A proteção de acesso da Vercel ao preview pode exigir login na Vercel para abrir o link daquele ambiente.
- PATCH `/api/v1/password-recovery` recebe `{ token, password, password_confirmation }`. Exige confirmação idêntica e senha de 8 a 128 caracteres. A troca usa o hash/pepper existente e transação com trava da conta, revalidação e consumo dos tokens. Todos os links pendentes e as sessões da conta são invalidados, inclusive sessões que a estejam personificando; sessões de outras contas são preservadas.
- Após a troca, há aviso por e-mail sem a senha e retorno ao login, sem autenticar automaticamente. Falha no envio do aviso não desfaz uma troca já confirmada. Pedidos e redefinições não exigem aceite legal, mas não registram aceite nem liberam acesso às obras; sessões em personificação não podem executar essas ações.
- A migration `1792270000000_create-password-recovery` cria as duas tabelas. Foi aplicada somente no banco descartável de testes nesta implementação; desenvolvimento e ambientes remotos ainda precisam aplicá-la antes de usar a funcionalidade. Não houve deploy ou envio real ao Resend por esta entrega.
