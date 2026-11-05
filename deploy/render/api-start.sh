#!/usr/bin/env sh
# API bootstrap for Render — waits on managed Postgres via DATABASE_URL.
set -e

cd /app/backend

export PATH="/usr/local/bin:/usr/bin:${PATH:-}"
export PYTHONPATH="/app/backend"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set"
  exit 1
fi

echo "Waiting for managed PostgreSQL (DATABASE_URL)..."
python - <<'PY'
import asyncio
import os
import sys
import time

import asyncpg


def dsn_for_asyncpg(url: str) -> str:
    # Strip SQLAlchemy dialect prefix for asyncpg.connect
    for prefix in ("postgresql+asyncpg://", "postgres+asyncpg://"):
        if url.startswith(prefix):
            return "postgresql://" + url[len(prefix) :]
    return url


async def wait_ready(timeout_s: float = 120.0) -> None:
    url = dsn_for_asyncpg(os.environ["DATABASE_URL"])
    deadline = time.monotonic() + timeout_s
    last_err = None
    while time.monotonic() < deadline:
        try:
            conn = await asyncpg.connect(url, timeout=5)
            await conn.execute("SELECT 1")
            await conn.close()
            return
        except Exception as exc:  # noqa: BLE001 — retry until ready
            last_err = exc
            await asyncio.sleep(2)
    print(f"ERROR: Postgres not reachable: {last_err}", file=sys.stderr)
    sys.exit(1)


asyncio.run(wait_ready())
print("PostgreSQL is accepting connections")
PY

echo "Ensuring pgvector extension..."
python - <<'PY'
import asyncio
import os
import sys


def dsn_for_asyncpg(url: str) -> str:
    for prefix in ("postgresql+asyncpg://", "postgres+asyncpg://"):
        if url.startswith(prefix):
            return "postgresql://" + url[len(prefix) :]
    return url


async def ensure_vector() -> None:
    import asyncpg

    conn = await asyncpg.connect(dsn_for_asyncpg(os.environ["DATABASE_URL"]))
    try:
        await conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
        print("pgvector extension ready")
    except Exception as exc:  # noqa: BLE001
        print(
            f"WARNING: could not create pgvector extension — RAG may fail: {exc}",
            file=sys.stderr,
        )
    finally:
        await conn.close()


asyncio.run(ensure_vector())
PY

echo "Running database migrations..."
alembic upgrade head

if [ "${SKIP_SEED:-1}" = "1" ] || [ "${SKIP_SEED:-}" = "true" ]; then
  echo "Skipping demo seed (SKIP_SEED=${SKIP_SEED:-1})"
else
  echo "Seeding demo data..."
  python -m scripts.seed
fi

echo "Starting API..."
exec uvicorn app.main:app --host 127.0.0.1 --port 8000
