#!/usr/bin/env sh
set -e

cd /app/backend

export PATH="/usr/local/bin:/usr/bin:${PATH:-}"
export PYTHONPATH="/app/backend"

# If LiveKit credentials are not set, don't fail or crash-loop — sleep quietly
if [ -z "${LIVEKIT_URL:-}" ] || [ -z "${LIVEKIT_API_KEY:-}" ] || [ -z "${LIVEKIT_API_SECRET:-}" ]; then
  echo "LiveKit credentials not configured (LIVEKIT_URL / LIVEKIT_API_KEY / LIVEKIT_API_SECRET). Voice worker idle."
  exec sleep infinity
fi

POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-salondesk}"

echo "Voice worker waiting for PostgreSQL..."
until pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" -h 127.0.0.1 >/dev/null 2>&1; do
  sleep 1
done

echo "Voice worker waiting for API health..."
for i in $(seq 1 60); do
  if curl -sf http://127.0.0.1:8000/health >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "Starting LiveKit voice worker..."
exec python agent.py start
