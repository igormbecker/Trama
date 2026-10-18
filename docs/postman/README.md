# Collection Trama

1. No Postman, clique em Import e selecione trama.postman_collection.json. Se houver uma collection trama, importe como cópia para conferir antes de substituir a sua.
2. Abra a collection → Variables. Você pode continuar usando No Environment: cada pasta usa sua própria URL e credenciais.
3. Preencha prd_password, hml_password ou localhost_password para o ambiente desejado. Os e-mails estão como admin@example.com: substitua pela conta administrativa de cada ambiente. Use valores locais/privados ou migre as senhas para o Postman Vault; não compartilhe/exporte credenciais preenchidas.
4. Na pasta desejada, envie POST /api/v1/sessions. O cookie é guardado pelo Postman para aquele host; não é necessário copiar o token nem configurar Bearer.
5. Envie GET /api/v1/user para conferir a conta e depois GET /api/v1/migrations para listar as pendências.
6. POST /api/v1/migrations aplica as pendências no banco do ambiente. Envie individualmente após conferir URL e lista. Não rode a collection inteira no Runner: também há criação e edição de usuários.

## Variáveis e exemplos

- base_url: https://trama.bectec.com.br
- localhost_url: http://localhost:3001
- hml_url: último preview do Trama identificado no painel. A URL da captura do usuário era do Curso.Dev e não foi reutilizada. Confira o deployment desejado na Vercel e atualize esta variável se necessário. Uma URL protegida pode exigir autenticação adicional da Vercel; o login do Trama não substitui essa proteção.
- Cada pasta possui <ambiente>_email, <ambiente>_password, <ambiente>_username e <ambiente>_new_user_password.
- GET/PATCH users usa o username fictício usuario.exemplo até você escolher o alvo. Não substitui automaticamente pelo administrador autenticado.
- POST users e PATCH users contêm exemplos fictícios prontos para editar. A criação não atribui perfil administrativo e não aceita documentos por ninguém.
- A collection contém 30 requisições, 10 em cada pasta: login, própria conta, status, GET/POST migrations, GET/POST users, GET/PATCH users por username e logout.

## Cookie e respostas

Mantenha o cookie jar habilitado (já configurado nas requisições). Para verificar, use Cookies no Postman e procure trama_session_id no domínio usado. O arquivo não inclui Cookie manual para evitar duplicação com o cookie automático. As credenciais não são enviadas a outros ambientes por scripts, e o token não é salvo em variáveis da collection.

201 no login indica sessão criada, com validade de 24 horas. As APIs administrativas exigem conta de administrador e aceite vigente feito pela própria pessoa no site. 403 pode indicar pendência de aceite ou falta de permissão. Logout expira somente a sessão corrente. O arquivo não executa nada ao ser importado e não faz migrations automaticamente.

## Validação

JSON validado contra o schema oficial Postman Collection v2.1. Scripts e bodies conferidos offline; nenhum login, consulta remota, criação, edição ou migration foi executado durante a geração.
