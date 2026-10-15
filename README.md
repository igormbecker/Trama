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

O Trama usa o projeto Compose `trama`, com rede e volume próprios, separados do Curso.Dev. O PostgreSQL atende em `127.0.0.1:5433` no computador e mantém a porta `5432` dentro do container. O banco é `trama_dev`, com usuário `trama_user`. A aplicação e os testes HTTP usam a porta `3001`; o Curso.Dev pode continuar nas portas `5432` e `3000`.

Execute os scripts a partir desta pasta. Não sobrescreva o nome do projeto Compose com `-p` ou `COMPOSE_PROJECT_NAME`, nem reutilize as variáveis de banco do Curso.Dev. Variáveis já exportadas no terminal podem prevalecer sobre o arquivo de ambiente.

Os testes ainda compartilham o banco local de desenvolvimento do Trama e apagam seus dados. A limpeza recusa configurações diferentes de `127.0.0.1:5433/trama_dev`, usuário `trama_user` e ambiente de teste. Esse banco deve conter apenas dados descartáveis.

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

  Esse script inicia o PostgreSQL e executa o Next.js junto com Jest. Os testes de migrations recriam o schema public; execute-os apenas com o banco local descartável.

- Executar Jest em modo watch:

  ```bash
  npm run test:watch
  ```

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
