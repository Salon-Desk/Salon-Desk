# SalonDesk — Local Development & Setup Guide

This guide covers running SalonDesk locally on your machine, configuring database seeding, running test suites, and Docker deployment.

---

## 1. Prerequisites

| Tool | Recommended Version | Purpose |
|------|---------------------|---------|
| [Node.js](https://nodejs.org/) | 20+ (with **pnpm**) | Frontend + root Husky pre-commit hooks |
| [uv](https://docs.astral.sh/uv/) | Latest | Python package management & virtual environment |
| **Python** | 3.11+ | FastAPI backend |
| **Docker** | Latest | PostgreSQL with `pgvector/pgvector:pg16` |

---

## 2. Environment Configuration

### Root `.env` (Backend & Shared)
Copy the example template:
```bash
cp .env.example .env
```

Key environment variables:
- `DATABASE_URL`: `postgresql+asyncpg://postgres:postgres@localhost:5432/salondesk` (FastAPI automatically handles Compose `@db` vs localhost resolution).
- `POSTGRES_PORT`: Port Postgres listens on your machine (e.g., `5432` or `5433` if 5432 is in use).
- `SECRET_KEY`: JWT signing secret (minimum 32 characters).
- `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET`: PayPal Sandbox developer credentials.
- `PAYPAL_WEBHOOK_ID`: Webhook ID registered in PayPal Developer Dashboard.
- `LLM_PROVIDER`: `groq` | `openai` | `ollama` (configure corresponding API keys).

### Frontend `.env`
Copy the frontend example:
```bash
cp frontend/.env.example frontend/.env
```
Key variables:
- `NEXT_PUBLIC_API_URL`: `http://127.0.0.1:8000` (Next.js proxies `/api/v1/*` to backend in development).
- `NEXT_PUBLIC_LIVEKIT_URL`: WebSocket URL for LiveKit voice server (e.g. `wss://your-project.livekit.cloud`).
- `NEXT_PUBLIC_ENABLE_AGENT_CHAT`: `true` to enable the text concierge floating widget.

---

## 3. Database Setup (Docker minimal)

SalonDesk requires the `pgvector` extension for semantic catalog search. Use the official `pgvector` Docker image:

```bash
# Start Postgres with pgvector in the background
docker compose up -d db

# Run initial database seed
make seed
```

> [!NOTE]
> If you have a native Postgres instance on macOS (e.g. via Homebrew) already using port 5432, set `POSTGRES_PORT=5433` in `.env`.

---

## 4. One-Time Dependencies Installation

```bash
# Install root pre-commit hooks and tooling
pnpm install

# Install backend dependencies in virtualenv
cd backend && uv sync --group dev

# Install frontend dependencies
cd ../frontend && pnpm install
cd ..
```

---

## 5. Running the Application (3 Terminals)

Run each service in a separate terminal so they can be independently restarted and monitored:

| Terminal | Service | Directory | Command | URL |
|----------|---------|-----------|---------|-----|
| **Terminal 1** | **Backend API** | `backend/` | `uv run fastapi dev app/main.py` | [http://127.0.0.1:8000](http://127.0.0.1:8000) · [Interactive Swagger Docs](http://127.0.0.1:8000/docs) |
| **Terminal 2** | **Frontend Web** | `frontend/` | `pnpm dev` | [http://localhost:3000](http://localhost:3000) |
| **Terminal 3** | **Voice Worker** *(optional)* | `backend/` | `make voice-agent` | LiveKit agent worker |

### Terminal 1: Backend API
```bash
cd backend
uv run fastapi dev app/main.py
```

### Terminal 2: Next.js Frontend
```bash
cd frontend
pnpm dev
```

### Terminal 3: LiveKit Voice Worker (Optional)
```bash
# From repo root
make voice-agent

# Or directly from backend directory:
cd backend && uv run python agent.py start
```

---

## 6. Database Seeding & Reset Commands

The database seed populates **Selam Hair Studio** (Flagship salon), stylists, services (Box Braids $120, Silk Press $65), working hours, customer bookings, and a pre-seeded dispute case.

```bash
# Seed demo data (idempotent, skips if already seeded)
make seed

# Reset: Truncate all tables and re-seed clean demo state
make seed-clear

# Inspect seed CLI options
make seed-help
```

You can also run the seed script directly with Python:
```bash
cd backend
uv run python -m scripts.seed --clear
```

### Demo Reset via API
To programmatically reset demo data (e.g., from frontend or integration tests):
```bash
curl -X POST http://127.0.0.1:8000/api/v1/demo/reset
```

---

## 7. Testing & Quality Gate

### Run Pytest Suite
The backend includes 235 unit and integration tests covering API endpoints, policy invariants, Ed25519 signatures, SHA-256 ledger chaining, and PayPal service flows.

```bash
cd backend
uv run pytest -v
```

Run specific test modules:
```bash
# Dispute Counsel 3-role pipeline test
uv run pytest tests/services/test_dispute_counsel.py -v

# Policy engine and ceiling invariants test
uv run pytest tests/test_policy_engine.py -v

# Slot Rescue test
uv run pytest tests/services/test_slot_rescue.py -v
```

### Linting & Formatting
SalonDesk enforces clean code with Ruff (Python) and ESLint/Prettier (TypeScript).

```bash
# Run both frontend and backend linters
make lint

# Auto-format both codebases
make format

# Full validation gate (Ruff, ESLint, TypeScript check, Pytest)
make validate
```

---

## 8. Docker All-in-One Deployment

To run the complete stack including backend, frontend, and database inside Docker Compose:

```bash
cp .env.example .env
docker compose up --build
```

### VPS Production Administration
Useful commands when running on a remote Ubuntu VPS:
```bash
# Fast demo seed inside container:
docker exec -it salondesk sh -lc 'cd /app/backend && python -m scripts.seed --clear'

# Ingest semantic knowledge chunks:
docker exec -it salondesk sh -lc 'cd /app/backend && python -m scripts.ingest_knowledge'

# Check container logs:
docker logs salondesk -f --tail 100
```

---

## 9. Make Targets Reference

A convenient `Makefile` in the project root streamlines development and validation commands:

| Make Target | Description |
|---|---|
| `make seed` | Seed demo data into PostgreSQL (skips if already seeded) |
| `make seed-clear` | Clear the database and re-seed clean demo state |
| `make seed-help` | Print seed CLI options and parameters |
| `make ingest-knowledge` | Re-index live catalog and policies into `pgvector` knowledge chunks |
| `make voice-agent` | Start the LiveKit voice concierge worker |
| `make postman` | Regenerate the Postman collection from OpenAPI schema |
| `make postman-help` | Print Postman collection utility options |
| `make lint` | Run code linters (ESLint for Next.js, Ruff for FastAPI) |
| `make format` | Automatically format frontend (Prettier) and backend (Ruff) |
| `make validate` | Full CI quality gate (formatting, linting, typechecking, pytest) |

---

## 10. Monorepo Architecture Layout

```
Salon-Desk/
├── backend/
│   ├── agent.py               # LiveKit RTC full-duplex voice concierge worker
│   ├── app/
│   │   ├── ai/                # RAG, LLM providers (Groq/OpenAI/Ollama), voice tools
│   │   ├── api/
│   │   │   ├── deps/          # Shared FastAPI dependencies (auth, db, permissions)
│   │   │   └── v1/            # API routers: auth, catalog, bookings, orgs, settlements, disputes
│   │   ├── core/              # Security firewalls, Ed25519 crypto, config
│   │   ├── models/            # SQLAlchemy models (bookings, holds, SHA-256 ledger, disputes)
│   │   ├── schemas/           # Pydantic v2 validation schemas
│   │   ├── services/          # PayPal REST, capture, dispute counsel, slot rescue
│   │   └── tasks/             # Celery & background tasks (hold expiration, sync)
│   ├── scripts/               # Database seeding and pgvector knowledge ingestion CLI
│   └── tests/                 # 235 passing unit and integration tests (pytest)
├── frontend/
│   ├── app/                   # Next.js App Router (Client, Merchant, Platform Admin portals)
│   ├── components/            # UI components, dispute drawer, voice/chat widget, demo modal
│   ├── lib/                   # API mappers, sandbox personas, store helpers
│   └── store/                 # Redux Toolkit & RTK Query API client slices
├── docs/                      # Architectural specs, dispute flows, and setup guides
├── postman/                   # Auto-generated Postman collection (collection.json)
├── .github/workflows/         # GitHub Actions automated CI workflow
├── docker-compose.yml         # Local container orchestration (db, backend, frontend)
└── Makefile                   # Common development and validation commands
```


