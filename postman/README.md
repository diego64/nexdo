# Postman — nexdo (testes locais)

Arquivos:
- `nexdo.postman_collection.json` — coleção com todos os endpoints (Auth, LGPD, Times, Tarefas, Health).
- `nexdo.local.postman_environment.json` — environment local (`baseUrl`, credenciais do admin do seed, variáveis `token`/`timeId`/`tarefaId`).

## Como usar
1. Suba a API local: `docker compose up -d && pnpm db:migrar && pnpm db:seed && pnpm dev`.
2. No Postman: **Import** os dois arquivos e selecione o environment **"nexdo local"**.
3. Rode **Auth → POST /sessoes (login admin)** — o token é salvo automaticamente em `{{token}}` e usado nas demais requisições (Bearer).
4. **Times → POST /times** salva `{{timeId}}`; **Tarefas → POST /tarefas** salva `{{tarefaId}}` — as rotas seguintes já usam esses IDs.

> Credenciais do admin vêm do seed (`administrador@nexdo.local` / `1qaz2wsx12`) — só para ambiente local.
