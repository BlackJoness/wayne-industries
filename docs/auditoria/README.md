# Auditoria do bundle com REA

Esta pasta registra a auditoria estática do frontend publicado, feita com o
[REA (Reverse Engineer Anything)](https://github.com/morluto/rea), uma ferramenta
MCP/CLI que inspeciona aplicações JavaScript sem executá-las e devolve cada
achado com a evidência e as limitações por trás dele.

A pergunta que a auditoria responde: **o que um visitante consegue descobrir
sobre o sistema lendo apenas o JavaScript entregue ao navegador?**

## Como reproduzir

```bash
npm run audit:web-bundle
```

O script gera o build de produção de `apps/web`, roda o analisador do REA sobre
`apps/web/dist` e grava a evidência completa em `docs/auditoria/bundle-web.json`
(ignorado pelo git; regenere quando precisar). Requer Node 22.19+ ou 24.11+.

## Resultado da última execução

| Item | Valor |
|---|---|
| Ferramenta | REA CLI 6.4.0, provider `rea-javascript-application` |
| Alvo | `apps/web/dist` (Vite 5, build de produção) |
| Digest do alvo (sha256) | `d751710d…a443af1c` |
| Evidência | `ev_fc1daaeb…ee7672d8` |
| Assets JavaScript | 3 (`index`, `vendor`, `charts`) |
| Módulos recuperados | 15 |
| Rotas do SPA identificadas | `/login`, `recursos`, `usuarios`, `acessos`, `areas`, `*` |
| Operações de armazenamento | `localStorage.getItem`, `setItem`, `removeItem` (chave `wayne.token`) |
| Confiança declarada pelo REA | `derived` (inferido de sintaxe inerte, sem execução) |

## Varredura de segredos

Padrões procurados nos três assets, com o número de ocorrências:

| Padrão | Ocorrências | Leitura |
|---|---|---|
| `JWT_SECRET` | 0 | Correto: segredo fica só na API |
| `DATABASE_URL`, `postgresql://`, `POSTGRES_PASSWORD` | 0 | Correto: nada do banco chega ao navegador |
| `VITE_` | 0 | Correto: o Vite substitui as variáveis em build; nenhum nome vaza |
| URL da API (`onrender.com`) | 1 | Esperado: a URL pública da API é parte do bundle |
| `bruce@wayne.com`, `Wayne@123` | 2 e 3 | Deliberado: a tela de login exibe as contas de demonstração para o avaliador (`login-page.tsx`) |

## Achados e decisões

1. **Nenhum segredo de servidor no bundle.** As variáveis sensíveis vivem apenas
   em `apps/api/src/config/env.ts`, validadas com Zod.
2. **Token JWT em `localStorage`.** O REA confirma as três operações sobre a
   chave `wayne.token`. A escolha, e o custo dela (exposição a XSS), já está
   registrada na seção "Decisões conscientes" do README; cookie `httpOnly` é o
   caminho de evolução.
3. **Credenciais de demonstração visíveis.** São parte da proposta de entrega
   (contas de teste públicas, dados fictícios). Antes de reaproveitar o projeto
   com dados reais, remover o preenchimento automático em `login-page.tsx`.
4. **Chamadas à API.** O frontend consome apenas os endpoints documentados em
   `docs/api.md`: `/auth/login`, `/auth/me`, `/users`, `/areas`, `/resources`,
   `/access/*` e `/dashboard`. Nenhuma rota oculta.

## Próximo passo: captura dinâmica

A análise acima é estática. O REA também observa a página em execução por meio
do protocolo de depuração do Chrome (`inspect-web-page`), registrando cada
requisição real feita durante o login. Comandos em
[`captura-dinamica.md`](./captura-dinamica.md).
