#!/usr/bin/env bash
# Roll out the all-in-one SalonDesk image on the host (VPS or self-hosted runner).
set -euo pipefail

IMAGE="${IMAGE:?IMAGE is required}"
CONTAINER_NAME="${CONTAINER_NAME:-salondesk}"
PUBLISH_PORT="${APP_PORT:-8080}"
ENV_FILE="${SALONDESK_ENV_FILE:-/opt/salondesk/.env}"
VOLUME_NAME="${SALONDESK_PG_VOLUME:-salondesk_pgdata}"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: env file not found: $ENV_FILE"
  exit 1
fi

echo "Pulling $IMAGE ..."
docker pull --quiet "$IMAGE"

echo "Stopping previous container (if any) ..."
docker stop "$CONTAINER_NAME" 2>/dev/null || true
docker rm "$CONTAINER_NAME" 2>/dev/null || true

if ss -tln 2>/dev/null | grep -qE ":${PUBLISH_PORT}\\b"; then
  echo "ERROR: host port ${PUBLISH_PORT} is still in use. Set VPS_APP_PORT to a free port."
  ss -tlnp 2>/dev/null | grep -E ":${PUBLISH_PORT}\\b" || true
  exit 1
fi

echo "Starting $CONTAINER_NAME on 127.0.0.1:${PUBLISH_PORT} ..."
docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  -p "127.0.0.1:${PUBLISH_PORT}:80" \
  -v "${VOLUME_NAME}:/var/lib/postgresql/data" \
  --env-file "$ENV_FILE" \
  "$IMAGE"

echo "Waiting for /health ..."
for i in $(seq 1 40); do
  if curl -sf --max-time 3 "http://127.0.0.1:${PUBLISH_PORT}/health" >/dev/null; then
    echo "SalonDesk healthy on 127.0.0.1:${PUBLISH_PORT} (attempt $i)"
    docker image prune -f >/dev/null 2>&1 || true
    exit 0
  fi
  sleep 3
done

echo "Deployed container failed health check"
docker logs "$CONTAINER_NAME" --tail 120 || true
exit 1
