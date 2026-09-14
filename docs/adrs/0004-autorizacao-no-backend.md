# ADR 0004 — A autorização vive no backend

**Status:** aceito · **Data:** 2026-09-10

## Contexto

É tentador tratar controle de acesso como problema de interface: esconder o botão de
excluir de quem não é administrador e considerar o requisito cumprido. Qualquer pessoa
com um cliente HTTP derruba essa proteção em trinta segundos.

## Decisão

Cada rota declara explicitamente quem pode chamá-la, através do middleware
`authorize(...roles)`, avaliado no servidor antes do controller.

| Ação | Funcionário | Gerente | Administrador |
|---|---|---|---|
| Ler recursos | sim | sim | sim |
| Criar e editar recurso | não | sim | sim |
| Excluir recurso | não | não | sim |
| Gerenciar usuários | não | não | sim |
| Gerenciar áreas e permissões | não | não | sim |
| Auditar acessos de terceiros | não | parcial | sim |
| Registrar tentativa de acesso | sim | sim | sim |

O `RoleGuard` do React existe apenas como conveniência de navegação, e o comentário no
arquivo diz isso de forma explícita.

## Consequências

- Chamar `DELETE /api/v1/resources/:id` com um token de funcionário devolve 403, mesmo
  sem passar pela interface. O teste `tests/authorization.spec.ts` verifica exatamente isso.
- O gerente enxerga apenas o log das áreas que ele próprio poderia acessar, reaproveitando
  o motor de política do ADR 0003.
