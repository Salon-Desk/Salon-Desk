#!/usr/bin/env sh
# Voice worker for Render — waits on API health (managed Postgres, not local).
set -e

cd /app/backend

export PATH="/usr/local/bin:/usr/bin:${PATH:-}"
export PYTHONPATH="/app/backend"

if [ -z "${LIVEKIT_URL:-}" ] || [ -z "${LIVEKIT_API_KEY:-}" ] || [ -z "${LIVEKIT_API_SECRET:-}" ]; then
  echo "LiveKit credentials not configured (LIVEKIT_URL / LIVEKIT_API_KEY / LIVEKIT_API_SECRET). Voice worker idle."
  exec sleep infinity
fi

echo "Voice worker waiting for API health..."
i=0
while [ "$i" -lt 90 ]; do
  if curl -sf http://127.0.0.1:8000/health >/dev/null 2>&1; then
    break
  fi
  i=$((i + 1))
  sleep 2
done

echo "Starting LiveKit voice worker..."
exec python agent.py start
