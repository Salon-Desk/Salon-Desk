# Devpost Submission Package: SalonDesk

---

## 1. Submission Overview & Metadata

- **Project Title:** SalonDesk — A Hold, Not a Charge
- **Tagline:** Ending salon no-show revenue losses with agentic booking, $0 upfront PayPal deposit holds, and autonomous cryptographic dispute defense.
- **Repository URL:** `https://github.com/Huludelala/Salon-Desk`
- **Hosted Live Demo:** `https://paypalai.hackathon.huludelala.com`
- **Video Walkthrough (YouTube):** `https://youtu.be/to2uynlBQmE` (2 minutes 42 seconds)
- **Target Tracks:**
  1. **Best Use of PayPal + AI** ($5,000)
  2. **Best Use of Agentic Commerce** ($5,000)
  3. **Sponsor Prize: AG Grid** ($5,000 / $2,000 / $1,000)
  4. **Grand Prizes** ($12,000 / $8,000 / $5,000)

---

## 2. Devpost Submission Q&A

### Inspiration
Independent hair stylists, barbers, and salon owners operate on razor-thin margins. In our home city of Addis Ababa and across global metro areas, salon owners repeatedly told us the exact same painful story:
> *"When a client doesn't show up for a 3-hour braiding appointment, my chair sits empty and I can't recover that rent. Upfront non-refundable charges scare clients away, but zero accountability hurts honest stylists."* — Selam Haile, Salon Owner

Industry research (Fresha, 2025) confirms that salons lose **7% of annual revenue** to no-shows and last-minute cancellations, causing a **56% operational schedule disruption**. Yet traditional upfront non-refundable deposits create severe conversion friction: clients hate paying before receiving service, chargebacks spike, and marketplace platforms face escrow liability.

We asked: **What if clients never pay upfront, but stylists never lose their chair rent?**
With **PayPal Orders v2 Authorization Holds** and **Agentic AI**, we turned that vision into reality: **"A hold, not a charge."**

---

### What It Does

SalonDesk is an agentic salon booking and no-show protection platform:

1. **$0 Charged at Booking**: Clients explore services and book through a full-duplex conversational voice agent (LiveKit) or semantic RAG chat. During checkout, clients authorize a deposit hold via **in-page PayPal Smart Buttons** (`intent: AUTHORIZE`). No money leaves their bank account upfront.
2. **Deterministic Settlement ("Code & PayPal Decide")**:
   - **Client Shows Up (`mark-show`)**: Full service price is captured directly to the salon's PayPal merchant account (`final_capture=True`).
   - **Client No-Shows (`mark-no-show`)**: Only the agreed no-show fee (e.g. $30.00 on a $120.00 service) is captured; the remaining authorization is instantly voided.
   - **Timely Cancellation**: The hold is immediately voided with zero fees.
3. **Waitlist Slot Rescue**: If an appointment is cancelled, an autonomous background agent detects the gap and contacts waitlisted clients. If the slot is rescued, the cancellation fee is waived or refunded automatically.
4. **3-Agent Autonomous Dispute Counsel**: When a client files a dispute on a captured no-show fee, a coordinated 3-agent pipeline generates an Ed25519-signed, SHA-256 hash-chained PDF evidence dossier and submits a formal legal defense to the PayPal Resolution Center:
   - **Investigator**: Mathematically verifies digital signatures and audit ledger block integrity.
   - **Advocate**: Drafts a 5-point formal PayPal rebuttal adhering to Resolution Center character limits.
   - **Skeptic**: Stress-tests evidence vulnerabilities and bounds win probability (88–96%).
5. **High-Density AG Grid Dashboards**: Salon owners and platform admins inspect live appointments, hold statuses, and cryptographically verified financial audit ledgers with **AG Grid Community v36** interactive tables.

---

### How We Built It

- **Full-Stack Architecture:**
  - **Backend:** FastAPI, Python 3.11+, SQLAlchemy 2.0 (async), PostgreSQL 16 with `pgvector` for vector embeddings, and Pytest (239 unit & integration tests).
  - **Frontend:** Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS v4, Redux Toolkit, and **AG Grid Community v36** (`ag-grid-react`).
- **PayPal Integration Suite:**
  - **PayPal JS SDK v6 (`@paypal/react-paypal-js`)**: Client-side interactive Smart Buttons with `intent: 'authorize'`, `createOrder`, and `onApprove` hold lock.
  - **PayPal Orders v2 (`POST /v2/checkout/orders`)**: Server-side authorization creation with merchant payee routing, brand context, and `NO_SHIPPING`.
  - **PayPal Payments v2 Authorizations**: Capture (`final_capture: true`), Reauthorization (`POST /v2/payments/authorizations/{id}/reauthorize`), and Void (`POST /v2/payments/authorizations/{id}/void`).
  - **PayPal Webhooks (`POST /v1/notifications/verify-webhook-signature`)**: Asymmetric RSA signature validation of incoming event payloads (`PAYMENT.AUTHORIZATION.CREATED`, `PAYMENT.CAPTURE.COMPLETED`).
  - **PayPal Disputes v1 (`POST /v1/customer/disputes/{id}/provide-evidence`)**: Formal transmission of rebuttal statements and court-ready PDF dossiers.
  - **PayPal MCP & Agentic Commerce Toolkit**: Structured agent tools (`PAYPAL_MCP_TOOL_SCHEMAS`) enforcing strict amount ceilings ($0.50–$250) and prohibited autonomous action firewalls.
- **AI & Agentic Commerce:**
  - **Multi-Provider LLM Service**: Pluggable support for Groq (`openai/gpt-oss-120b`), OpenAI (`gpt-4.1-mini`), and Ollama (`llama3.2`).
  - **Semantic RAG Engine**: `sentence-transformers/all-minilm` + PostgreSQL `pgvector` for stylist matching and cancellation policy semantics.
  - **Realtime Voice Concierge**: LiveKit RTC + Deepgram STT + LLM worker.
- **Cryptographic Security:**
  - **Ed25519 Digital Signatures**: Every client consent to the no-show fee policy is digitally signed and mathematically verified.
  - **SHA-256 Hash Chaining**: Every financial transition creates a tamper-proof block referencing the previous block's SHA-256 hash.

---

### Challenges We Ran Into

1. **PayPal Authorization Lifecycle Nuances**: Managing PayPal's 3-day honor window required building an automated reauthorization worker (`hold_expiration.py`) that monitors pending holds and reauthorizes them before expiration.
2. **Fintech Agent Safety ("AI Proposes; Code & PayPal Decide")**: Language models can be sycophantic. To prevent an AI agent from unilaterally waiving disputes or draining merchant balances, we engineered a hard-coded security firewall: `BLOCKED_AGENT_TOOLS = {"accept_dispute_claim"}` and strict deposit fraction ceilings (`MAX_DEPOSIT_FRACTION = 0.50`).
3. **Cryptographic Proof Chain in High-Speed UI**: Rendering real-time SHA-256 cryptographic proof verifications inside AG Grid without frame drops required designing custom React cell renderers with memoized hash verification badges.

---

### Accomplishments That We're Proud Of

- **239 Passing Automated Tests:** 100% clean test suite covering API endpoints, services, crypto verification, and PayPal lifecycle mocks.
- **1-Click Judge Mode Experience:** Built-in floating toolbar with 1-click persona switching (Client, Salon Owner, Admin, Copy Sandbox Buyer, Reset Demo) that allows judges to evaluate all roles in under 60 seconds without typing passwords.
- **AG Grid Integration:** Enterprise-grade appointment management and tamper-proof financial ledger tables with instant search filtering and custom verification badges.
- **Zero Hallucination Dispute Dossier:** Generated court-ready PDF evidence packages that cite exact cryptographic timestamps, digital signatures, and PayPal authorization IDs.

---

### What We Learned

- How to deeply leverage the full lifecycle of PayPal's Orders, Payments, Webhooks, and Disputes APIs for two-sided marketplace dynamics.
- How to implement agentic commerce responsibly by sandwiching non-deterministic LLM reasoning between deterministic cryptographic signatures and strict payment amount ceilings.
- How AG Grid's modular architecture dramatically elevates fintech data density and user experience.

---

### What's Next for SalonDesk

- **Multi-Currency Global Expansion:** Expanding beyond USD sandbox to local currencies (ETB, EUR, GBP) using PayPal Multi-Currency payouts.
- **Direct WhatsApp / SMS Agent:** Deploying the booking concierge over WhatsApp Business API with hosted PayPal authorization links.
- **Automated Dispute Resolution API Integration:** Live bi-directional syncing with PayPal Dispute Webhooks (`CUSTOMER.DISPUTE.CREATED`, `CUSTOMER.DISPUTE.RESOLVED`).

---

## 3. Official AI & Tools Disclosure (§4 Rules Compliance)

| Tool / Technology | Version / Model | License / Source | Hackathon Role |
|---|---|---|---|
| **PayPal JS SDK v6** | `@paypal/react-paypal-js` v10.6.1 | Apache-2.0 | In-page interactive Smart Buttons for authorization holds |
| **PayPal REST APIs** | Orders v2, Payments v2, Webhooks v1, Disputes v1 | Official PayPal API | Server-side authorization, capture, reauthorization, void, webhook validation |
| **AG Grid Community** | `ag-grid-community` / `ag-grid-react` v36.3.0 | MIT | Interactive data grids for merchant appointments and financial ledger |
| **FastAPI** | 0.115+ | MIT | Asynchronous backend API and business logic |
| **Next.js** | 16.0 (App Router) | MIT | Server-side rendered frontend and interactive portals |
| **PostgreSQL + pgvector** | PostgreSQL 16 + pgvector 0.7+ | PostgreSQL License | Relational database and vector similarity search |
| **LiveKit RTC** | 0.18+ | Apache-2.0 | Full-duplex real-time voice room orchestration |
| **Deepgram** | Nova-2 | Commercial API | Real-time speech-to-text for voice concierge |
| **Groq / OpenAI** | `openai/gpt-oss-120b` / `gpt-4.1-mini` | Commercial API | Conversational booking, function calling, dispute legal rebuttal drafting |
| **Cryptography** | `cryptography` (Python) | Apache-2.0 / BSD | Ed25519 digital signature signing and SHA-256 hash chaining |

*All code in this repository was written during the hackathon period starting October 14, 2026.*

---

## 4. YouTube Video Metadata

**Title:** SalonDesk — Ending Salon No-Shows with PayPal Authorization Holds & AI Concierge  
**Link:** `https://youtu.be/to2uynlBQmE`  
**Duration:** 2 minutes 42 seconds  

### Video Description Text:
```
SalonDesk is an agentic salon booking platform that ends salon no-show revenue losses without charging clients upfront ("A Hold, Not a Charge").

Built for the PayPal AI Hackathon:
🏆 Best Use of PayPal + AI
🏆 Best Use of Agentic Commerce
🏆 Sponsor Prize: AG Grid

🔗 Live Demo: https://paypalai.hackathon.huludelala.com
💻 GitHub Repo: https://github.com/Huludelala/Salon-Desk
⚡ Fast Evaluation: Use the 1-Click "Judge Mode" toolbar to switch between Client, Salon Owner, and Admin personas in seconds!

TIMESTAMPS:
0:00 - The $1,440/Year Problem: Salon No-Shows & Upfront Deposit Friction
0:24 - "A Hold, Not a Charge": How PayPal Authorization Holds Work
0:50 - Client Experience: Full-Duplex AI Voice Concierge & In-Page PayPal Smart Buttons
1:25 - Deterministic Settlement: Mark Show ($120 capture) vs. Mark No-Show ($30 capture)
1:50 - AG Grid Enterprise Tables: Live Appointments & SHA-256 Verified Audit Ledger
2:10 - 3-Agent Dispute Counsel: Ed25519 Signatures, Hash-Chained Evidence & Court-Ready PDF Dossier
2:35 - Summary & PayPal Architecture

#PayPal #PayPalHackathon #AI #AgenticCommerce #AGGrid #FastAPI #NextJS #LiveKit
```

---

## 5. Official Closed Captions (`subtitles.srt`)

```srt
1
00:00:01,000 --> 00:00:05,200
Every year, independent hair salons and barbers lose 7% of their annual revenue to no-shows.

2
00:00:05,500 --> 00:00:09,800
When a client fails to arrive for a three-hour appointment, that stylist's chair sits empty.

3
00:00:10,000 --> 00:00:14,200
Traditional non-refundable deposits scare honest clients away before they ever set foot in the door.

4
00:00:14,500 --> 00:00:18,500
Introducing SalonDesk: A hold, not a charge.

5
00:00:19,000 --> 00:00:23,800
Powered by PayPal Orders v2, PayPal JS SDK, and deterministic agentic AI.

6
00:00:24,200 --> 00:00:28,800
At booking, zero dollars are charged. Instead, an authorization hold locks the agreed deposit.

7
00:00:29,000 --> 00:00:33,000
If the client shows up, the full service fee is captured directly to the salon's account.

8
00:00:33,500 --> 00:00:38,000
If they cancel on time, the hold is voided with zero friction and zero fees.

9
00:00:38,500 --> 00:00:44,000
And if they no-show, only the pre-agreed no-show fee is captured; the remainder is instantly released.

10
00:00:44,500 --> 00:00:49,500
Clients discover salons through our real-time LiveKit full-duplex voice concierge or semantic text chat.

11
00:00:50,000 --> 00:00:55,000
Checkout embeds native PayPal Smart Buttons with intent set to authorize.

12
00:00:55,500 --> 00:01:03,000
Every consent is digitally signed with an Ed25519 keypair and chained into an immutable SHA-256 ledger.

13
00:01:03,500 --> 00:01:10,000
On the merchant side, salon owners manage appointments using high-density AG Grid Community interactive tables.

14
00:01:10,500 --> 00:01:16,500
Owners filter holds in real time and inspect cryptographically verified financial audit records.

15
00:01:17,000 --> 00:01:23,000
When a dispute occurs, our three-agent Dispute Counsel springs into action.

16
00:01:23,500 --> 00:01:29,000
The Investigator verifies digital signatures and cryptographic block integrity.

17
00:01:29,500 --> 00:01:35,000
The Advocate drafts a formal five-point legal rebuttal tailored for PayPal Resolution Center limits.

18
00:01:35,500 --> 00:01:42,000
And the Skeptic identifies evidence vulnerabilities and bounds win probability between eighty-eight and ninety-six percent.

19
00:01:42,500 --> 00:01:49,000
A court-ready PDF evidence dossier is automatically generated and submitted directly to PayPal.

20
00:01:49,500 --> 00:01:56,000
Our philosophy is simple: AI proposes; code and PayPal decide.

21
00:01:56,500 --> 00:02:04,000
Strict safety firewalls prevent autonomous concessions, while hard amount ceilings protect buyers and sellers alike.

22
00:02:04,500 --> 00:02:11,000
Judges can test every feature in under sixty seconds using our one-click Judge Mode toolbar.

23
00:02:11,500 --> 00:02:18,000
Switch between Client, Salon Owner, and Admin personas with pre-configured PayPal sandbox credentials.

24
00:02:18,500 --> 00:02:25,000
Try it now at paypalai.hackathon.huludelala.com.

25
00:02:25,500 --> 00:02:40,000
SalonDesk: empowering independent stylists with agentic commerce and trusted PayPal authorization holds.
```

