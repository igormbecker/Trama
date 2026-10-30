# Gravação e transcrição por voz

A gravação é compartilhada entre o editor de capítulos/seções (inclusive contribuição atribuída) e Registrar ideia por voz em Seu espaço. Usa MediaRecorder no navegador, com até 2 minutos de áudio, sem contar pausas. A pessoa pode iniciar, pausar, continuar, concluir, ouvir e descartar. A gravação em andamento precisa da página aberta; encerramento pelo limite depende dos eventos do navegador, que podem atrasar em segundo plano. Validar em aparelho real.

## Integração com a IA

1. Ao concluir, o áudio permanece no navegador. Não há envio automático.
2. Transcrever com Groq envia o áudio para POST /api/v1/voice-transcriptions, com sessão e aceite legal atuais.
3. A rota valida origem de navegação, tipo e tamanho (até 4 MiB); o model reserva uma tentativa no PostgreSQL com trava transacional e encaminha à infraestrutura.
4. infra/transcription.js chama a API da Groq usando whisper-large-v3-turbo, idioma pt, verbose_json e temperatura zero. A chave nunca vai para o navegador.
5. O texto retorna como prévia editável. Não há segunda chamada para reescrever ou organizar: pontuação e parágrafos dependem da transcrição e podem ser corrigidos pela pessoa.
6. Inserir no final acrescenta parágrafos de texto simples ao editor, preserva o conteúdo existente e usa desfazer, reserva, revisão, recuperação e salvamento atuais. Texto semelhante a HTML é tratado como texto.
7. Salvar como rascunho reutiliza quick-drafts, com initial_document validado e salvo na mesma transação de obra, parte e capítulo. Repetições retornam o mesmo projeto e nunca substituem texto existente.

## Configuração

Criar GROQ_API_KEY no servidor. Em desenvolvimento, colocá-la em .env.development.local, ignorado pelo Git, e reiniciar o servidor; não usar .env.development, que é versionado. Não enviar a chave por chat ou registrá-la em logs. Preview e Production têm configurações independentes e exigem novo deploy para receber mudanças de variável. Ter variável configurada não comprova envio real ou deploy.

A migration 1793360000000_create-voice-transcription-attempts cria o controle de tentativas; 1793361000000_add-voice-transcription-duration acrescenta os segundos contabilizados, preservando os registros anteriores com reserva de 120 segundos. O controle de duração também foi aplicado no desenvolvimento local trama_dev, em 127.0.0.1:5433, após conferir o destino e a lista de pendências; o deploy remoto segue o mecanismo de migrations já existente. Nenhum deploy faz parte desta implementação.

Sem chave, a API informa indisponibilidade antes de reservar uma tentativa. Os testes não usam a chave real: simulam o provedor e exercitam multipart HTTP com um servidor local. Não há fallback para outro provedor ou modelo pago.

## Limites do beta

Limite aprovado: 30 minutos (1.800 segundos) por conta em janela móvel de 24 horas, mantendo até 2 minutos por gravação. Não há mais limite de duas tentativas. Cada envio reserva 120 segundos sob trava transacional enquanto é processado; após sucesso, a reserva é reduzida para a duração informada pela Groq, arredondada para cima, com mínimo de 10 segundos por envio (mínimo faturável do provedor) e máximo de 120 segundos, desconsiderando até 2 segundos de fechamento do contêiner.

São necessários 120 segundos de saldo para iniciar uma nova transcrição, inclusive se ela for curta; com menos saldo, aguardar a liberação na janela móvel. Esse requisito evita ultrapassagem concorrente sem confiar na duração declarada pelo navegador. Falhas ou resposta sem duração confiável mantêm a reserva de 120 segundos. Recusas antes da reserva não consomem saldo. Proteções compartilhadas separadas permanecem em 15 envios/minuto, 50/hora e 200/24 horas; o limite pessoal não garante disponibilidade da cota externa.

As cotas são compartilhadas entre as instâncias do mesmo banco. Preview e Production com bancos diferentes não compartilham este contador, mas podem compartilhar a cota da organização Groq; reservar margem e conferir o painel. A cota externa pode ser consumida por outros ambientes ou ferramentas. Ao atingir limites, a API retorna 429, sem envio automático ou migração de plano.

O navegador limita o tempo da captura; o servidor limita bytes e confere a duração informada pela Groq quando disponível, tolerando até 2 segundos de fechamento do contêiner. Essa conferência ocorre após a transcrição: não é uma análise independente de duração nem garante o custo máximo de arquivos adulterados enviados diretamente à API. Antes de abrir ao público, avaliar inspeção de duração/conteúdo antes do envio e controles contra abuso. Não promover o plano da conta automaticamente.

## Recuperação e privacidade

Áudio concluído e prévia ficam em IndexedDB por conta e destino até aplicar ou descartar, inclusive após logout. Contribuições usam a chave própria de recuperação existente. Falhas de sessão, cota ou rede preservam os dados locais; indisponibilidade de IndexedDB exibe aviso. Gravação em andamento ainda não é persistida. Ao sair ou fechar, encerrar as trilhas do microfone e revogar URLs de reprodução.

O servidor mantém os bytes somente durante a requisição e não persiste áudio/transcrição; a tabela de tentativas guarda conta, horário e segundos contabilizados. Não há rotina automática de exclusão desses metadados nesta versão; sua retenção precisa ser definida antes de uso amplo. O processamento e a retenção na Groq dependem da política/configuração do provedor: revisar o aviso de privacidade antes da disponibilização remota. O aviso na interface identifica o envio à Groq e a persistência local; não representa revisão jurídica concluída.

A prévia de uma ideia fica bloqueada após iniciar sua criação, para que uma resposta incerta possa ser repetida com o mesmo conteúdo. Descartar a gravação não apaga um projeto que eventualmente já tenha sido criado. A exclusão de um projeto continua pelo fluxo de lixeira existente.

## Validação pendente

- Configurar a chave local e avaliar áudio real em português, nomes, silêncio, ruído, pontuação e parágrafos.
- Validar microfone e permissões em HTTPS/localhost; HTTP por IP da rede pode não oferecer getUserMedia.
- Conferir Safari/iPhone e Android: iniciar, pausar/retomar, limite, concluir, ouvir, descartar, interrupção, teclado, temas e recuperação após reload/logout.
- Exercitar reserva expirada, contribuição, limite do documento, desfazer e falhas de navegação na interface.
- Validar Preview, migrations, cotas efetivas, privacidade e monitoramento antes de publicar.
