# ADR 0001 — Monorepo com npm workspaces

**Status:** aceito · **Data:** 2026-09-10

## Contexto

O projeto entrega duas aplicações que precisam evoluir juntas: uma API Express e um cliente
React. Os tipos das respostas da API são consumidos diretamente pelo frontend, e a avaliação
exige demonstrar a integração entre as duas pontas.

## Decisão

Um único repositório com npm workspaces, em `apps/api` e `apps/web`.

## Consequências

- Um `npm install` na raiz resolve as duas aplicações.
- Um único histórico de commits mostra a evolução conjunta das camadas.
- O deploy exige apontar o diretório raiz de cada serviço na plataforma de hospedagem,
  o que está documentado no README.
- Não há compartilhamento automático de tipos entre API e web: `apps/web/src/api/types.ts`
  reescreve os contratos à mão. Um pacote `packages/shared` resolveria isso e fica registrado
  como evolução futura.
