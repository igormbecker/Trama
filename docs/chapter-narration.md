# Narração e armazenamento de áudio

O piloto em Ler obra continua restrito a administradores com acesso ao projeto. A rota verifica sessão, permissão, capítulo e versão do texto antes de consultar o áudio.

## Armazenamento privado

O store `trama-narration` foi criado como privado em São Paulo (`gru1`) e vinculado ao Trama. O SDK usa `BLOB_STORE_ID` com OIDC ou `BLOB_READ_WRITE_TOKEN`, disponibilizados pela conexão do store. Nunca copie os valores para arquivos versionados.

Os trechos são guardados por ambiente, projeto, capítulo, voz e hash do texto. Textos idênticos no mesmo contexto reutilizam o áudio. Alterar o texto ou a voz usa outra chave. Preview, produção e desenvolvimento têm prefixos diferentes no mesmo store e compartilham sua franquia. Sem credenciais de Blob, o piloto local mantém a geração sem armazenamento remoto.

O arquivo permanece privado. A resposta de áudio passa pela rota autorizada do Trama; URLs do Blob não são devolvidas ao navegador. Uma falha de acesso ao armazenamento interrompe a solicitação, evitando uma nova geração em cada tentativa quando o cache está inacessível.

## Limpeza manual

A limpeza considera a data de upload, não a última reprodução. Ela pode remover também um áudio ainda correspondente ao texto atual. Ao ouvir novamente, o trecho será gerado de novo.

Com as credenciais do store já disponíveis no ambiente do processo, execute no Ubuntu, na raiz do projeto:

```bash
node infra/scripts/clean-narration-audio.mjs --environment=preview --days=30
```

Esse comando somente lista os arquivos anteriores a 30 dias e soma os bytes. O prazo de 30 dias é um exemplo, não uma política automática de retenção. Após revisar a lista, acrescente `--delete` para efetivar a remoção:

```bash
node infra/scripts/clean-narration-audio.mjs --environment=preview --days=30 --delete
```

Escolha explicitamente o ambiente em cada execução. A limpeza alcança somente o prefixo `narration/<ambiente>/`. Ela não apaga o texto dos capítulos, marcadores ou progresso de leitura. Não existe expiração automática.

## Geração na Vercel

O repositório inclui a função Python em `api/internal/narration.py` e as dependências em `pyproject.toml`, fixando Python 3.12 e PyTorch para CPU. A rota autenticada de narração continua no Pages Router. Ela consulta o Blob e, quando o trecho ainda não existe, chama a função Python no mesmo deployment, usando `VERCEL_URL`.

Configure `TRAMA_NARRATION_SECRET` com pelo menos 32 caracteres aleatórios no ambiente da Vercel. Essa chave assina o corpo e o horário da chamada interna com HMAC-SHA256; a função rejeita assinaturas inválidas e horários fora de 60 segundos antes de importar o Kokoro. A chave foi configurada somente no preview durante a implementação. Nunca use um nome `NEXT_PUBLIC_` para esse segredo.

A chamada interna também usa OIDC da Vercel para atravessar a proteção do próprio deployment. O acesso padrão do projeto a si mesmo deve estar disponível em Trusted Sources. As chamadas não usam o hostname recebido do navegador.

Em produção/preview, a geração é habilitada quando `VERCEL=1`, `VERCEL_URL` e a chave interna estão presentes. Em desenvolvimento, a geração continua usando `TRAMA_KOKORO_PYTHON`. Uma síntese por processo Node e por instância Python é admitida; isso não constitui uma fila ou limite global entre instâncias da Vercel.

Blocos grandes são divididos em trechos de aproximadamente 500 caracteres, preferindo espaços nas frases longas. A função Python aceita no máximo 1.000 caracteres por chamada e WAV de até 4 MB. O prazo configurado é de 120 segundos na função Python e 180 segundos na rota Next.js. Cancelar a leitura interrompe a chamada HTTP e a reprodução; não há garantia de encerramento imediato de uma síntese Python que já tenha começado.

## Preparação da produção

Antes de habilitar narração em produção:

1. Validar um capítulo com sessão administrativa no preview completo, incluindo segundo acesso pelo Blob, troca de voz e retomada.
2. Medir o início da reprodução e os bytes dos blocos de um capítulo representativo, inclusive no celular.
3. Confirmar acesso privado e limpeza usando apenas arquivos de teste no prefixo de preview.
4. Habilitar Large Functions para produção, verificar Fluid Compute e configurar uma chave interna própria para esse ambiente.
5. Conferir a conexão do Blob e o fluxo de migrations do deploy habitual.

O preview de implementação usa `npm run build` como exceção apenas no pacote enviado à Vercel, para testar sem executar migrations remotas. O `vercel.json` versionado preserva `npm run migrations:deploy && npm run build`.

## Validação e pendências

O usuário confirmou a geração da Dora em uma função isolada no preview. O build local do Next.js e o build do preview completo passaram. A suíte unitária foi executada com o suporte ESM utilizado pelo executor normal do projeto. Testes Python cobrem assinatura, expiração, dados inválidos e falhas de geração sem devolver segredos.

O conector recebe 403 da proteção do preview antes de alcançar a aplicação. A validação com uma sessão real do Trama no preview, upload/reutilização/remoção reais do Blob e medições por capítulo continuam pendentes. O build local mostrou um aviso de CSS sobre `::highlight(trama-narration)`; o destaque precisa ser conferido no navegador.

A franquia Hobby inclui 1 GB de armazenamento e limites de transferência e operações. Excluir arquivos libera capacidade, mas não devolve as operações e transferências já consumidas no mês. Os áudios atuais são WAV e seu tamanho deve ser medido antes de estimar quantos capítulos cabem na franquia. Confira o consumo no painel e os [preços atuais da Vercel](https://vercel.com/pricing).
