#!/usr/bin/env sh
set -e

cd /app/backend

POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-salondesk}"

echo "Waiting for PostgreSQL..."
until pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" -h 127.0.0.1; do
  sleep 1
done

export DATABASE_URL="${DATABASE_URL:-postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD:-postgres}@127.0.0.1:5432/${POSTGRES_DB}}"

echo "Running database migrations..."
alembic upgrade head

echo "Seeding demo data..."
python -m app.scripts.seed

echo "Starting API..."
exec uvicorn app.main:app --host 127.0.0.1 --port 8000
