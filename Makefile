.PHONY: postman postman-help seed seed-clear seed-help ingest-knowledge voice-agent \
	lint lint-frontend lint-backend format format-frontend format-backend validate

# Generate Postman Collection v2.1 from the FastAPI OpenAPI schema (no server required).
# Prerequisites: Python deps via uv (backend/), Node.js 18+ with npx.
postman:
	cd backend && uv run python scripts/generate_postman_collection.py

postman-help:
	@echo "make postman"
	@echo "  Exports OpenAPI from app.main:app, converts with openapi-to-postmanv2,"
	@echo "  and writes postman/collection.json"
	@echo ""
	@echo "Prerequisites:"
	@echo "  - uv + backend dependencies (cd backend && uv sync)"
	@echo "  - Node.js 18+ with npx (used to run openapi-to-postmanv2)"

# Load POSTGRES_PORT from root .env when present (avoids Homebrew Postgres on 5432).
-include .env
export
POSTGRES_PORT ?= 5432

# Host-side seed/ingest use localhost (Compose hostname `db` only works in containers).
# Override: make seed SEED_DATABASE_URL='postgresql+asyncpg://…'
SEED_DATABASE_URL ?= postgresql+asyncpg://postgres:postgres@localhost:$(POSTGRES_PORT)/salondesk
SEED_ALL ?= 0

# Seed demo data (12 orgs, 100 services by default; set SEED_ALL=1 or make seed-all for all).
seed:
	cd backend && uv run python -m scripts.seed $(if $(filter 1 true,$(SEED_ALL)),--all,) --database-url "$(SEED_DATABASE_URL)"

# Wipe all tables then seed fresh demo data (12 orgs, 100 services by default).
seed-clear:
	cd backend && uv run python -m scripts.seed --clear $(if $(filter 1 true,$(SEED_ALL)),--all,) --database-url "$(SEED_DATABASE_URL)"

# Seed full dataset (~432 orgs, ~9100 services).
seed-all:
	cd backend && uv run python -m scripts.seed --all --database-url "$(SEED_DATABASE_URL)"

seed-clear-all:
	cd backend && uv run python -m scripts.seed --clear --all --database-url "$(SEED_DATABASE_URL)"

seed-help:
	@echo "make seed"
	@echo "  Insert demo data (20 organizations, ~100 services) if not already present"
	@echo ""
	@echo "make seed-clear"
	@echo "  Truncate all tables, then insert demo data (20 organizations, ~100 services)"
	@echo ""
	@echo "make seed-all / make seed-clear-all"
	@echo "  Seed full catalog (all ~432 organizations, ~9,100 services)"
	@echo ""
	@echo "Ensure Compose pgvector DB is up: docker compose up -d db"
	@echo "  (image must be pgvector/pgvector:pg16 — not plain postgres)"
	@echo "  If Homebrew Postgres owns 5432, set POSTGRES_PORT=5433 in .env"
	@echo ""
	@echo "Override URL:"
	@echo "  make seed SEED_DATABASE_URL='postgresql+asyncpg://postgres:postgres@localhost:$(POSTGRES_PORT)/salondesk'"
	@echo ""
	@echo "From backend/:"
	@echo "  uv run python -m scripts.seed --database-url '$(SEED_DATABASE_URL)'"
	@echo "  uv run python -m scripts.seed --clear --all --database-url '$(SEED_DATABASE_URL)'"

# Index live orgs/services (+ optional FAQ) into pgvector (requires: ollama pull all-minilm)
ingest-knowledge:
	cd backend && uv run python -m scripts.ingest_knowledge --clear --database-url "$(SEED_DATABASE_URL)"

# LiveKit voice worker (separate from uvicorn)
voice-agent:
	cd backend && uv run python agent.py start

# --- Lint / format (mirrors husky pre-commit gates) ---

lint-frontend:
	pnpm --dir frontend lint

lint-backend:
	cd backend && uv run ruff check .

lint: lint-frontend lint-backend

format-frontend:
	pnpm --dir frontend format:fix

format-backend:
	cd backend && uv run ruff check --fix . && uv run ruff format .

format: format-frontend format-backend

validate:
	pnpm validate
