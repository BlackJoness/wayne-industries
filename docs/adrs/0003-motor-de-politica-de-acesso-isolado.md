# ADR 0003 — Motor de política de acesso isolado e puro

**Status:** aceito · **Data:** 2026-09-10

## Contexto

O requisito central do projeto é permitir que apenas usuários autorizados acessem áreas
restritas. Espalhar essa regra por controllers e componentes React produziria um sistema
onde ninguém consegue responder com certeza "por que essa pessoa entrou aqui?".

## Decisão

Concentrar toda a regra em uma função pura: `src/modules/access/access.policy.ts`.
Ela não consulta banco, não conhece o Express e recebe tudo por parâmetro.

Ordem de avaliação:

1. Usuário inativo é negado.
2. Área inativa é negada.
3. Permissão individual válida concede acesso, mesmo abaixo do cargo mínimo.
4. Cargo com nível igual ou superior ao exigido concede acesso.
5. Caso contrário, nega.

A hierarquia é `EMPLOYEE (1) < MANAGER (2) < SECURITY_ADMIN (3)`, definida em
`src/shared/utils/role.ts`.

## Consequências

- A regra de segurança tem dez testes cobrindo os casos de fronteira, incluindo permissão
  expirada e a precedência do bloqueio por usuário inativo.
- A mesma função serve três usos: decidir uma tentativa real, montar o mapa de credenciais
  da pessoa na tela, e limitar o escopo de log que um gerente enxerga.
- Toda mudança de regra acontece em um arquivo só.
