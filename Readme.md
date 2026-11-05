# SalonDesk — A Hold, Not a Charge

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)
[![CI Suite](https://img.shields.io/badge/CI%20Suite-235%20passed-success.svg)](.github/workflows/ci.yml)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-salon--desk.onrender.com-brightgreen.svg)](https://salon-desk.onrender.com/client)
[![YouTube Demo](https://img.shields.io/badge/YouTube-2%3A42%20Walkthrough-red.svg)](https://youtu.be/to2uynlBQmE)

> **PayPal AI Hackathon Submission**  
> AI booking concierge + PayPal authorization holds that end salon no-show revenue losses without charging clients upfront.

---

## 1. The Problem & The Solution

Independent stylists and barbers lose an average of **7% of their annual revenue** to no-shows and late cancellations (Fresha, 2025), creating a **56% operational schedule disruption**. Traditional upfront deposits create high buyer friction, lost bookings, and chargeback risks.

**SalonDesk solves this with "A Hold, Not a Charge":**

```
1. AI Booking & Hold      2. Service Completion        3. No-Show Settlement         4. Dispute Defense
┌──────────────────┐      ┌────────────────────┐       ┌────────────────────┐        ┌──────────────────┐
│ Client books via │      │ Client shows up:   │       │ Client no-shows:   │        │ If disputed:     │
│ Voice/Chat AI.   │ ───► │ Full price is      │  OR   │ Only agreed fee    │  ───►  │ 3-agent counsel  │
│ $0 debited; hold │      │ captured via       │       │ ($30) is captured; │        │ files signed PDF │
│ via Orders v2.   │      │ final_capture=true │       │ balance voided.    │        │ dossier to PayPal│
└──────────────────┘      └────────────────────┘       └────────────────────┘        └──────────────────┘
```

- **Zero Dollars Charged at Booking:** Clients authorize an authorization hold via PayPal Orders v2 (`intent="AUTHORIZE"`). No upfront payment is debited from their account.
- **Fair Settlement:** If the client attends, the full service price is captured directly to the salon's merchant account (`final_capture=True`). If they no-show, only the policy-agreed fee (e.g. $30 on a $120 service) is captured; any remaining authorization is automatically voided.
- **Waitlist Slot Rescue:** If an appointment is cancelled, the Slot Rescue engine refills the vacancy from the waitlist and waives or refunds the fee.
- **Autonomous Dispute Counsel:** If a dispute is filed on PayPal, a 3-agent pipeline compiles an **Ed25519-signed, SHA-256 hash-chained PDF evidence dossier** and transmits formal defense directly to PayPal's Resolution Center.
- **Measurable Economic Impact:** A stylist recovering just 4 no-shows a month at $30 saves **$1,440 per year**, all while giving clients a zero-friction, $0-down booking experience.

---

## 2. Try It in 60 Seconds (Judge Quick Start)

Hosted Prototype URL: **[https://salon-desk.onrender.com/client](https://salon-desk.onrender.com/client)**  
*(Also accessible from root portal hub: [https://salon-desk.onrender.com](https://salon-desk.onrender.com))*

### Demo Accounts (Shared Password: `Password123!`)

| Portal / Role | Email | Experience |
|---|---|---|
| **Salon Owner** | `owner@selam.local` | **Selam Hair Studio** merchant console: live calendar, appointment settlements, dispute drawer |
| **Stylist** | `stylist1@selam.local` | Stylist schedule view and assigned bookings (Selam Haile) |
| **Receptionist** | `reception@selam.local` | Front-desk scheduling and check-in desk |
| **Client** | `abebe07@personal.example.com` | Client app: AI voice/chat booking, salon discovery, booking history |
| **Platform Admin** | `admin@salondesk.local` | Platform console: commission ledger, salon taxonomy, approvals |

### PayPal Sandbox Buyer Login (For PayPal Checkout Popups)

- **Buyer Email:** `abebe07@personal.example.com`
- **Buyer Password:** `,S7W{C-b`
- **Secondary Buyer:** `ailurophile99@personal.example.com` / `RKd4)RGo`

> [!TIP]
> **One-Click Sandbox Reset:** Click the **Reset Demo** button in the header toolbar, or send `POST https://salon-desk.onrender.com/api/demo/reset` to restore a clean demo state at any time. Enable browser pop-ups for PayPal Sandbox authorization windows.

---

## 3. How We Use PayPal

SalonDesk implements the complete lifecycle of PayPal Orders v2, Payments v2, Webhooks, and Disputes v1:

| Capability | PayPal API & Method | Repository File | What It Does |
|---|---|---|---|
| **Deposit Authorization** | `POST /v2/checkout/orders` (`intent: AUTHORIZE`) | [`backend/app/services/paypal_rest.py`](backend/app/services/paypal_rest.py) | Places an authorization hold with payee merchant ID, brand context, and `NO_SHIPPING`. Zero upfront charge. |
| **Partial & Full Capture** | `POST /v2/payments/authorizations/{id}/capture` | [`backend/app/services/capture_service.py`](backend/app/services/capture_service.py) | Executes `final_capture: true` to capture service price or policy-agreed fee and release remaining hold. |
| **Hold Reauthorization** | `POST /v2/payments/authorizations/{id}/reauthorize` | [`backend/app/tasks/hold_expiration.py`](backend/app/tasks/hold_expiration.py) | Monitors the 3-day PayPal honor window and renews active holds before expiration. |
| **Hold Void** | `POST /v2/payments/authorizations/{id}/void` | [`backend/app/services/booking_service.py`](backend/app/services/booking_service.py) | Instantly voids holds upon free cancellation or slot rescue waiver. |
| **Idempotency Defense** | `PayPal-Request-Id` | [`backend/app/services/paypal_helpers.py`](backend/app/services/paypal_helpers.py) | Unique hash per state transition prevents duplicate authorizations or accidental double-captures. |
| **Webhook Verification** | `POST /v1/notifications/verify-webhook-signature` | [`backend/app/services/paypal_webhooks.py`](backend/app/services/paypal_webhooks.py) | Validates asymmetric PayPal signatures with transmission IDs and cert URLs before processing lifecycle events. |
| **Dispute Defense Evidence** | `POST /v1/customer/disputes/{id}/provide-evidence` | [`backend/app/services/dispute_service.py`](backend/app/services/dispute_service.py) | Formally transmits the generated legal rebuttal and cryptographic dossier to the PayPal Resolution Center. |
| **Agent Commerce Toolkit** | Custom Orders v2 & Payments v2 Runner | [`backend/app/services/paypal_toolkit.py`](backend/app/services/paypal_toolkit.py) | Agent tooling interface with amount ceiling bounds ($0.50–$250) and prohibited autonomous action firewalls. |

---

## 4. Tools Disclosure (AI Architecture)

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

## 5. Safety: "AI Proposes; Code and PayPal Decide"

SalonDesk strictly adheres to defensive fintech design principles:

- **Prohibited Autonomous Tools (`BLOCKED_AGENT_TOOLS`)**: The AI agent is explicitly prevented from executing `accept_dispute_claim`. Dispute concessions require human staff authorization.
- **Direct Merchant Settlement (Non-Custodial)**: Client funds flow directly into the salon’s PayPal merchant account (`payee.merchant_id`), preventing marketplace escrow liability.
- **Deposit & Capture Ceilings**:
  - Deposit ceiling: Deposits are capped at 50% of total service price (`MAX_DEPOSIT_FRACTION = 0.50`).
  - Capture ceiling: A merchant cannot capture more than the agreed no-show fee locked at booking creation.
- **Booking-Time Immutability**: Cancellation deadlines, fee percentages, and commission rates are snapshotted in JSON at agreement time; subsequent salon policy edits never retroactively alter existing bookings.
- **Ed25519 Cryptographic Consent**: Client agreement to the no-show fee policy is digitally signed using an Ed25519 keypair and verified mathematically.
- **SHA-256 Ledger Chaining**: Every state event (`AUTHORIZATION_CREATED`, `CAPTURE_COMPLETED`) appends a hash-chained block referencing the prior block hash, guaranteeing tamper-proof records.

---

## 6. What We Built During the Hackathon

- **Initial Commit:** October 14, 2026 (after the Hackathon start date of October 1, 2026).
- **100% Original Hackathon Code:** FastAPI backend, Next.js frontend, PayPal integrations, pgvector RAG, LiveKit voice worker, and automated dispute counsel were authored during the hackathon period.
- **Automated Test Suite:** **235 passing tests** across API, domain services, crypto verification, and PayPal lifecycle integrations.

---

## 7. Fast Local Run (3 Commands)

If you have Docker installed, start the local environment:

```bash
# 1. Environment & Database
cp .env.example .env
docker compose up -d db
make seed

# 2. Start Servers
cd backend && uv run fastapi dev app/main.py   # Terminal 1: Backend API (http://127.0.0.1:8000)
cd frontend && pnpm dev                         # Terminal 2: Next.js Frontend (http://localhost:3000)
```

> For step-by-step installation without Docker, native PostgreSQL configuration, environment variable options, test runner commands, and VPS deployment, see the [**Local Development & Setup Guide**](docs/LOCAL_SETUP.md).

---

## 8. Deep-Dive Documentation

For detailed architectural specifications, lifecycle guides, and development documentation:

| Document | Focus & Highlights |
|---|---|
| 🛠️ [**Local Development & Setup Guide**](docs/LOCAL_SETUP.md) | Full setup with/without Docker, environment variables, seeding CLI, 235-test pytest runner, VPS deployment, and Make targets. |
| ⚖️ [**Dispute Flow & Lifecycle Guide**](docs/DISPUTE_FLOW.md) | End-to-end PayPal Disputes v1 defense walkthrough, 3-role agent counsel, and court-ready PDF dossier. |
| 🎙️ [**Voice Concierge & Semantic RAG**](docs/VOICE_AGENT_RAG.md) | LiveKit RTC + Deepgram voice worker architecture, Ollama `all-minilm` embeddings, and pgvector ingestion. |
| 📡 [**API Catalog & Integrations**](docs/API_AND_INTEGRATIONS.md) | REST endpoint catalog, Postman collection (`postman/collection.json`), and PayPal webhook simulation. |
| 🔐 [**Permissions & Access Control Matrix**](docs/PERMISSIONS_MAPPER.md) | Role-based permission guardrails across Client, Merchant, and Admin portals. |

---

## 9. Team & License

Built with care for the PayPal AI Hackathon by the **SalonDesk Team**.  
Licensed under the [Apache License 2.0](LICENSE).
