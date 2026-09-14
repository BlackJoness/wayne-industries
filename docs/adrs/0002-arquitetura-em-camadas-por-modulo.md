# ADR 0002 — Arquitetura em camadas organizada por módulo

**Status:** aceito · **Data:** 2026-09-10

## Contexto

A alternativa comum em projetos Express é agrupar arquivos por tipo técnico: uma pasta
`controllers/`, uma `services/`, uma `repositories/`. Isso funciona enquanto o sistema é
pequeno, mas espalha uma mesma funcionalidade por três lugares distantes.

## Decisão

Organizar por módulo de negócio (`auth`, `users`, `areas`, `access`, `resources`,
`dashboard`, `audit`). Cada módulo carrega as suas quatro camadas:

```
routes → controller → service → repository
```

A dependência aponta sempre para dentro. O `repository` é a única camada que conhece o
Prisma; o `service` recebe o repositório por injeção no construtor.

## Consequências

- Serviços são testáveis sem banco: basta passar um repositório falso no construtor,
  como fazem `tests/resources-service.spec.ts` e `tests/auth-service.spec.ts`.
- Trocar o Prisma por outro ORM afetaria apenas a camada de repositório.
- O custo é mais arquivos por funcionalidade. Aceito em troca da separação de responsabilidades.
