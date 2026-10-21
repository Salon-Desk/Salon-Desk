# SalonDesk

Multi-tenant salon booking platform with three apps:

1. **Client app** — discover salons/services and book appointments
2. **Organization portal** — staff, services, schedules, bookings, PayPal account
3. **Platform admin** — orgs, commissions, categories, change-request approvals

Stack: **FastAPI** (`backend/`) + **Next.js** (`frontend/`) + **PostgreSQL**.

---

## Quick start

**Docker (everything in Compose):**

```bash
cp .env.example .env   # edit secrets as needed
docker compose up --build
# Web + API via Compose networking; see compose file for ports.
```

**Local dev (recommended for day-to-day coding):** run Postgres (often via Compose **db only**), then backend + frontend on the host — see [Local development without Docker](#local-development-without-docker).

---

## Local development (without Docker)

Run the **API**, **Next.js app**, and optional **voice worker** as normal processes on your machine. You do **not** need `docker compose up --build` for the full stack; many teams only use Docker for Postgres (pgvector).

### Prerequisites

| Tool | Purpose |
|------|---------|
| [Node.js](https://nodejs.org/) 18+ and **pnpm** | Frontend + root Husky |
| [uv](https://docs.astral.sh/uv/) | Backend Python env |
| **PostgreSQL with pgvector** | Required for app + RAG (`vector` extension) |

### 1. Environment files

```bash
# Repo root — backend reads this (and backend/.env if present)
cp .env.example .env

# Frontend — copy from example or root NEXT_PUBLIC_* vars
cp frontend/.env.example frontend/.env
```

In **root `.env`**:

- `DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/salondesk` is fine for Compose.
- On the **host**, FastAPI rewrites `@db` → `localhost:${POSTGRES_PORT}` when `db` does not resolve (see `backend/app/core/database_url.py`).
- Set **`POSTGRES_PORT`** to the port Postgres listens on **your machine** (Compose maps `POSTGRES_PORT:5432`, e.g. `5433` if 5432 is taken).

In **`frontend/.env`**:

- `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000` — Next.js proxies `/api/v1/*` to the API in dev (`frontend/next.config.ts`).

### 2. Database (Postgres only — minimal Docker)

Use the pgvector image (plain Postgres will fail on `CREATE EXTENSION vector`):

```bash
docker compose up -d db
make seed          # or: make seed-clear for a fresh demo DB
```

Native Postgres instead of Compose: install **pgvector**, create DB `salondesk`, and set `DATABASE_URL` / `POSTGRES_PORT` to match your host.

### 3. One-time install

```bash
pnpm install                    # repo root (Husky hooks)
cd backend && uv sync --group dev
cd frontend && pnpm install
```

### 4. Run the app (three terminals)

Use **separate terminals** so each process can be restarted independently.

| Terminal | Directory | Command | URL |
|----------|-----------|---------|-----|
| **A — API** | `backend/` | `uv run fastapi dev app/main.py` | http://127.0.0.1:8000 · [Docs](http://127.0.0.1:8000/docs) |
| **B — Web** | `frontend/` | `pnpm dev` | http://localhost:3000 |
| **C — Voice** (optional) | repo root or `backend/` | `make voice-agent` | LiveKit worker (see below) |

**Terminal A — Backend**

```bash
cd backend
uv run fastapi dev app/main.py
```

**Terminal B — Frontend**

```bash
cd frontend
pnpm dev
```

Restart frontend after changing any `NEXT_PUBLIC_*` variable.

**Terminal C — Voice agent (optional)**

Requires LiveKit + Deepgram (and LLM) in root `.env`: `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `DEEPGRAM_API_KEY`, plus `LLM_PROVIDER` / API keys.

```bash
# From repo root
make voice-agent

# Equivalent
cd backend && uv run python agent.py start
```

Match **`NEXT_PUBLIC_LIVEKIT_URL`** in `frontend/.env` to **`LIVEKIT_URL`** in root `.env`. The browser gets a JWT from `POST /api/v1/livekit/token`; secrets stay on the server.

For **RAG** (chat + voice grounding), after seeding:

```bash
docker compose up -d ollama   # optional, for local embeddings
ollama pull all-minilm
make ingest-knowledge
```

Text concierge without voice: enable `NEXT_PUBLIC_ENABLE_AGENT_CHAT=true` and use `POST /api/v1/chat` (no Terminal C).

### 5. Smoke check

```bash
curl -s http://127.0.0.1:8000/health
curl -s http://127.0.0.1:8000/api/v1/catalog/categories   # public catalog
```

Open http://localhost:3000 — client catalog is public; sign in with [demo accounts](#demo-accounts) for admin/merchant/client portals.

**UI conventions:** [frontend/AGENTS.md](frontend/AGENTS.md) · **Monorepo layout:** [AGENTS.md](AGENTS.md)

---

## Lint, format & git hooks

Husky runs at the **repo root** (not inside `frontend/` or `backend/`) so one pre-commit gate covers both apps.

### One-time setup

```bash
# From repo root — installs husky + lint-staged and wires .husky/
pnpm install

# Backend lint/format/test tools (ruff, pytest)
cd backend && uv sync --group dev
```

`pnpm install` at the root runs `prepare` → `husky`, which sets `core.hooksPath` to `.husky/_`.

### What runs on commit

| Staged paths | Pre-commit actions |
|---|---|
| `frontend/**` | `lint-staged` (ESLint + Prettier on staged files), then `pnpm format`, `pnpm lint`, `pnpm typecheck` |
| `backend/**` | `lint-staged` (Ruff check `--fix` + format on staged `.py`), then full `ruff check`, `ruff format --check`, `pytest` |

Config: [`.husky/pre-commit`](.husky/pre-commit), [`lint-staged.config.mjs`](lint-staged.config.mjs), [`package.json`](package.json).

Skip hooks for an emergency commit only: `HUSKY=0 git commit …` (prefer fixing the gate instead).

### Manual commands

| Area | Check | Fix |
|---|---|---|
| Frontend | `pnpm --dir frontend validate` | `pnpm --dir frontend lint:fix` · `pnpm --dir frontend format:fix` |
| Backend | `cd backend && uv run ruff check . && uv run ruff format --check . && uv run pytest` | `cd backend && uv run ruff check --fix . && uv run ruff format .` |
| Both | `pnpm validate` or `make validate` | `make format` then re-run validate |

| Make target | Description |
|---|---|
| `make lint` / `make lint-frontend` / `make lint-backend` | Lint only |
| `make format` / `make format-frontend` / `make format-backend` | Auto-fix + format |
| `make validate` | Full frontend + backend gate (same spirit as CI / husky) |

**Tooling:** frontend uses **ESLint** + **Prettier**; backend uses **Ruff** (lint + format) and **pytest**. Ruff settings live in [`backend/pyproject.toml`](backend/pyproject.toml).

---

## Database seed

Demo data includes **Selam Hair Studio**, platform admin/staff, categories, commissions, services, clients, and sample bookings.

**Important:** root `.env` may use hostname `db` for Compose; **`make seed`** / **`make ingest-knowledge`** and the running API on the host use **`localhost:$POSTGRES_PORT`**. Use image `pgvector/pgvector:pg16` — plain Postgres cannot create the `vector` extension. If Homebrew Postgres already owns `5432`, set `POSTGRES_PORT=5433` in `.env`. Start Postgres first:

```bash
docker compose up -d db
```

| Command | Behavior |
|---|---|
| `make seed` | Insert demo data if not already present |
| `make seed-clear` | **Truncate all tables**, then seed fresh |

From `backend/` (explicit localhost URL recommended on the host):

```bash
# Without clear (no-op if already seeded)
uv run python -m scripts.seed \
  --database-url 'postgresql+asyncpg://postgres:postgres@localhost:5432/salondesk'

# With clear
uv run python -m scripts.seed --clear \
  --database-url 'postgresql+asyncpg://postgres:postgres@localhost:5432/salondesk'
```

If you run the seed script without `--database-url` and `.env` still points at `@db:…`, the seed script and FastAPI settings rewrite `db` → `localhost:${POSTGRES_PORT}` when `db` is not resolvable on the host.

### Demo accounts

Password for all seeded users: `Password123!`

| Email | Role |
|---|---|
| `admin@salondesk.local` | Platform admin |
| `staff@salondesk.local` | Platform staff |
| `owner@selam.local` | Org owner |
| `reception@selam.local` | Reception |
| `stylist1@selam.local` / `stylist2@selam.local` | Stylists |
| `client@example.com` / `client2@example.com` | Clients |

Judge demo reset (non-production): `POST /api/demo/reset` (clear + seed).

---

## LLM providers

Choose one provider in `.env`:

```bash
LLM_PROVIDER=groq   # groq | ollama | openai

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini

GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-120b

OLLAMA_MODEL=llama3.2:1b
OLLAMA_BASE_URL=http://localhost:11434/v1
```

Provider classes live under `backend/app/ai/llm/` (`GroqLLMService`, `OllamaLLMService`, `OpenAILLMService`). `app/services/llm/` may re-export for compatibility. Restart the API after changing `LLM_PROVIDER`.

---

## Voice agent + RAG

**FastAPI** serves tokens/chat; a **separate LiveKit worker** handles realtime voice. Both share `retrieve_context()` over Postgres/pgvector `knowledge_chunk` — an entity-linked semantic index of approved orgs, active services, categories, and policies (plus optional platform FAQ). Recommendations are hydrated from live ORM rows (PRD AI grounding).

```
Browser mic → LiveKit room ← JWT from POST /api/v1/livekit/token
                 ↓
         Python voice worker (backend/agent.py → app.ai.agent)
         STT → retrieve_context + tools → LLM → TTS
                 ↓
         knowledge_chunk (pgvector) → hydrate Service cards
                 ↑
Text chat POST /api/v1/chat  (same pipeline + recommendation cards)
```

### Setup

1. Use a **pgvector** Postgres image (`docker compose` already uses `pgvector/pgvector:pg16`).
2. Seed catalog data, then start Ollama and pull the embed model:
   ```bash
   make seed
   docker compose up -d ollama
   ollama pull all-minilm
   ```
3. Index live platform data into `knowledge_chunk`:
   ```bash
   make ingest-knowledge
   ```
4. Configure LiveKit + Deepgram in `.env` (`LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `DEEPGRAM_API_KEY`).
5. Run the API plus the voice worker — same as [Local development without Docker](#local-development-without-docker) (Terminal A + Terminal C).

### APIs

| Endpoint | Purpose |
|---|---|
| `POST /api/v1/livekit/token` | Mint room JWT + agent dispatch (`{ language?: "en"\|"am" }`) |
| `POST /api/v1/chat` | Text chat: reply + citations + service recommendation cards |

Ingest: live DB via [`backend/scripts/ingest_knowledge.py`](backend/scripts/ingest_knowledge.py) (+ optional [`backend/data/knowledge_en.json`](backend/data/knowledge_en.json) platform FAQ).
Schema: [`backend/schema_rag.sql`](backend/schema_rag.sql) / ORM `KnowledgeChunk`.

**Design notes:** one RAG pipeline for chat and voice; per-turn inject with timeout; booking intent keeps scheduling focus; room name encodes language (`salondesk-agent-{en|am}-…`); never invent prices or open slots.

---

## Postman collection

Generate/refresh from OpenAPI (no server required):

```bash
make postman
```

Output: [`postman/collection.json`](postman/collection.json).
Details: [`docs/postman/README.md`](docs/postman/README.md).

---

## Make targets

| Target | Description |
|---|---|
| `make seed` | Seed demo data (skip if present) |
| `make seed-clear` | Clear DB + seed |
| `make seed-help` | Print seed usage |
| `make ingest-knowledge` | Re-index live catalog (+ FAQ) into pgvector |
| `make voice-agent` | Start LiveKit voice worker |
| `make postman` | Generate Postman collection |
| `make postman-help` | Print Postman usage |
| `make lint` | Lint frontend (ESLint) + backend (Ruff) |
| `make format` | Auto-fix/format frontend + backend |
| `make validate` | Full quality gate (format check, lint, typecheck, pytest) |

---

## Project layout

```
AGENTS.md         Monorepo agent guide (backend + pointers to frontend)
.husky/           Git hooks (pre-commit for frontend + backend)
package.json      Root husky + lint-staged + validate scripts
lint-staged.config.mjs
backend/
  agent.py        LiveKit worker CLI
  app/
    api/deps/     Shared FastAPI dependencies
    api/v1/       shared | platform | org | client | webhooks routers
    ai/           RAG, LLM, LiveKit agent worker, tools
    models/       SQLAlchemy models
    services/     Domain services
    tasks/        Scheduled / background jobs
  scripts/        seed, ingest_knowledge (CLI)
  tests/          pytest (api, services, integrations)
frontend/
  AGENTS.md       Next.js conventions (RTK, portals, client components)
  app/            App Router portals + Providers.tsx
  store/          Redux + RTK Query API slices
postman/          Generated collection.json
docker-compose.yml
```

**Agent docs:** [AGENTS.md](AGENTS.md) (repo) · [frontend/AGENTS.md](frontend/AGENTS.md) (Next.js detail).
Postman notes (if present): [`docs/postman/README.md`](docs/postman/README.md).

---

## Useful API prefixes

Routers are grouped under `backend/app/api/v1/{shared,platform,org,client,webhooks}/`; HTTP paths below are unchanged for clients.

| Prefix | Area |
|---|---|
| `/api/v1/auth` | Sign-up, sign-in, profile, password reset |
| `/api/v1/catalog` | Public org/service discovery |
| `/api/v1/bookings` | Client bookings, consent, cancel |
| `/api/v1/organizations` | Org portal (settings, staff, services, finance) |
| `/api/v1/admin` | Platform admin |
| `/api/v1/payments` | Authorization holds |
| `/api/v1/settlements` | Mark show / no-show |
| `/api/v1/ai` | Booking assistant / owner copilot |
| `/api/v1/chat` | RAG text chat |
| `/api/v1/livekit` | Voice room tokens |
| `/api/v1/webhooks` | PayPal (and other) webhooks |
| `/health` | Health check |

Frontend RTK Query clients: `frontend/store/api/{shared,platform,org,client}Api.ts`.




<!-- VPS -->
```bash
# Demo seed (20 orgs, ~60-100 services):
docker exec -it salondesk sh -lc 'cd /app/backend && python -m scripts.seed --clear'

# Full catalog seed (~432 orgs, ~9,100 services):
docker exec -it salondesk sh -lc 'cd /app/backend && python -m scripts.seed --clear --all'

# Seed and ingest knowledge (demo):
docker exec -it salondesk sh -lc 'cd /app/backend && python -m scripts.seed --clear && python -m scripts.ingest_knowledge'

# Seed and ingest knowledge (full):
docker exec -it salondesk sh -lc 'cd /app/backend && python -m scripts.seed --clear --all && python -m scripts.ingest_knowledge'
```

