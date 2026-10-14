#!/usr/bin/env bash
set -euo pipefail

export PGDATA="${PGDATA:-/var/lib/postgresql/data}"
export POSTGRES_USER="${POSTGRES_USER:-postgres}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
export POSTGRES_DB="${POSTGRES_DB:-salondesk}"

mkdir -p /var/log/supervisor /run/nginx
chown -R postgres:postgres "$PGDATA" 2>/dev/null || true

if [ ! -s "$PGDATA/PG_VERSION" ]; then
  echo "Initializing PostgreSQL data directory..."
  install -d -o postgres -g postgres -m 0700 "$PGDATA"
  su - postgres -s /bin/bash -c "initdb -D '$PGDATA' --auth-local=trust --auth-host=scram-sha-256"

  {
    echo "listen_addresses = '127.0.0.1'"
    echo "port = 5432"
  } >> "$PGDATA/postgresql.conf"

  echo "host all all 127.0.0.1/32 scram-sha-256" >> "$PGDATA/pg_hba.conf"

  su - postgres -s /bin/bash -c "/usr/lib/postgresql/15/bin/pg_ctl -D '$PGDATA' -o '-c listen_addresses=127.0.0.1' -w start"
  su - postgres -s /bin/bash -c "psql -v ON_ERROR_STOP=1 -c \"ALTER USER postgres PASSWORD '${POSTGRES_PASSWORD}';\""
  su - postgres -s /bin/bash -c "createdb -O postgres '${POSTGRES_DB}'" || true
  su - postgres -s /bin/bash -c "/usr/lib/postgresql/15/bin/pg_ctl -D '$PGDATA' -m fast -w stop"
fi

export DATABASE_URL="${DATABASE_URL:-postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@127.0.0.1:5432/${POSTGRES_DB}}"

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/salondesk.conf
