#!/usr/bin/env sh
set -e

cd /app/backend

export PATH="/usr/local/bin:/usr/bin:${PATH:-}"
export PYTHONPATH="/app/backend"

POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-salondesk}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
# Required for host-based scram-sha-256 auth (psql -h 127.0.0.1).
export PGPASSWORD="$POSTGRES_PASSWORD"

echo "Waiting for PostgreSQL..."
until pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" -h 127.0.0.1; do
  sleep 1
done

export DATABASE_URL="${DATABASE_URL:-postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@127.0.0.1:5432/${POSTGRES_DB}}"

echo "Ensuring pgvector extension..."
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -h 127.0.0.1 -v ON_ERROR_STOP=1 \
  -c "CREATE EXTENSION IF NOT EXISTS vector;" || {
  echo "WARNING: could not create pgvector extension — RAG vector search may fail"
}

echo "Running database migrations..."
alembic upgrade head

if [ "${SKIP_SEED:-0}" = "1" ] || [ "${SKIP_SEED:-}" = "true" ]; then
  echo "Skipping demo seed (SKIP_SEED=${SKIP_SEED})"
else
  echo "Seeding demo data..."
  python -m app.scripts.seed
fi

echo "Starting API..."
exec uvicorn app.main:app --host 127.0.0.1 --port 8000
