#!/usr/bin/env bash
# Render entrypoint — external Postgres only (no embedded DB).
set -euo pipefail

export PORT="${PORT:-10000}"
export STORAGE_BACKEND="${STORAGE_BACKEND:-local}"
export STORAGE_LOCAL_DIR="${STORAGE_LOCAL_DIR:-/var/lib/salondesk/storage}"

mkdir -p /var/log/supervisor /run/nginx "$STORAGE_LOCAL_DIR"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is required for Render deploys (use Render Postgres Internal URL)."
  exit 1
fi

# Render provides postgresql:// — SQLAlchemy async needs postgresql+asyncpg://
case "$DATABASE_URL" in
  postgresql+asyncpg://*) ;;
  postgres://*)
    export DATABASE_URL="postgresql+asyncpg://${DATABASE_URL#postgres://}"
    ;;
  postgresql://*)
    export DATABASE_URL="postgresql+asyncpg://${DATABASE_URL#postgresql://}"
    ;;
esac

# External / some Internal URLs need TLS
if [ "${DATABASE_SSL:-}" = "require" ] || [ "${DATABASE_SSL:-}" = "true" ]; then
  case "$DATABASE_URL" in
    *ssl=*|*sslmode=*) ;;
    *)
      if [[ "$DATABASE_URL" == *"?"* ]]; then
        export DATABASE_URL="${DATABASE_URL}&ssl=require"
      else
        export DATABASE_URL="${DATABASE_URL}?ssl=require"
      fi
      ;;
  esac
fi

sed "s/__LISTEN_PORT__/${PORT}/g" /app/deploy/render/nginx.conf.template >/etc/nginx/nginx.conf

echo "Render entrypoint ready (PORT=${PORT}, STORAGE_BACKEND=${STORAGE_BACKEND})"
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/salondesk.conf
