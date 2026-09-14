# Referência da API

Base: `/api/v1` · Autenticação: `Authorization: Bearer <token>`

Perfis: `EMPLOYEE` (Funcionário), `MANAGER` (Gerente), `SECURITY_ADMIN` (Administrador de Segurança).

## Saúde

| Método | Rota | Perfis | Descrição |
|---|---|---|---|
| GET | `/health` | público | Verifica se a API está no ar. |

## Autenticação

| Método | Rota | Perfis | Descrição |
|---|---|---|---|
| POST | `/auth/login` | público | Troca e-mail e senha por um JWT. Limitado a 10 tentativas a cada 10 minutos. |
| GET | `/auth/me` | autenticado | Devolve o perfil da sessão atual. |

```http
POST /api/v1/auth/login
Content-Type: application/json

{ "email": "bruce@wayne.com", "password": "Wayne@123" }
```

```json
{
  "token": "eyJhbGciOi...",
  "user": { "id": "...", "name": "Bruce Wayne", "role": "SECURITY_ADMIN", "roleLabel": "Administrador de Segurança" }
}
```

## Recursos

| Método | Rota | Perfis | Descrição |
|---|---|---|---|
| GET | `/resources` | todos | Lista paginada. Filtros: `page`, `perPage`, `search`, `type`, `status`, `areaId`. |
| GET | `/resources/:id` | todos | Detalhe de um recurso. |
| POST | `/resources` | Gerente, Administrador | Cadastra recurso. |
| PATCH | `/resources/:id` | Gerente, Administrador | Atualiza campos parciais. |
| DELETE | `/resources/:id` | Administrador | Remove em definitivo. |

## Áreas restritas

| Método | Rota | Perfis | Descrição |
|---|---|---|---|
| GET | `/areas` | todos | Lista áreas com permissões e contagem de recursos. |
| GET | `/areas/:id` | todos | Detalhe de uma área. |
| POST | `/areas` | Administrador | Cadastra área. |
| PATCH | `/areas/:id` | Administrador | Atualiza área. |
| DELETE | `/areas/:id` | Administrador | Remove área sem recursos vinculados. |
| POST | `/areas/:id/permissions` | Administrador | Concede permissão individual. |
| DELETE | `/areas/:id/permissions/:userId` | Administrador | Revoga permissão individual. |

## Controle de acesso

| Método | Rota | Perfis | Descrição |
|---|---|---|---|
| POST | `/access/attempt` | autenticado | Avalia e registra uma tentativa de entrada. |
| GET | `/access/clearance` | autenticado | Mapa das áreas com liberado/negado e motivo, sem gravar log. |
| GET | `/access/my-history` | autenticado | Histórico pessoal paginado. |
| GET | `/access/logs` | Gerente, Administrador | Auditoria. O gerente enxerga apenas áreas que pode acessar. |

Uma tentativa negada responde **200**, porque a operação foi processada com sucesso.
A negativa vem no corpo:

```json
{ "result": "DENIED", "reason": "A área exige o nível Administrador de Segurança ou superior.", "log": { } }
```

## Usuários

| Método | Rota | Perfis | Descrição |
|---|---|---|---|
| GET | `/users` | Administrador | Lista paginada com busca por nome ou e-mail. |
| GET | `/users/:id` | Administrador | Detalhe. |
| POST | `/users` | Administrador | Cadastra usuário. |
| PATCH | `/users/:id` | Administrador | Atualiza. Não permite alterar o próprio cargo. |
| DELETE | `/users/:id` | Administrador | Desativa (exclusão lógica). |

## Painel

| Método | Rota | Perfis | Descrição |
|---|---|---|---|
| GET | `/dashboard` | autenticado | Totais, série de acessos dos últimos 7 dias, distribuição de recursos e atividades recentes. |

## Formato de erro

Toda falha responde com o mesmo envelope. Nenhuma stack trace é enviada ao cliente.

```json
{
  "code": "BAD_REQUEST",
  "message": "Dados inválidos na requisição.",
  "details": { "serialNumber": ["Use apenas letras, números e hífen no número de série."] }
}
```

| Status | Código | Quando |
|---|---|---|
| 400 | `BAD_REQUEST` | Falha de validação Zod. |
| 401 | `UNAUTHORIZED` | Token ausente, inválido, expirado, ou credenciais erradas. |
| 403 | `FORBIDDEN` | Perfil sem permissão para a rota. |
| 404 | `NOT_FOUND` | Registro inexistente. |
| 409 | `CONFLICT` | Violação de valor único (e-mail, código de área, número de série). |
| 429 | `TOO_MANY_REQUESTS` | Excesso de tentativas de login. |
| 500 | `INTERNAL_SERVER_ERROR` | Falha inesperada. |
