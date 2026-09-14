# Indústrias Wayne — Sistema de Gerenciamento de Segurança e Recursos

Aplicação web full stack para controle de acesso a áreas restritas, gestão do inventário
interno e visualização de indicadores das Indústrias Wayne.

Projeto final do curso Dev Full Stack — Infinity School.

![Node](https://img.shields.io/badge/Node-20%2B-339933?logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Testes](https://img.shields.io/badge/testes-36%20passando-4E9A6B)

## Links

| | |
|---|---|
| **Aplicação no ar** | https://wayne-industries-web.vercel.app |
| **API** | https://wayne-api-1vh8.onrender.com/api/v1/health |
| **Repositório** | https://github.com/BlackJoness/wayne-industries |

Entre com `bruce@wayne.com` e a senha `Wayne@123` para ver o perfil de Administrador de
Segurança, depois com `alfred@wayne.com` para comparar com o perfil de Funcionário.

> A API está hospedada em plano gratuito e hiberna após alguns minutos sem uso.
> A primeira abertura pode levar cerca de um minuto.

---

## Credenciais de demonstração

Senha para todas as contas: **`Wayne@123`**

| Perfil | E-mail | O que este perfil pode fazer |
|---|---|---|
| Administrador de Segurança | `bruce@wayne.com` | Tudo: usuários, áreas, permissões e exclusão de recursos |
| Gerente | `lucius@wayne.com` | Cadastra e edita recursos, audita acessos das suas áreas |
| Funcionário | `alfred@wayne.com` | Consulta recursos e registra as próprias entradas |
| Funcionário com exceção | `barbara@wayne.com` | Funcionário com permissão individual na Sala de Servidores |
| Usuário inativo | `selina@wayne.com` | Demonstra o bloqueio de login por conta desativada |

Entre com perfis diferentes para ver a interface e as permissões mudarem.

---

## Como rodar em três comandos

Pré-requisitos: **Node 20 ou superior** e **Docker**.

```bash
cp .env.example .env
docker compose up -d
npm run setup
```

O `npm run setup` instala as dependências, aplica as migrations e popula o banco com os
dados de demonstração. Depois disso:

```bash
npm run dev:api    # http://localhost:3333/api/v1
npm run dev:web    # http://localhost:5173
```

Abra <http://localhost:5173> e entre com uma das contas da tabela acima.

### Sem Docker

Suba um PostgreSQL local e ajuste `DATABASE_URL` no `.env` para apontar para ele.
O restante dos comandos é igual.

---

## O que cada requisito do enunciado virou no sistema

### Sistema de Gerenciamento de Segurança

O controle de acesso não é apenas login. Existe a entidade **Área** com um nível mínimo
exigido, e toda tentativa de entrada gera um registro em `access_logs` com o motivo da
decisão, seja ela positiva ou negativa.

A decisão é tomada por uma função pura em `apps/api/src/modules/access/access.policy.ts`,
que avalia nesta ordem: usuário inativo, área inativa, permissão individual válida,
hierarquia de cargo. Ela é a única fonte da regra e tem dez testes cobrindo os casos de
fronteira.

A autenticação usa JWT assinado com segredo de ambiente, senha protegida por bcrypt e
limite de dez tentativas de login a cada dez minutos.

### Gestão de Recursos

CRUD completo de equipamentos, veículos e dispositivos de segurança, com busca por nome
ou número de série, filtros por categoria e situação, paginação no servidor e validação
de entrada com Zod.

As permissões diferem por perfil: o funcionário consulta, o gerente cadastra e edita, e
só o administrador exclui em definitivo. Toda alteração alimenta a trilha de auditoria
em `audit_logs`.

### Dashboard de Visualização

Painel com totais do inventário, série diária de acessos liberados e negados nos últimos
sete dias, distribuição de recursos por categoria e situação, ranking de áreas com mais
negativas, atividades recentes e últimas passagens registradas.

Todos os números vêm de agregações reais no PostgreSQL. Não há dado fixo na interface.

---

## Arquitetura

```
wayne-industries/
├── docker-compose.yml          # PostgreSQL 16
├── docs/
│   ├── adrs/                   # 5 decisões arquiteturais registradas
│   ├── api.md                  # referência completa de endpoints
│   └── wayne-api.postman.json  # coleção para Insomnia ou Postman
├── apps/api/
│   ├── prisma/
│   │   ├── schema.prisma       # 6 modelos, 5 enums
│   │   └── seed.ts             # dados de Gotham para demonstração
│   ├── tests/                  # 28 testes (Vitest + Supertest)
│   └── src/
│       ├── config/             # env validado com Zod, cliente Prisma
│       ├── shared/
│       │   ├── errors/         # AppError e subclasses por status
│       │   ├── middlewares/    # authenticate, authorize, validate, errorHandler
│       │   └── utils/          # jwt, bcrypt, paginação, hierarquia de cargos
│       └── modules/
│           ├── auth/  users/  areas/  access/  resources/  dashboard/  audit/
│           └── (cada um: routes → controller → service → repository)
└── apps/web/src/
    ├── api/                    # cliente HTTP e hooks do React Query
    ├── contexts/               # sessão do usuário
    ├── routes/                 # ProtectedRoute e RoleGuard
    ├── components/             # primitivos de UI e layout
    └── features/               # auth, dashboard, resources, access, areas, users
```

A dependência aponta sempre para dentro. Só a camada de repositório conhece o Prisma, e
o serviço recebe o repositório por injeção no construtor. É isso que permite testar as
regras de negócio sem subir banco.

O raciocínio por trás de cada escolha está em [`docs/adrs/`](docs/adrs/).

---

## Matriz de permissões

| Ação | Funcionário | Gerente | Administrador |
|---|:---:|:---:|:---:|
| Ver o painel | sim | sim | sim |
| Consultar recursos | sim | sim | sim |
| Cadastrar e editar recurso | não | sim | sim |
| Excluir recurso | não | não | sim |
| Registrar tentativa de acesso | sim | sim | sim |
| Ver o próprio histórico | sim | sim | sim |
| Auditar acessos de terceiros | não | suas áreas | todas |
| Gerenciar áreas e permissões | não | não | sim |
| Gerenciar usuários | não | não | sim |

A autorização é aplicada no servidor. O `RoleGuard` do React apenas esconde telas fora do
perfil; chamar a rota diretamente com um token de nível inferior devolve **403**.

Teste você mesmo, com a API rodando:

```bash
TOKEN=$(curl -s -X POST http://localhost:3333/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alfred@wayne.com","password":"Wayne@123"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

curl -i -X DELETE http://localhost:3333/api/v1/resources/qualquer-id \
  -H "Authorization: Bearer $TOKEN"
# HTTP/1.1 403 Forbidden
```

---

## Testes

```bash
npm test
```

36 testes cobrindo o que quebra em produção:

| Suíte | O que verifica |
|---|---|
| `access-policy.spec.ts` | O motor de decisão de acesso, incluindo permissão expirada e precedência do bloqueio por inatividade |
| `auth-service.spec.ts` | Login, bloqueio de conta inativa, e a garantia de que o hash da senha nunca sai na resposta |
| `resources-service.spec.ts` | CRUD, conflito de número de série, gravação da trilha de auditoria |
| `authorization.spec.ts` | A cadeia real de middlewares: 401 sem token, 403 fora do perfil, 400 com corpo inválido, e ausência de stack trace no erro |

Os serviços são testados com repositórios falsos injetados no construtor, sem depender de
banco. Isso mantém a suíte rápida e faz o CI rodar sem infraestrutura.

---

## Segurança aplicada

| Medida | Onde |
|---|---|
| Senha com bcrypt (10 rounds) | `shared/utils/password.ts` |
| JWT com segredo obrigatório de 16+ caracteres | `config/env.ts` |
| Validação e sanitização de toda entrada | `shared/middlewares/validate.ts` + schemas Zod |
| Cabeçalhos de segurança HTTP | `helmet` em `app.ts` |
| CORS restrito à origem configurada | `app.ts` |
| Limite de tentativas de login | `auth.routes.ts` |
| Erro padronizado, sem vazar stack trace | `shared/middlewares/error-handler.ts` |
| Mensagem de login idêntica para e-mail e senha errados | `auth.service.ts` |
| Exclusão lógica de usuários | `users.service.ts` |
| Administrador não consegue se auto-rebaixar | `users.service.ts` |
| Trilha de auditoria com autor e data | `audit_logs` |

---

## Deploy

| Camada | Serviço sugerido | Configuração |
|---|---|---|
| Banco | Neon | Copie a connection string para `DATABASE_URL` |
| API | Render ou Railway | Root: `apps/api` · Build: `npm install && npm run build` · Start: `npm run db:deploy && npm start` |
| Frontend | Vercel | Root: `apps/web` · Build: `npm run build` · Output: `dist` |

Variáveis na API: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN` (a URL da Vercel), `NODE_ENV=production`.
Variável na Vercel: `VITE_API_URL` (a URL da API + `/api/v1`).

O `apps/web/vercel.json` já contém o rewrite de SPA, sem o qual recarregar uma rota
interna devolveria 404.

Depois do primeiro deploy, rode o seed uma vez para popular as contas de demonstração.

> No plano gratuito do Render o serviço hiberna após inatividade e a primeira chamada
> pode levar cerca de um minuto. Abra a URL da API antes de apresentar.

---

## Scripts

| Comando | O que faz |
|---|---|
| `npm run setup` | Instala, migra e popula o banco |
| `npm run dev:api` | API em modo watch |
| `npm run dev:web` | Frontend em modo watch |
| `npm test` | Suíte de testes da API |
| `npm run typecheck` | Checagem de tipos nas duas aplicações |
| `npm run build` | Build de produção das duas aplicações |
| `npm run db:studio` | Prisma Studio para inspecionar o banco |
| `npm run db:reset` | Recria o banco do zero e roda o seed |

---

## Modelo de dados

| Tabela | Papel |
|---|---|
| `users` | Pessoas, cargo e situação |
| `areas` | Áreas físicas e o nível mínimo exigido |
| `area_permissions` | Exceções individuais, com validade e autor da concessão |
| `access_logs` | Toda tentativa de entrada, com resultado e motivo |
| `resources` | Equipamentos, veículos e dispositivos de segurança |
| `audit_logs` | Quem alterou o quê e quando |

Duas camadas de permissão convivem de propósito: `areas.minimum_role` resolve o caso geral
e `area_permissions` resolve a exceção pontual, sem precisar promover ninguém para liberar
uma única porta. O detalhe está no [ADR 0005](docs/adrs/0005-permissao-individual-alem-do-cargo.md).

---

## Próximos passos

Itens deliberadamente fora do escopo desta entrega, registrados para honestidade técnica:

- Refresh token com revogação, no lugar do JWT de 8 horas.
- Pacote `packages/shared` para tipos comuns entre API e frontend, eliminando a duplicação
  de contratos em `apps/web/src/api/types.ts`.
- Testes end-to-end de interface com Playwright.
- Upload de foto do recurso.
