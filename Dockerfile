# All-in-one production image: PostgreSQL + FastAPI + Next.js + nginx (port 80)
# Used by GitHub Actions deploy and docker compose -f docker-compose.single.yml

FROM python:3.11-slim-bookworm AS api-builder
WORKDIR /build
RUN apt-get update && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM node:22-bookworm-slim AS node-runtime

FROM node:22-alpine AS web-builder
WORKDIR /build
RUN corepack enable && corepack prepare pnpm@11.22.0 --activate
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/.npmrc ./
RUN pnpm install --frozen-lockfile --config.dangerously-allow-all-builds=true
COPY frontend/ .
ARG NEXT_PUBLIC_API_URL=
ARG NEXT_PUBLIC_SITE_URL=
ARG NEXT_PUBLIC_LIVEKIT_URL=
ARG NEXT_PUBLIC_ENABLE_AGENT_CHAT=true
ARG NEXT_PUBLIC_ENABLE_VOICE_AGENT=true
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_LIVEKIT_URL=$NEXT_PUBLIC_LIVEKIT_URL \
    NEXT_PUBLIC_ENABLE_AGENT_CHAT=$NEXT_PUBLIC_ENABLE_AGENT_CHAT \
    NEXT_PUBLIC_ENABLE_VOICE_AGENT=$NEXT_PUBLIC_ENABLE_VOICE_AGENT \
    NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

FROM debian:bookworm-slim AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl nginx supervisor \
    postgresql postgresql-client postgresql-server-dev-15 \
    build-essential git \
    && git clone --depth 1 --branch v0.8.0 https://github.com/pgvector/pgvector.git /tmp/pgvector \
    && make -C /tmp/pgvector \
    && make -C /tmp/pgvector install \
    && rm -rf /tmp/pgvector \
    && apt-get purge -y --auto-remove build-essential git postgresql-server-dev-15 \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /var/log/supervisor /run/nginx \
    && rm -f /etc/nginx/sites-enabled/default

ENV PYTHONUNBUFFERED=1
ENV PATH=/usr/local/bin:$PATH
ENV PYTHONPATH=/app/backend

COPY --from=node-runtime /usr/local/bin/node /usr/local/bin/node
COPY --from=api-builder /usr/local /usr/local
COPY backend/ /app/backend/
WORKDIR /app/backend

COPY --from=web-builder /build/public /app/frontend/public
COPY --from=web-builder /build/.next/standalone /app/frontend
COPY --from=web-builder /build/.next/static /app/frontend/.next/static

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs nextjs \
    && chown -R nextjs:nodejs /app/frontend

COPY deploy/nginx.conf /etc/nginx/nginx.conf
COPY deploy/supervisord.conf /etc/supervisor/conf.d/salondesk.conf
COPY deploy/entrypoint.sh deploy/api-start.sh /app/deploy/
RUN chmod +x /app/deploy/entrypoint.sh /app/deploy/api-start.sh

ENV PGDATA=/var/lib/postgresql/data
VOLUME ["/var/lib/postgresql/data", "/var/lib/salondesk/storage"]

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=5 \
    CMD curl -f http://127.0.0.1/health || exit 1

ENTRYPOINT ["/app/deploy/entrypoint.sh"]
