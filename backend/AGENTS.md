# SalonDesk backend — agent guide

FastAPI backend for the SalonDesk multi-tenant booking platform. It owns authentication, catalog and booking flows, PayPal authorization holds and settlement, platform and merchant APIs, AI/RAG, the LiveKit voice worker, background jobs, and demo data.

Repository-wide rules: **[../AGENTS.md](../AGENTS.md)**. Human setup and environment details: **[../Readme.md](../Readme.md)**.

**English-only.** Do not add translation layers, locale providers, multilingual prompt variants, or `_localization/` folders.

## Commands

Run backend commands from `backend/` unless stated otherwise.

| Command | Purpose |
| --- | --- |
| `uv sync --group dev` | Install runtime and development dependencies |
| `uv run fastapi dev app/main.py` | Start the API on the FastAPI development server |
| `uv run python agent.py start` | Start the separate LiveKit voice worker |
| `uv run pytest` | Run the complete backend test suite |
| `uv run pytest tests/services/test_policy_engine.py -q` | Run a focused test module |
| `uv run ruff check .` | Run backend lint checks |
| `uv run ruff format --check .` | Check backend formatting |
| `uv run ruff check --fix . && uv run ruff format .` | Fix lint and formatting issues |
| `uv run alembic upgrade head` | Apply database migrations |

From the repository root, `make seed`, `make seed-clear`, `make ingest-knowledge`, `make voice-agent`, and `make validate` provide the standard workflows. `make seed-clear` is destructive and must only be used when a fresh demo database is intended.

## Architecture

```text
agent.py                       Thin LiveKit CLI -> app.ai.agent.worker
app/
  main.py                      App factory, middleware, exception handlers, routers
  api/
    deps/                      Typed FastAPI dependencies for DB, auth, and permissions
    v1/
      api.py                   Master /api/v1 router
      shared/                  Auth, profile, health, storage
      platform/                Platform admin endpoints under /admin
      org/                     Merchant endpoints under /organizations, /settlements, /disputes
      client/                  Catalog, bookings, payments, chat, LiveKit, AI
      webhooks/                PayPal callbacks
      demo.py                  Non-production demo reset
  ai/                          Chat orchestration, RAG, LLM providers, agent, tools
  core/                        Settings, DB, security, exceptions, response helpers
  models/                      SQLAlchemy models and enums
  schemas/                     Pydantic request/response schemas
  services/                    Domain workflows and external integrations
  tasks/                       Hold-expiration and booking-reminder loops
scripts/                       Seed, knowledge ingestion, Postman, and sandbox utilities
alembic/versions/              Ordered PostgreSQL migrations
tests/
  api/                         Schema and HTTP-contract tests
  services/                    Domain unit tests
  integrations/               PayPal, webhook, and idempotency flows
```

## API boundaries

- Mount API routes through `app/api/v1/api.py`; do not register feature routers directly in `app/main.py`.
- Keep existing client-visible paths stable. All feature routes are under `/api/v1`, except `/health` and the legacy `POST /api/demo/reset` alias.
- Put shared routes in `shared/`, platform routes in `platform/`, merchant routes in `org/`, client routes in `client/`, and callbacks in `webhooks/`.
- Use dependencies from `app.api.deps`: `DbSession`, `CurrentUser`, `OptionalUser`, `ClientUser`, `OrgMember`, `OrgOwner`, `PlatformAdmin`, and `PlatformAdminOnly`. Do not duplicate token parsing or role checks in endpoints.
- Endpoints should validate transport concerns, call a service, map domain failures to appropriate HTTP statuses, and return a typed schema. Keep business rules out of routers.
- Declare `response_model` and precise status codes. Use `PageOut[T]` for paginated responses and the established `page`/`page_size` query names unless an existing endpoint contract requires otherwise.
- JSON responses are wrapped by the standard middleware in `app/main.py`. Return domain data, not a second custom success envelope.

## Domain and service rules

- Put reusable workflows in `app/services/`; keep pure policy calculations and transition checks deterministic and independently testable.
- **Payment Facade:** `app/services/payment_service.py` serves as the canonical domain facade coordinating booking holds, full/fee captures, voids, reauthorizations, and refund workflows across `booking_service`, `paypal_rest`, and audit ledger splits. Routers and background tasks should invoke operations via this facade rather than orchestrating raw PayPal primitives directly.
- Use domain exceptions from `app/core/exceptions.py` for service-layer failures. Routers translate them when endpoint-specific status mapping is needed.
- Use async SQLAlchemy APIs only: `AsyncSession`, `select`, `await db.execute`, `await db.flush`, and explicit eager loading such as `selectinload`.
- Request-scoped sessions commit or roll back in `get_db`. Services normally flush and return; commit inside a service only when the established workflow requires an independent transaction boundary.
- Scope every merchant read and mutation by `org_id`. Never trust organization or user identifiers from request bodies without checking the authenticated actor.
- Use timezone-aware datetimes and `datetime.now(UTC)`. Preserve `Decimal` for money; do not introduce float arithmetic.
- Preserve idempotency for PayPal calls, captures, refunds, webhook processing, and ledger writes.

## Booking and payment invariants

These rules are part of the product contract and must remain enforced in services and tests:

- Booking authorizes a PayPal hold; it does not charge the client at booking time.
- A completed service captures the full allowed amount. A no-show or late cancellation captures only the frozen agreed fee. A free cancellation voids the hold.
- **Refilled Chair Guarantee (Sole Intentional Refund Path):** When a late cancellation or no-show fee is captured, but AI Slot Rescue (`SlotRescueService`) successfully refills the appointment from the waitlist, SalonDesk refunds the captured fee to the original client via PayPal. General customer refunding outside of slot rescue is intentionally prohibited.
- Policy terms, commissions, agreed fees, and cancellation deadlines are snapshotted at booking creation. Later configuration changes must not alter existing bookings.
- State transitions must pass the policy engine. Capture amounts cannot exceed the remaining authorization or the applicable agreed fee.
- Financial and consent events must continue through the audit ledger and its integrity checks.
- Funds settle directly to the salon's PayPal merchant account; platform commission is recorded separately in the commission ledger.

When changing booking, settlement, capture, cancellation, dispute, waitlist, or webhook code, add or update tests for the happy path, forbidden transition, monetary ceiling, authorization scope, and idempotent replay.

## Models, schemas, and migrations

- SQLAlchemy models inherit from `BaseModel` or `TimestampedModel` in `app/models/base.py` and use typed `Mapped[...]` columns.
- Add new model and enum exports to `app/models/__init__.py` so Alembic metadata and imports register them.
- Keep API schemas in `app/schemas/`. Response schemas backed by ORM objects should inherit `ORMModel` or enable `from_attributes`.
- Never expose secrets, password hashes, PayPal credentials, internal signatures, or unrestricted ORM objects in responses.
- Every persistent schema change requires an Alembic migration in `alembic/versions/`. Give it the correct `down_revision` and a reversible `downgrade` whenever practical.
- PostgreSQL with pgvector is the supported database. Do not design migrations around SQLite-only behavior.

## AI, RAG, and voice

- LLM implementations live in `app/ai/llm/`. Select providers through `LLM_PROVIDER` and `Settings`; do not instantiate a provider directly in endpoint code.
- Compatibility modules under `app/services/llm/` may re-export older imports, but new code should use `app.ai.llm`.
- Text chat and the LiveKit worker share RAG and booking tools. Keep authorization and portal scope intact when reusing tools.
- Client AI may assist with discovery and booking. Merchant/admin chat is system assistance and must not expose client-only booking actions.
- Treat retrieved text and model output as untrusted. Deterministic services and policy checks remain authoritative for bookings and money movement.
- The voice worker is a separate process. API startup must not embed or launch it.

## Configuration and external services

- Add settings to `app/core/config.py` using `pydantic-settings`; secrets come from environment variables, never source control.
- The backend reads `backend/.env` and the repository root `.env`. Frontend-safe values use `NEXT_PUBLIC_*` and belong to the frontend configuration.
- Tests must not call live PayPal, LLM, LiveKit, SMTP, S3/RustFS, Redis, or embedding services. Stub or monkeypatch external boundaries.
- `tests/conftest.py` deliberately clears PayPal credentials for the test suite. Do not bypass that safeguard.
- Keep non-production defaults on PayPal sandbox endpoints. Never silently switch development or tests to production services.

## Tests and completion gate

- Mirror source structure when adding tests: API contracts in `tests/api/`, business rules in `tests/services/`, and multi-boundary flows in `tests/integrations/`.
- Add regression tests with every bug fix and focused tests with every new state transition or financial rule.
- Prefer deterministic fixtures and explicit timestamps. Do not make tests depend on execution order, network availability, or the current wall clock.
- Before considering backend work complete, run the narrowest relevant tests, then:

```bash
uv run ruff check .
uv run ruff format --check .
uv run pytest
```

If the full database or an external service is unavailable, still run all unaffected checks and report exactly what could not be verified.
