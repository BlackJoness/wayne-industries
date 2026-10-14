# ADR 0006 — Conventional Commits, hooks de git e flags estritas do compilador

**Status:** aceito · **Data:** 2026-10-14

## Contexto

O projeto já tinha testes, CI e TypeScript estrito, mas nada impedia um commit
com tipos quebrados ou uma mensagem sem padrão. Ao estudar o repositório
[morluto/rea](https://github.com/morluto/rea), três práticas se mostraram baratas
de adotar e com retorno imediato para um projeto de portfólio: hooks de git que
rodam verificações antes de commit e push, mensagens no padrão Conventional
Commits (que permitem gerar changelog e versão automaticamente) e um `tsconfig`
que fecha brechas que `strict` sozinho deixa abertas.

## Decisão

1. **Husky** instala três hooks: `pre-commit` roda `npm run typecheck`,
   `commit-msg` valida a mensagem com **commitlint** (config convencional) e
   `pre-push` roda `npm test`.
2. Mensagens seguem `tipo(escopo): descrição`, com tipos `feat`, `fix`, `docs`,
   `refactor`, `test`, `chore`, `ci`. Exemplo: `feat(auth): adiciona refresh token`.
3. Os dois `tsconfig.json` ganham `noImplicitReturns`, `noFallthroughCasesInSwitch`,
   `allowUnreachableCode: false` e `verbatimModuleSyntax`. Nenhuma dessas flags
   gerou erro no código existente.
4. `exactOptionalPropertyTypes` **não** foi ativada. Ela aponta 14 pontos onde
   `undefined` é passado explicitamente a campos opcionais do Prisma; a correção
   pede um utilitário que remova chaves `undefined` antes da chamada. Fica como
   próximo passo.

## Consequências

- Um commit com erro de tipo não entra no histórico; um push com teste quebrado
  não chega ao GitHub.
- `npm install` executa `prepare` e instala os hooks. Em ambientes de build sem
  git, defina `HUSKY=0`.
- O histórico passa a ser legível por ferramentas como Release Please, abrindo
  caminho para versionamento automático.
