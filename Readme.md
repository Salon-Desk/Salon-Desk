# SalonDesk — A Hold, Not a Charge

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)
[![CI Suite](https://img.shields.io/badge/CI%20Suite-235%20passed-success.svg)](.github/workflows/ci.yml)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-paypalai.hackathon.huludelala.com-brightgreen.svg)](https://paypalai.hackathon.huludelala.com)
[![YouTube Demo](https://img.shields.io/badge/YouTube-2%3A42%20Walkthrough-red.svg)](https://youtu.be/to2uynlBQmE)

> **PayPal AI Hackathon Submission**
> AI-powered salon booking concierge + PayPal authorization holds that end salon no-show revenue losses without charging clients upfront.

---

## 1. The Problem

Independent stylists, barbers, and salon owners operate on razor-thin margins. According to industry data (Fresha, 2025), salons lose an average of **7% of their annual revenue** to no-shows and last-minute cancellations, causing a **56% operational schedule disruption**.

Traditional upfront non-refundable deposits create severe conversion friction:
- **Clients hate paying in advance** before setting foot in the salon.
- **Salons face chargebacks and refund disputes** when cancellations occur.
- **Marketplace liability:** Holding client cash in escrow creates custody headaches.

---

## 2. The Solution: "A Hold, Not a Charge"

SalonDesk introduces closed-loop authorization holds powered by **PayPal Orders v2** and **Agentic AI**:

1. **$0 Charged at Booking**: Clients authorize a deposit hold via PayPal Orders v2 (`intent="AUTHORIZE"`). No funds leave their bank account up front.
2. **Deterministic Settlement**:
   - **Client Shows Up (`mark-show`)**: Full service price is captured directly into the salon's PayPal merchant account (`final_capture=True`).
   - **Client No-Shows (`mark-no-show`)**: Only the agreed no-show fee (e.g. $30 on a $120 service) is captured; remaining authorization is immediately voided.
   - **Timely Cancellation**: Cardholder hold is voided with zero fees.
3. **Waitlist Slot Rescue**: If an appointment is cancelled, the Slot Rescue agent automatically offers the open window to waitlisted clients. If refilled, the cancellation fee is waived or refunded.
4. **Autonomous Dispute Counsel**: When a client files a dispute, a 3-agent pipeline compiles an **Ed25519-signed, SHA-256 hash-chained PDF evidence dossier** and submits formal defense directly to PayPal's Resolution Center.

---

## 3. Try It in 60 Seconds (Judge Quick Start)

Hosted Prototype URL: **[https://paypalai.hackathon.huludelala.com](https://paypalai.hackathon.huludelala.com)**

### Demo Logins (All share password: `Password123!`)

| Role | Email | Purpose / View |
|---|---|---|
| **Platform Admin** | `admin@salondesk.local` | Platform overview, commission tracking, organization taxonomy |
| **Salon Owner** | `owner@selam.local` | **Selam Hair Studio** merchant console, calendar, appointment settlement, dispute drawer |
| **Receptionist** | `reception@selam.local` | Front-desk check-in and scheduling |
| **Stylist** | `stylist1@selam.local` | Stylist schedule and assigned bookings (Selam Haile) |
| **Client** | `abebe07@personal.example.com` | Client app: AI booking chat, service exploration, booking history |

### PayPal Sandbox Buyer Login (Use in PayPal checkout popups)

- **Buyer Email:** `abebe07@personal.example.com`
- **Buyer Password:** `,S7W{C-b`
- **Secondary Buyer:** `ailurophile99@personal.example.com` / `RKd4)RGo`

> [!TIP]
> **One-Click Reset**: Click the **Reset Demo** button in the top navigation bar, or send `POST https://paypalai.hackathon.huludelala.com/api/demo/reset` at any time to return the database to a pristine demo state.

---

## 4. How We Use PayPal

SalonDesk goes far beyond simple checkout buttons. We implement the complete lifecycle of PayPal Orders v2, Payments v2, Webhooks, and Disputes v1:

| Capability | PayPal API & Method | Repository File | Implementation Details |
|---|---|---|---|
| **Deposit Authorization** | `POST /v2/checkout/orders` (`intent: AUTHORIZE`) | [`backend/app/services/paypal_rest.py`](backend/app/services/paypal_rest.py) | Places an authorization hold with payee merchant ID, brand context, and `NO_SHIPPING`. Zero upfront charge. |
| **Partial & Full Capture** | `POST /v2/payments/authorizations/{id}/capture` | [`backend/app/services/capture_service.py`](backend/app/services/capture_service.py) | Executes `final_capture: true` to capture service price or policy-agreed no-show fee and release remaining hold. |
| **Hold Reauthorization** | `POST /v2/payments/authorizations/{id}/reauthorize` | [`backend/app/tasks/hold_expiration.py`](backend/app/tasks/hold_expiration.py) | Scheduled task monitors the 3-day PayPal honor window and renews active holds before expiration. |
| **Hold Void** | `POST /v2/payments/authorizations/{id}/void` | [`backend/app/services/booking_service.py`](backend/app/services/booking_service.py) | Instantly voids holds upon free cancellation or slot rescue waiver. |
| **Idempotency Defense** | `PayPal-Request-Id` | [`backend/app/services/paypal_helpers.py`](backend/app/services/paypal_helpers.py) | Unique hash per state transition prevents duplicate authorizations or accidental double-captures. |
| **Webhook Verification** | `POST /v1/notifications/verify-webhook-signature` | [`backend/app/services/paypal_webhooks.py`](backend/app/services/paypal_webhooks.py) | Validates asymmetric PayPal signatures with transmission IDs and cert URLs before processing lifecycle events. |
| **Dispute Defense Evidence** | `POST /v1/customer/disputes/{id}/provide-evidence` | [`backend/app/services/dispute_service.py`](backend/app/services/dispute_service.py) | Formally transmits the generated legal rebuttal and cryptographic dossier to the PayPal Resolution Center. |
| **Agent Commerce Toolkit** | Orders v2 & Payments v2 Runner | [`backend/app/services/paypal_toolkit.py`](backend/app/services/paypal_toolkit.py) | Agent tooling interface with amount ceiling bounds ($0.50–$250) and prohibited autonomous action firewalls. |

---

## 5. Tools Disclosure (AI Architecture)

In accordance with Hackathon Official Rules §4, below is the complete disclosure of AI models and tools utilized:

| AI Surface | Technology / Model | Repository Location | Role & Implementation |
|---|---|---|---|
| **Multi-Provider LLM** | Groq (`openai/gpt-oss-120b`), OpenAI (`gpt-4.1-mini`), or Ollama (`llama3.2`) | [`backend/app/ai/llm/`](backend/app/ai/llm/) | Pluggable LLM interface powering chat responses, function call arguments, and legal text generation. |
| **Semantic RAG Engine** | `sentence-transformers/all-minilm` + PostgreSQL `pgvector` | [`backend/app/ai/rag/`](backend/app/ai/rag/) | Entity-linked vector embeddings matching user styling desires with catalog services, stylists, and policies. |
| **Realtime Voice Concierge** | LiveKit RTC + Deepgram STT + LLM Worker | [`backend/agent.py`](backend/agent.py) | Full-duplex voice concierge allowing clients to verbally discover salons, check stylist openings, and book. |
| **Dispute Counsel: Investigator** | Deterministic Cryptographic Verifier | [`backend/app/services/dispute_service.py`](backend/app/services/dispute_service.py) | Verifies Ed25519 digital client signatures and unbroken SHA-256 financial audit chains before defense generation. |
| **Dispute Counsel: Advocate** | LLM Dispute Attorney | [`backend/app/services/dispute_service.py`](backend/app/services/dispute_service.py) | Drafts a 5-part formal legal rebuttal matching PayPal Resolution Center formatting constraints without Markdown tables. |
| **Dispute Counsel: Skeptic** | LLM Risk Analyst + Deterministic Proof Clamping | [`backend/app/services/dispute_service.py`](backend/app/services/dispute_service.py) | Critically evaluates evidence gaps, scores win probability (clamped to 88-96% on verified crypto proofs), and advises strategy. |
| **Court-Ready PDF Dossier** | Native PDF-1.4 Generator | [`backend/app/services/pdf_evidence_generator.py`](backend/app/services/pdf_evidence_generator.py) | Assembles cryptographic checksums, verified chat transcripts, and timeline exhibits into a court-ready evidence file. |
| **Owner Copilot** | LLM Operations Copilot | [`backend/app/ai/tools/`](backend/app/ai/tools/) | Salon management copilot assisting owners with schedule adjustments, commission summaries, and policy edits. |

---

## 6. Safety: "AI Proposes; Code and PayPal Decide"

SalonDesk strictly adheres to defensive fintech design principles:

- **Prohibited Autonomous Tools (`BLOCKED_AGENT_TOOLS`)**: The AI agent is explicitly prevented from executing `accept_dispute_claim`. Dispute concessions require human staff authorization.
- **Deposit & Capture Ceilings**:
  - Deposit ceiling: Deposits are capped at 50% of total service price (`MAX_DEPOSIT_FRACTION = 0.50`).
  - Capture ceiling: A merchant cannot capture more than the agreed no-show fee locked at booking creation.
- **Booking-Time Immutability**: Cancellation deadlines, fee percentages, and commission rates are snapshotted in JSON at agreement time; subsequent salon policy edits never retroactively alter existing bookings.
- **Ed25519 Cryptographic Consent**: Client agreement to the no-show fee policy is digitally signed using an Ed25519 keypair and verified mathematically.
- **SHA-256 Ledger Chaining**: Every state event (`AUTHORIZATION_CREATED`, `CAPTURE_COMPLETED`) appends a hash-chained block referencing the prior block hash, guaranteeing tamper-proof records.

---

## 7. What We Built During the Hackathon

- **Initial Commit:** October 14, 2026 (after the Hackathon start date of October 1, 2026).
- **100% of the codebase**—FastAPI backend, Next.js frontend, PayPal integrations, pgvector RAG, LiveKit voice worker, and automated dispute counsel—was authored during the hackathon period.
- **Automated Test Suite:** **235 passing tests** across API, domain services, crypto verification, and PayPal lifecycle integrations.

---

## 8. Local Development & Testing

### Prerequisites
- Node.js 20+ and `pnpm`
- Python 3.11+ and `uv`
- Docker (for PostgreSQL with `pgvector`)

### 1. Start Database & Dependencies
```bash
cp .env.example .env
docker compose up -d db
```

### 2. Install & Seed
```bash
# Backend setup
cd backend
uv sync --group dev
uv run python -m scripts.seed --clear

# Frontend setup
cd ../frontend
pnpm install
```

### 3. Run Development Servers
```bash
# Terminal 1: Backend API (port 8000)
cd backend && uv run fastapi dev app/main.py

# Terminal 2: Next.js Frontend (port 3000)
cd frontend && pnpm dev

# Terminal 3 (Optional): LiveKit Voice Agent
cd backend && uv run python agent.py start
```

### 4. Run Test Suite
```bash
# Backend pytest suite (235 tests)
cd backend && uv run pytest -v

# Code quality checks
cd backend && uv run ruff check . && uv run ruff format --check .
cd ../frontend && pnpm typecheck && pnpm lint
```

---

## 9. Project Structure

```
Salon-Desk/
├── backend/
│   ├── app/
│   │   ├── ai/            # RAG, LLM providers, LiveKit voice agent, agent tools
│   │   ├── api/v1/        # Endpoints: auth, catalog, bookings, orgs, settlements, disputes
│   │   ├── core/          # Database, crypto (Ed25519), config, security firewalls
│   │   ├── models/        # SQLAlchemy ORM models (ledger, policy, bookings, disputes)
│   │   ├── schemas/       # Pydantic v2 validation schemas
│   │   ├── services/      # PayPal REST, capture, dispute counsel, slot rescue, ledger
│   │   └── tasks/         # Celery/background tasks (hold expiration, sync)
│   ├── scripts/           # Seeding, pgvector ingestion
│   └── tests/             # 235 unit and integration tests
├── frontend/
│   ├── app/               # Next.js 16 App Router (Client, Merchant, Admin portals)
│   ├── components/        # UI components, dispute drawer, chat widget, sandbox modal
│   ├── lib/               # Mappers, constants, sandbox personas
│   └── store/             # Redux Toolkit & RTK Query API client slices
├── docs/                  # Architecture specs, dispute lifecycle guides, permissions matrix
├── .github/workflows/     # GitHub Actions CI suite
└── docker-compose.yml     # Container orchestration
```

---

## 10. Team & License

Built with care for the PayPal AI Hackathon by the **SalonDesk Team**.
Licensed under the [Apache License 2.0](LICENSE).
