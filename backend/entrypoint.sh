#!/usr/bin/env sh
set -e

echo "Running database migrations..."
alembic upgrade head

echo "Seeding demo data..."
python -m scripts.seed

echo "Starting application..."
exec "$@"
