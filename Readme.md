# SalonDesk

Multi-tenant salon booking platform with three apps:

1. **Client app** — discover salons/services and book appointments  
2. **Organization portal** — staff, services, schedules, bookings, PayPal account  
3. **Platform admin** — orgs, commissions, categories, change-request approvals  

Stack: **FastAPI** (`backend/`) + **Next.js** (`frontend/`) + **PostgreSQL**.

---

## Quick start

```bash
# 1. Environment
cp .env.example .env
# Edit .env (PayPal, LLM keys, secrets)

# 2. Database (Compose)
docker compose up -d db

# 3. Root tooling (Husky git hooks — once per clone)
pnpm install

# 4. Backend
cd backend
uv sync --group dev
uv run fastapi dev app/main.py
# API: http://127.0.0.1:8000  ·  Docs: http://127.0.0.1:8000/docs

# 5. Frontend (separate terminal)
cd frontend
pnpm install
pnpm dev
# App: http://localhost:3000
```

Full stack via Compose:

```bash
docker compose up --build
```

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

**Important:** root `.env` uses hostname `db` for Docker Compose. `make seed` / `make ingest-knowledge` connect to **`localhost:$POSTGRES_PORT`** (default `5432`). Use image `pgvector/pgvector:pg16` — plain Postgres cannot create the `vector` extension. If Homebrew Postgres already owns `5432`, set `POSTGRES_PORT=5433` in `.env`. Start Postgres first:

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
uv run python -m app.scripts.seed \
  --database-url 'postgresql+asyncpg://postgres:postgres@localhost:5432/salondesk'

# With clear
uv run python -m app.scripts.seed --clear \
  --database-url 'postgresql+asyncpg://postgres:postgres@localhost:5432/salondesk'
```

If you run the seed script without `--database-url` and `.env` still points at `@db:…`, the script rewrites `db` → `localhost` automatically when `db` is not resolvable.

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

Provider classes live under `backend/app/services/llm/` (`GroqLLMService`, `OllamaLLMService`, `OpenAILLMService`). Restart the API after changing `LLM_PROVIDER`.

---

## Voice agent + RAG

**FastAPI** serves tokens/chat; a **separate LiveKit worker** handles realtime voice. Both share `retrieve_context()` over Postgres/pgvector `knowledge_chunk` — an entity-linked semantic index of approved orgs, active services, categories, and policies (plus optional platform FAQ). Recommendations are hydrated from live ORM rows (PRD AI grounding).

```
Browser mic → LiveKit room ← JWT from POST /api/v1/livekit/token
                 ↓
         Python voice worker (agent.py)
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
5. Run **two processes**:
   ```bash
   # Terminal A — API
   cd backend && uv run fastapi dev app/main.py

   # Terminal B — voice worker
   make voice-agent
   # or: cd backend && uv run python agent.py start
   ```

### APIs

| Endpoint | Purpose |
|---|---|
| `POST /api/v1/livekit/token` | Mint room JWT + agent dispatch (`{ language?: "en"\|"am" }`) |
| `POST /api/v1/chat` | Text chat: reply + citations + service recommendation cards |

Ingest: live DB via [`backend/app/scripts/ingest_knowledge.py`](backend/app/scripts/ingest_knowledge.py) (+ optional [`backend/data/knowledge_en.json`](backend/data/knowledge_en.json) platform FAQ).  
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
.husky/           Git hooks (pre-commit for frontend + backend)
package.json      Root husky + lint-staged + validate scripts
lint-staged.config.mjs
backend/          FastAPI app, models, APIs, seed script (Ruff + pytest)
frontend/         Next.js portals (client / merchant / admin) (ESLint + Prettier)
docs/             Feature schema, PRD, Postman notes
postman/          Generated collection.json
docker-compose.yml
```

Feature schema: [`docs/features.md`](docs/features.md)  
Product requirements: [`docs/writing-block.md`](docs/writing-block.md)

---

## Useful API prefixes

| Prefix | Area |
|---|---|
| `/api/v1/auth` | Sign-up, sign-in, profile, password reset |
| `/api/v1/catalog` | Public org/service discovery |
| `/api/v1/bookings` | Client bookings, consent, cancel |
| `/api/v1/organizations` | Org portal |
| `/api/v1/admin` | Platform admin |
| `/api/v1/payments` | Authorization holds |
| `/api/v1/settlements` | Mark show / no-show |
| `/api/v1/ai` | Booking assistant / owner copilot |
| `/api/v1/chat` | RAG text chat |
| `/api/v1/livekit` | Voice room tokens |
| `/health` | Health check |
