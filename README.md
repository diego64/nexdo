# nexdo

API de **Gerenciamento de Tarefas** em Node.js. Usuários criam contas, autenticam-se com
JWT e gerenciam tarefas atribuídas a membros de times, classificadas por status e
prioridade, com histórico de mudanças e auditoria de eventos.

Construído com **Spec-Driven Development (SDD) + BDD** — nenhuma funcionalidade sem SPEC em
[`.specs/`](.specs/) e cenários passando. As regras do projeto vivem em
[`CLAUDE.md`](CLAUDE.md) (fonte de verdade).

## Stack

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 22 LTS + TypeScript (strict) |
| HTTP | Fastify |
| Banco relacional | PostgreSQL — driver nativo `pg` (SQL puro, sem ORM) |
| Auditoria | MongoDB — driver nativo `mongodb` |
| Validação | Zod (apenas na borda HTTP) |
| Autenticação | JWT (`@fastify/jwt`) + bcrypt |
| Testes | Vitest (unitário, integração, E2E, carga) |
| Containers | Docker + Docker Compose |
| CI | GitHub Actions (`homologacao.yml`) |
| Observabilidade | Grafana + Loki + Tempo + OpenTelemetry |
| Deploy | Backend: Render · Banco: Supabase (PostgreSQL) |

> **Gerenciador de pacotes: `pnpm`** (não use npm/yarn — os hooks do husky e o CI dependem disso).

## Rodar localmente

### Requisitos
- Node.js 22 (ver [`.nvmrc`](.nvmrc)) · `pnpm` 10+ · Docker + Docker Compose

### Passos

```bash
# 1. Instalar dependências
pnpm install

# 2. Configurar ambiente (copie e ajuste os valores locais — ver CLAUDE.md §7)
cp .env.example .env

# 3. Subir Postgres, Mongo e a stack de observabilidade
docker compose up -d

# 4. Aplicar migrações e criar o usuário administrador
pnpm db:migrar
pnpm db:seed

# 5. Rodar em modo dev (tsx watch)
pnpm dev
```

A API sobe em `http://localhost:3333`. Cheque a saúde:

```bash
curl http://localhost:3333/saude
# { "status": "ok" }
```

Credenciais locais padrão (só desenvolvimento): usuário `administrador` / senha `1qaz2wsx12`.
O seed cria o admin `administrador@nexdo.local` (senha `1qaz2wsx12`).

## Endpoints

Base URL local: `http://localhost:3333` · Autenticação: `Authorization: Bearer <jwt>` em todas
as rotas exceto `POST /usuarios` e `POST /sessoes`. Contrato canônico:
[`.specs/contratos/api-http.md`](.specs/contratos/api-http.md).

**Envelope de erro:** `{ "erro": { "codigo": string, "mensagem": string, "detalhes"?: unknown } }`
Códigos HTTP: `400` validação · `401` não autenticado · `403` sem permissão · `404` não
encontrado · `409` conflito · `500` interno.

### Autenticação
| Método | Rota | Papel | Body | Resposta |
|---|---|---|---|---|
| POST | `/usuarios` | público | `{ name, email, password }` | `201 { id, name, email, role }` |
| POST | `/sessoes` | público | `{ email, password }` | `200 { token, usuario }` · `401` inválido |

### Times
| Método | Rota | Papel | Body |
|---|---|---|---|
| POST | `/times` | admin | `{ name, description? }` → `201` |
| GET | `/times` | admin | — (paginação `?pagina&limite`) |
| PUT | `/times/:id` | admin | `{ name, description? }` |
| DELETE | `/times/:id` | admin | — → `204` |
| POST | `/times/:id/membros` | admin | `{ user_id }` → `201` |
| DELETE | `/times/:id/membros/:userId` | admin | — → `204` |
| GET | `/times/:id/membros` | admin ou member do time | — |

### Tarefas
| Método | Rota | Papel | Regra |
|---|---|---|---|
| POST | `/tarefas` | admin, member | member só cria no próprio time |
| GET | `/tarefas` | admin, member | admin vê todas; member só dos seus times. Filtros: `?status`, `?prioridade`, `?time`, `?pagina`, `?limite` |
| GET | `/tarefas/:id` | admin, member | member só do próprio time |
| PUT | `/tarefas/:id` | admin, member | member só edita tarefa atribuída a si |
| DELETE | `/tarefas/:id` | admin | — → `204` |
| PATCH | `/tarefas/:id/atribuir` | admin | `{ user_id }` (deve pertencer ao time da tarefa) |
| GET | `/tarefas/:id/historico` | admin ou member do time | mudanças de status (DESC) |

**Body de tarefa:** `{ title, description?, status?, priority?, assigned_to?, team_id }`
Valores: `status ∈ pending|in_progress|completed` · `priority ∈ high|medium|low`.

### Health
| Método | Rota | Descrição |
|---|---|---|
| GET | `/saude` | liveness `200 { status: "ok" }` |

### Fluxo com curl (cadastro → login → criar tarefa)

```bash
# 1. Cadastrar usuário (role member por padrão)
curl -X POST http://localhost:3333/usuarios \
  -H 'content-type: application/json' \
  -d '{"name":"Ana","email":"ana@nexdo.local","password":"senha1234"}'

# 2. Login como admin (criado pelo seed) → guarda o token
TOKEN=$(curl -s -X POST http://localhost:3333/sessoes \
  -H 'content-type: application/json' \
  -d '{"email":"administrador@nexdo.local","password":"1qaz2wsx12"}' | jq -r .token)

# 3. Criar um time
TIME=$(curl -s -X POST http://localhost:3333/times \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"name":"Plataforma"}' | jq -r .id)

# 4. Criar uma tarefa no time
curl -X POST http://localhost:3333/tarefas \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d "{\"title\":\"Primeira tarefa\",\"team_id\":$TIME,\"priority\":\"high\"}"
```

## Deploy

- **Backend:** Render (Blueprint em [`render.yaml`](render.yaml)) — build `pnpm build`, start
  `pnpm start`, health check `/saude`.
- **Banco:** Supabase (PostgreSQL, SSL) · **Auditoria:** MongoDB Atlas.
- Segredos via env vars do Render (`JWT_SECRET`, `DATABASE_URL`, `MONGODB_URI`, `CORS_ORIGENS`).

> URL pública: _a definir_ (`https://<app>.onrender.com`).

## Testes

```bash
pnpm test            # unitário + integração + E2E (Vitest)
pnpm test:e2e        # apenas E2E
pnpm test:carga      # benchmarks (baseline p95)
pnpm test:coverage   # cobertura (gate ≥ 80% em src/aplicacao e src/dominio)
pnpm lint            # ESLint
pnpm typecheck       # tsc --noEmit
```

> Integração/E2E e carga exigem os bancos de pé (`docker compose up -d`). Sem eles, essas
> suítes são puladas automaticamente.

## Observabilidade (local)

Após `docker compose up -d`:

| Serviço | URL | Credenciais |
|---|---|---|
| Grafana | http://localhost:3000 | `administrador` / `1qaz2wsx12` |
| Loki (logs) | http://localhost:3100 | datasource provisionado no Grafana |
| Tempo (traces) | http://localhost:3200 (OTLP gRPC `:4317`) | datasource provisionado no Grafana |

Loki e Tempo já vêm como datasources no Grafana (ver
[`observabilidade/`](observabilidade/)); use **Explore** para consultar logs e traces.

## Estrutura

```
src/
├── dominio/            # Núcleo: entidades, enums, erros, interfaces de repositório
├── aplicacao/          # Casos de uso (um por responsabilidade) + portas
├── infraestrutura/     # pg, mongo, http (controladores/rotas/esquemas/middlewares), observabilidade
├── compartilhado/      # config, utils
└── main.ts             # Composition root (injeção manual) + bootstrap Fastify
database/               # Migrações SQL numeradas
scripts/                # migrar.ts, seed.ts
testes/                 # unitario, integracao, e2e, carga, auxiliares
observabilidade/        # provisioning Grafana, config Tempo
```

Fluxo de dependência: `http → casos-de-uso → dominio ← infraestrutura` (o domínio nunca
importa de fora).

## Documentação viva

- [`CLAUDE.md`](CLAUDE.md) — constituição do projeto (regras, convenções, arquitetura)
- [`.specs/`](.specs/) — SPECs numeradas, contratos e memória (progresso, decisões)
- [`.specs/contratos/`](.specs/contratos/) — modelo de dados, contrato HTTP, eventos de auditoria
