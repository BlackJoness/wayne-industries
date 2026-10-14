# Diretrizes do repositório

Este arquivo orienta agentes de código (Claude Code, Codex, Cursor) e pessoas que
chegam ao projeto. O README explica o produto; aqui está como trabalhar nele.

## Direção do produto

Sistema de gerenciamento de segurança e recursos das Indústrias Wayne: controle de
acesso a áreas restritas, CRUD de recursos e dashboard, com três perfis
(`EMPLOYEE`, `MANAGER`, `SECURITY_ADMIN`). Priorize, nesta ordem:

- autorização decidida no backend, nunca só escondendo botões no frontend;
- toda entrada validada com Zod antes de chegar ao controller;
- regras de negócio testáveis sem banco, por injeção de repositório;
- documentação que explica o porquê (ADRs) e não só o como.

## Estrutura e organização dos módulos

Monorepo com npm workspaces: `apps/api` (Express + Prisma) e `apps/web`
(React + Vite). A dependência aponta sempre para dentro.

- `apps/api/src/modules/<nome>/`: cada módulo tem `routes → controller → service → repository`.
  Só o repository importa o Prisma; o service recebe o repository no construtor.
- `apps/api/src/shared/`: `errors/` (AppError e subclasses por status HTTP),
  `middlewares/` (authenticate, authorize, validate, errorHandler), `utils/`.
- `apps/api/src/config/`: variáveis de ambiente parseadas com Zod em `env.ts`.
  Não leia `process.env` fora daqui.
- `apps/api/tests/`: specs por serviço com repositórios falsos em memória.
- `apps/web/src/features/<nome>/`: espelha os módulos da API. `api/` guarda o
  cliente HTTP e os hooks do React Query; `routes/` tem `ProtectedRoute` e `RoleGuard`.
- `docs/adrs/`: decisões numeradas. Uma mudança de arquitetura pede um ADR novo.
- `docs/auditoria/`: evidência da análise estática do bundle (REA).

## Comandos de build, teste e desenvolvimento

- `npm run setup`: instala, gera o Prisma Client, migra e popula o banco.
- `npm run dev:api` / `npm run dev:web`: modo watch de cada aplicação.
- `npm run typecheck`: `tsc --noEmit` nos dois workspaces.
- `npm test`: suíte da API (Vitest + Supertest), sem banco.
- `npm run build`: build de produção das duas aplicações.
- `npm run audit:web-bundle`: análise estática do bundle do frontend com REA.

Hooks: `pre-commit` roda o typecheck, `commit-msg` valida a mensagem, `pre-push`
roda os testes. Para pular em ambiente sem git, use `HUSKY=0`.

## Configuração e variáveis de ambiente

Copie `.env.example` para `.env`. As variáveis estão documentadas lá e validadas
em `apps/api/src/config/env.ts`; a API não sobe com `JWT_SECRET` curto. Não
mantenha um segundo catálogo de variáveis em outro lugar.

## Estilo de código e nomenclatura

ESM TypeScript, dois espaços, aspas simples. Mantenha o compilador estrito
(`strict`, `noUncheckedIndexedAccess`, `noImplicitReturns`, `verbatimModuleSyntax`):
use `import type` para tipos. `camelCase` para valores e funções, `PascalCase`
para classes e tipos, `UPPER_SNAKE_CASE` para constantes. Evite `any`, casts sem
verificação e `!` de não-nulo. Erros esperados são subclasses de `AppError`; o
`errorHandler` traduz para HTTP sem vazar stack trace. Mensagens para o usuário
em português.

## Diretrizes de teste

Arquivos `*.spec.ts` em `apps/api/tests/`. Teste a regra de negócio no service
com um repositório falso; teste a cadeia de middlewares com Supertest contra o
`app` real. Cubra entrada inválida, 401 sem token, 403 fora do perfil e a
ausência de dados de outro perfil na resposta. Não adicione testes que apenas
congelam uma sequência de chamadas.

## Commits e pull requests

Mensagens no padrão Conventional Commits: `feat(auth): adiciona refresh token`,
`fix(resources): rejeita número de série duplicado`, `docs: atualiza ADR 0003`.
Tipos aceitos: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`. Nunca
commite `.env`, `dist/`, `node_modules/` ou dumps de banco.
