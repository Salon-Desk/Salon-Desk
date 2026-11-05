# SalonDesk — repository agent guide

Monorepo for a multi-tenant salon booking demo: **FastAPI** (`backend/`) + **Next.js** (`frontend/`) + **PostgreSQL** (pgvector for RAG).

| Doc | Audience |
| --- | --- |
| [backend/AGENTS.md](backend/AGENTS.md) | FastAPI, SQLAlchemy, payments, AI/RAG, migrations, and tests |
| [frontend/AGENTS.md](frontend/AGENTS.md) | Next.js App Router, Redux, portal UI conventions |
| [Readme.md](Readme.md) | Product overview, evaluator quick start, PayPal integrations, and documentation links |
| [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md) | Local development, database seeding, test execution, and Make targets |
| [docs/PERMISSIONS_MAPPER.md](docs/PERMISSIONS_MAPPER.md) | Actor roles, permissions matrix, and route/action access mapper |

**English-only.** Do not add i18n, locale providers, translation dictionaries, or `_localization/` folders.

## Cross-cutting rules

- **Commits**: only when the user asks; never force-push `main`; follow existing message style.
- **Quality gate**: root Husky pre-commit runs frontend (`format`, `lint`, `typecheck`) and backend (Ruff, pytest) — see [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md#7-testing--quality-gate).
- **Env**: root `.env`; frontend public vars use `NEXT_PUBLIC_*`.
- **Demo reset**: `POST /api/demo/reset` (backend); frontend toolbar uses Redux demo slice resets via `lib/sandbox/demo-reset.ts`.

## Backend layout (`backend/`)

```
agent.py                 Thin LiveKit CLI → app.ai.agent.worker
app/
  main.py                FastAPI app factory
  api/
    deps/                auth, database, permissions (shared Depends)
    v1/
      api.py             Master router
      shared/            auth, profile
      platform/          /admin/* — orgs, users, categories, commissions, requests, analytics
      org/               /organizations/*, /settlements/* — merchant portal APIs
      client/            /catalog, /bookings, /payments, /chat, /livekit, /ai
      webhooks/          PayPal webhooks
      demo.py            Sandbox reset
  ai/                    RAG, embeddings, parser, LLM providers, agent worker, tools
  models/                SQLAlchemy (incl. policy.py, ledger/payment splits)
  services/              Domain services (booking, payment, auth, …); some shims to app.ai
  tasks/                 Background jobs (hold expiration, knowledge sync)
  scripts/               Shims → prefer backend/scripts/ for CLI entrypoints
scripts/                 seed, ingest_knowledge, t6_sandbox_runner
tests/                   api/, services/, integrations/
```

### HTTP prefixes (unchanged paths for clients)

All mounted under `/api/v1` unless noted.

| Prefix | Portal / purpose |
| --- | --- |
| `/auth` | Sign-up, sign-in, profile, password reset |
| `/catalog` | Public org/service discovery (client) |
| `/bookings` | Client bookings, consent, cancel |
| `/payments` | Authorization holds |
| `/chat` | RAG text concierge |
| `/livekit` | Voice room tokens |
| `/ai` | Booking assistant / owner copilot |
| `/organizations` | Org portal (settings, staff, services, bookings, finance) |
| `/settlements` | Mark show / no-show |
| `/admin` | Platform admin |
| `/webhooks` | External callbacks |
| `/demo` | Non-prod demo reset |

**LLM providers** live in `app/ai/llm/` (`GroqLLMService`, `OllamaLLMService`, `OpenAILLMService`). Select via `LLM_PROVIDER` in `.env`. Legacy imports under `app/services/llm/` may re-export — prefer `app.ai.llm`.

**Voice worker**: `cd backend && uv run python agent.py start` (or `make voice-agent`).

### Backend commands

```bash
cd backend
uv sync --group dev
uv run fastapi dev app/main.py
uv run pytest
uv run ruff check . && uv run ruff format --check .
```

## Frontend (summary)

Path alias **`@/*`** → `frontend/` root. Package manager: **pnpm**.

- App shell: `app/layout.tsx` + `app/Providers.tsx` (Redux, auth, demo hydrate, global chat widget).
- Portals: `app/client/`, `app/merchant/` (URL alias `/org` → `/merchant` in `middleware.ts`), `app/admin/`, auth under `app/(auth)/`.
- **State**: Redux Toolkit + RTK Query in `store/`; portal demo UI in `*DemoSlice.ts`; seeds/types in `lib/store/` (no persistent store singletons).
- **API client**: `store/baseApi.ts` + `store/api/{shared,platform,org,client}Api.ts` — URLs match backend paths above (`/api/v1/admin/*`, `/organizations/*`, etc.).

Full Next.js feature rules, component naming, and scripts: **[frontend/AGENTS.md](frontend/AGENTS.md)**.
