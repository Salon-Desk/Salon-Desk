#!/usr/bin/env sh
set -e

echo "Running database migrations..."
alembic upgrade head

echo "Seeding demo data (also patches additive schema columns)..."
# Additive schema patch runs inside seed even when data already exists.
# Set SEED_CLEAR=1 to wipe and reseed after major model changes.
if [ "${SEED_CLEAR:-0}" = "1" ]; then
  python -m scripts.seed --clear
else
  python -m scripts.seed
fi

echo "Starting application..."
exec "$@"
