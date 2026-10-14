# Captura dinâmica do fluxo de login (macOS)

Objetivo: observar, com evidência, o que o navegador realmente envia e recebe
durante o login, e confirmar que o token viaja no cabeçalho `Authorization` e
nunca na URL.

## 1. Subir o projeto

Em dois terminais, na raiz do repositório:

```bash
npm run dev:api
npm run dev:web
```

## 2. Abrir o Chrome com porta de depuração

Use um perfil separado para não misturar com sua navegação:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/rea-wayne-browser \
  http://localhost:5173
```

## 3. Descobrir o alvo

```bash
npx -y rea-agents@latest list-browser-targets http://127.0.0.1:9222 --json
```

Copie o `id` do alvo cuja URL é `http://localhost:5173/login`.

## 4. Capturar o login

Rode o comando, espere ele conectar e **só então** clique em "Entrar" no
navegador. A janela de observação dura 15 segundos.

```bash
npx -y rea-agents@latest inspect-web-page \
  http://127.0.0.1:9222 TARGET_ID \
  --observation-ms 15000 \
  --include-json-body-shapes --json > docs/auditoria/login-capture.json
```

## 5. O que conferir no resultado

| Pergunta | Onde olhar | Esperado |
|---|---|---|
| O token aparece na URL de alguma requisição? | lista de requisições | Não |
| O login é `POST /api/v1/auth/login`? | método e caminho | Sim |
| A resposta devolve `passwordHash`? | forma do JSON da resposta | Não (só `token` e `user`) |
| Quantas requisições o dashboard dispara? | requisições após o redirect | Uma para `/dashboard`, uma para `/auth/me` |

Registre as respostas na tabela de resultados do [`README.md`](./README.md).
