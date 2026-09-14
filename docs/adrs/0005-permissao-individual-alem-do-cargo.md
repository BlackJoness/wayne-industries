# ADR 0005 — Permissão individual além do cargo

**Status:** aceito · **Data:** 2026-09-10

## Contexto

Um modelo puramente baseado em cargo obriga a promover alguém para liberar uma única porta.
Na prática, empresas concedem exceções pontuais: um consultor externo precisa entrar no
laboratório por duas semanas, sem virar gerente.

## Decisão

Manter as duas camadas. `Area.minimumRole` resolve o caso geral e a tabela
`area_permissions` resolve a exceção, com `expiresAt` opcional e registro de quem concedeu
(`grantedById`).

## Consequências

- O sistema deixa de ser um `if (role === 'ADMIN')` e passa a ser um controle de acesso
  com trilha: toda concessão tem autor e data.
- Uma permissão expirada é tratada como negativa explícita, com motivo próprio no log,
  em vez de sumir silenciosamente.
- O custo é uma consulta extra por avaliação de acesso. Aceitável na escala do projeto.
