# Migrations no build da Vercel

O `vercel.json` define o comando de build:

```bash
npm run migrations:deploy && npm run build
```

Cada build de production ou preview aplica as migrations pendentes antes de compilar o Next.js. A tabela `pgmigrations` mantém o histórico; quando não há pendências, o build continua normalmente. Qualquer falha no comando de migrations retorna código diferente de zero e impede a compilação.

## Configuração por ambiente

Na Vercel, `DATABASE_URL_UNPOOLED` deve conter a conexão **direta** do banco Neon correspondente ao ambiente: production para produção e preview para homologação. Não usar hostname com `-pooler`. `DATABASE_URL` continua sendo a conexão da aplicação, mas não é usada como alternativa por esse comando.

O script exige `VERCEL=1` e `VERCEL_ENV=production` ou `preview`, fornecidos pela plataforma. Não carrega `.env.development`, não inicia Docker e recusa URLs locais. A conexão exige TLS com validação de certificado. O comando local `npm run build` continua apenas compilando; o desenvolvimento mantém `npm run migrations:up` no fluxo de `npm run dev`.

O build deve aparecer nos logs como `npm run migrations:deploy && npm run build`. Conferir isso no próximo deploy, inclusive se houver uma configuração antiga de Build Command no painel ou uma configuração específica da branch. Não publicar manualmente um build antigo para tentar executar migrations: esse comando só roda quando há um novo build.

## Concorrência e falhas

O runner usa a trava advisory nativa do `node-pg-migrate`, compartilhada com o runner da API. Builds simultâneos aguardam a liberação por até 60 segundos; se o prazo terminar, o build falha e pode ser repetido. A trava também protege a leitura do histórico, evitando que ambos apliquem a mesma migration. O limite de espera vale também para outras travas de banco exigidas pelas migrations.

As migrations pendentes executam em uma transação, com verificação de ordem e sem `down` automático. Não adicionar migrations que desabilitem transações sem avaliar a perda dessa garantia. O script encerra a conexão e registra somente quantidade aplicada ou código seguro de erro, sem credenciais ou SQL.

Uma migration concluída permanece aplicada se a compilação seguinte falhar. O deploy anterior pode continuar atendendo durante o build; por isso as migrations precisam ser compatíveis com a versão ainda em execução. Preferir adições e mudanças em etapas; exclusões e renomeações incompatíveis precisam de planejamento próprio. Rollback de aplicação não desfaz esquema.

## Validação

Os testes unitários verificam seleção obrigatória da conexão direta, recusa de ambiente/URL indevidos, configuração da trava e da transação, propagação de falhas, encerramento da conexão e bloqueio do comando fora da Vercel. A concorrência real e a execução com as credenciais remotas devem ser conferidas no próximo deploy de preview antes de promover para produção. Preparar os arquivos localmente não executa migrations nos bancos remotos.
