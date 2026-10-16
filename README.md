# nextjs-api-starter

Base reutilizável em JavaScript com Next.js (Pages Router), PostgreSQL, migrations, usuários e autenticação inicial, desenvolvida a partir dos estudos do curso.dev.

Criada a partir da branch project-template de igormbecker/Curso.Dev. As configurações versionadas em .env.development são exemplos para uso local. Configure credenciais próprias e um PASSWORD_PEPPER exclusivo no ambiente de produção.

## Tecnologias e dependências

As versões abaixo refletem o package.json atual. O Node usado pelo projeto é definido em .nvmrc.

- Node.js: 24.21.0
- Next.js: 16.3.8 (Pages Router)
- React e React DOM: 19.3.0
- PostgreSQL: 16.0-alpine3.18 (Docker)
- Cliente PostgreSQL para JavaScript: pg@8.23.1
- Migrações: node-pg-migrate@9.0.0
- Configuração de ambiente: dotenv@18.0.5 e dotenv-expand@1000.0.0
- Testes: jest@30.5.2
- Lint: eslint@9.39.5, eslint-config-next@16.3.8 e eslint-plugin-jest@29.16.6
- Formatação: prettier@3.9.9

Consulte package.json e package-lock.json para a lista completa e as versões instaladas.

## Banco de dados local

O PostgreSQL de desenvolvimento é iniciado pelo Docker Compose definido em infra/compose.yaml. As variáveis são lidas de .env.development. A aplicação usa as variáveis `POSTGRES_*`; o CLI de migrations usa `DATABASE_URL`, composta a partir dessas mesmas variáveis para manter o destino consistente. Os comandos `migrations:up` e `migrations:down` carregam esse arquivo.

O Trama usa o projeto Compose `trama`, com rede e volume próprios, separados do Curso.Dev. O PostgreSQL atende em `127.0.0.1:5433` no computador e mantém a porta `5432` dentro do container. O banco é `trama_dev`, com usuário `trama_user`. A aplicação usa a porta `3001`; o Curso.Dev pode continuar nas portas `5432` e `3000`. Os testes usam um ambiente separado, descrito abaixo.

Execute os scripts a partir desta pasta. Não sobrescreva o nome do projeto Compose com `-p` ou `COMPOSE_PROJECT_NAME`, nem reutilize as variáveis de banco do Curso.Dev. Variáveis já exportadas no terminal podem prevalecer sobre o arquivo de ambiente.

A suíte usa o banco descartável `trama_test`, em outro container e na porta `5434`. A limpeza dos testes recusa a configuração de desenvolvimento; sua conta e os dados em `trama_dev` são preservados.

```bash
docker ps -a
```

Para iniciar o banco em segundo plano:

```bash
npm run services:up
```

Para parar o banco, preservando o container:

```bash
npm run services:stop
```

Para parar e remover os containers do Compose:

```bash
npm run services:down
```

O volume nomeado `trama_database_data` preserva os dados quando o container é removido com `services:down`. Não use `docker compose down --volumes` se precisar preservar esses dados.

Para instalar o cliente psql no Ubuntu:

```bash
sudo apt install postgresql-client
```

Para conectar ao banco local:

```bash
psql --host=127.0.0.1 --username=trama_user --port=5433 --dbname=trama_dev
```

## Ambiente de desenvolvimento

Use o Node indicado pelo arquivo .nvmrc:

```bash
nvm install
nvm use
node --version
```

Depois de clonar o projeto, instale as dependências:

```bash
npm install
```

Abra a pasta do projeto no VS Code a partir do terminal Ubuntu/WSL:

```bash
code .
```

Inicie a aplicação:

```bash
npm run dev
```

Esse script inicia o banco, aguarda o PostgreSQL, aplica as migrações pendentes e inicia o Next.js. A aplicação fica disponível em http://localhost:3001.

## Scripts disponíveis

Confira sempre os scripts atuais em package.json.

- Verificar a formatação com Prettier:

  ```bash
  npm run lint:prettier:check
  ```

- Aplicar formatação com Prettier em todo o projeto:

  ```bash
  npm run lint:prettier:fix
  ```

- Verificar o código com ESLint:

  ```bash
  npm run lint:eslint:check
  ```

- Executar os testes de integração:

  ```bash
  npm run test
  ```

  Esse script inicia somente o PostgreSQL de testes, aguarda sua disponibilidade, inicia o Next.js de testes e executa Jest. Ao concluir, mesmo em caso de falha dos testes, encerra o servidor e para somente o banco de testes. Os testes de migrations recriam o schema `public` de `trama_test`.

- Executar os testes em modo watch:

  ```bash
  npm run test:watch
  ```

  Usa o mesmo ambiente isolado e mantém os serviços de teste ativos até encerrar o comando com Ctrl+C.

- Criar uma migration:

  ```bash
  npm run migrations:create -- nome-da-migration
  ```

- Aplicar migrations pendentes:

  ```bash
  npm run migrations:up
  ```

- Reverter a última migration:

  ```bash
  npm run migrations:down
  ```

## Ambiente de testes isolado

| Recurso                        | Desenvolvimento         | Testes                     |
| ------------------------------ | ----------------------- | -------------------------- |
| Arquivo de ambiente            | `.env.development`      | `.env.test`                |
| Projeto Compose                | `trama`                 | `trama-test`               |
| Banco PostgreSQL               | `trama_dev`             | `trama_test`               |
| Usuário PostgreSQL             | `trama_user`            | `trama_test_user`          |
| Porta PostgreSQL no computador | `5433`                  | `5434`                     |
| Servidor HTTP                  | `http://localhost:3001` | `http://127.0.0.1:3002`    |
| Arquivos gerados pelo Next.js  | `.next`                 | `.next-test`               |
| Volume Docker                  | `trama_database_data`   | `trama-test_database_data` |

Você pode manter `npm run dev` aberto enquanto executa `npm test` ou `npm run test:watch`. A configuração de Jest e o inicializador de testes carregam explicitamente `.env.test`, substituindo as variáveis de conexão herdadas do terminal. As credenciais desse arquivo são exemplos exclusivos do ambiente local de testes.

A trava de segurança exige o host, a porta, o usuário, o banco e o servidor HTTP de testes antes de permitir a limpeza do schema. Não altere esses valores para apontar para desenvolvimento ou produção. O inicializador recusa a execução se a porta `3002` já estiver ocupada e usa explicitamente o projeto Compose `trama-test`.

Para executar apenas testes unitários, sem iniciar Docker ou Next.js:

```bash
NODE_OPTIONS=--experimental-vm-modules npx jest --runInBand --testPathPatterns=tests/unit
```

Chamadas diretas a Jest também usam `.env.test`; os testes de integração precisam do servidor isolado ativo. Prefira os scripts `npm test` e `npm run test:watch` para executar a integração.

## Área autenticada e usuários

Após entrar, o menu dá acesso a `/works`. Administradores também acessam `/users`, com busca, listagem, cadastro, edição e remoção de usuários. A remoção pede confirmação e não permite excluir a própria conta. Na edição, deixar a nova senha em branco mantém a senha existente.

As contas recebem `is_admin = false` por padrão, inclusive quando criadas por um administrador. O cadastro público em `/register` permanece disponível. Administradores podem mudar o perfil de outra conta pelo formulário de edição. O último administrador não pode perder esse perfil; a regra é verificada em transação, inclusive em alterações concorrentes. Nenhuma migration promove pessoas por nome ou e-mail.

A listagem e as operações individuais da API exigem permissão administrativa verificada no banco a cada requisição. Respostas administrativas não expõem senhas ou hashes e usam `Cache-Control: private, no-store`.

## Preferência de tema

A seleção de tema claro ou escuro é salva no cookie `trama_theme` por um ano, com `Path=/`, `SameSite=Lax` e `Secure` em HTTPS. O cookie contém apenas `light` ou `dark`; valores inválidos usam o tema claro. Se o navegador bloquear cookies, a troca continua funcionando durante a navegação atual, sem garantia de persistência após recarregar.

O estado compartilhado fica em `components/theme/ThemeProvider.js`. O `getInitialProps` de `pages/_app.js` lê a preferência para renderizar o HTML inicial no tema escolhido. Isso desativa a otimização estática automática das páginas públicas; as respostas HTML usam `Cache-Control: private, no-store`. Não há consulta ao banco para o tema. A preferência por conta e a sincronização entre dispositivos ficam para uma próxima etapa.

## Minha conta

A rota autenticada `/account` permite editar nome, usuário, e-mail e a própria senha pelo endpoint `PATCH /api/v1/user`, que identifica a pessoa pela sessão e rejeita alterações de perfil. A aparência é alterada nessa mesma tela e continua sendo salva somente no cookie do navegador.

Visitantes continuam com o seletor de tema nas páginas públicas. Após entrar, o seletor fica disponível somente em Minha conta. O estado de autenticação usado na apresentação é compartilhado por `components/auth/AuthProvider.js`, com a API de usuário atual e o cache do SWR; permissões continuam sendo verificadas no servidor.

Em Minha conta, os campos Nova senha e Confirmar nova senha são opcionais. Quando preenchidos, precisam coincidir e respeitar o limite de 8 a 128 caracteres; deixá-los vazios preserva a senha atual. A confirmação é validada na interface e no servidor e não é armazenada. A edição administrativa de usuários também exige confirmação ao informar uma nova senha; os dois campos vazios preservam a senha existente.
