---
name: salondesk-dev-workflow
description: >-
  Complete developer workflow, architecture guidelines, and feature validation checklist for SalonDesk Deposits. Use when building, testing, or reviewing backend, client app, or merchant console features without Amharic dependencies.
---

# SalonDesk Deposits — Developer Workflow & Architecture Guide

This skill guides engineering workflows, architectural rules, and validation checklists for **SalonDesk Deposits** (closed-loop salon appointment booking, authorization holds, direct PayPal settlement, automated dispute counsel, and waitlist slot rescue).

---

## 1. Core Architecture Principles

### 1.1 "Hold, Not a Charge" Value Proposition
- **Zero Dollars Charged at Booking**: Clients authorize a deposit hold via PayPal Orders v2 (`intent="AUTHORIZE"`). No money is debited up front.
- **Settlement & Capture**:
  - **Completed Service (`mark-show`)**: Captures full service price (`PaymentCaptureType.FULL`, `final_capture=True`).
  - **No-Show (`mark-no-show`)**: Captures only the agreed no-show fee (`PaymentCaptureType.NO_SHOW_FEE`, `final_capture=True`).
  - **Late Cancellation**: Captures bounded late-cancel fee (`PaymentCaptureType.LATE_CANCEL`, `final_capture=True`).
  - **Free Cancellation**: Voids authorization hold with zero fee (`void_hold`).
- **Hold Lifecycle**:
  - Honor period is 3 days (`honor_expires_at = now + 3 days`).
  - Reauthorization supported via `reauthorize_hold` up to `MAX_REAUTHORIZATION_COUNT = 1`.

### 1.2 Direct Merchant Settlement & SaaS Commission Ledgering
- **Direct Settlement**: Client funds flow directly into the salon’s PayPal merchant account (`payee_merchant_id`), preventing marketplace escrow liability.
- **Automated SaaS Commission Ledgering**:
  - Platform commission fee is snapshotted at booking creation.
  - On every capture, `accrue_commission_for_capture` records the platform fee in the double-entry accounting ledger (`CommissionRecord`), billed asynchronously to the salon.

### 1.3 Booking-Time Immutability Snapshots
- When a booking is created in `booking_service.create_booking`:
  - `policy_snapshot_json`: Locks salon cancellation hours, no-show fee percent, and late-cancel terms at agreement time.
  - `commission_snapshot`: Locks platform fee rates.
  - `agreed_no_show_fee` & `free_cancel_deadline_at`: Pre-calculated and frozen.
- Salon policy updates or platform rule revisions **never** retroactively modify existing bookings.

### 1.4 Deterministic Policy Firewalls & Cryptographic Proof
- **Deterministic State Machines**:
  - `assert_valid_booking_transition`: Enforces legal lifecycle transitions (`PENDING` → `CONFIRMED` → `COMPLETED`/`CANCELLED`/`NO_SHOW`).
  - `assert_valid_hold_transition`: Enforces payment hold states (`PENDING` → `AUTHORIZED` → `CAPTURED`/`VOIDED`).
- **Ceiling Invariants**:
  - Deposit ceiling: `assert_deposit_within_ceiling` caps deposits at 50% of service price (`MAX_DEPOSIT_FRACTION = Decimal("0.50")`).
  - Capture ceiling: `assert_capture_within_ceiling` ensures `capture_amount <= (hold.amount - already_captured)`.
  - No-show fee bound: Capture amount cannot exceed `booking.agreed_no_show_fee`.
- **Cryptographic Audit Ledger**:
  - **Ed25519 Signatures**: Client terms agreement is verified and signed (`verify_consent_signature`).
  - **SHA-256 Ledger Chaining**: Every state event (`AUTHORIZATION_CREATED`, `FULL_PAYMENT_CAPTURED`, etc.) appends an immutable block linked to previous record hash (`append_ledger`, `verify_ledger_chain`).

---

## 2. Tech Stack & Local Commands

### 2.1 Backend (FastAPI, SQLAlchemy Async, SQLite/PostgreSQL)
Run from the `backend/` directory:

```bash
# Start local FastAPI dev server (auto-reloading on port 8000)
cd backend && uv run fastapi dev app/main.py

# Run the pytest test suite
cd backend && uv run pytest -q

# Run specific domain test suites
cd backend && uv run pytest tests/services/test_dispute_counsel.py -q
cd backend && uv run pytest tests/services/test_slot_rescue.py -q
cd backend && uv run pytest tests/services/test_policy_engine.py -q
```

### 2.2 Frontend (Next.js 15 App Router, React 19, Tailwind CSS v4)
Run from the `frontend/` directory:

```bash
# Start frontend development server on port 3000
cd frontend && pnpm dev

# Type check frontend TypeScript
cd frontend && npx tsc --noEmit
```

### 2.3 Linting & Formatting
Run from project root:

```bash
# Run both frontend and backend linters
make lint

# Auto-format codebase
make format
```

### 2.4 Demo Reset & Database Seeding
To reset demo data and verify clean sandbox state:

```bash
# Reset database and seed fresh demo entities via API
curl -X POST http://localhost:8000/api/v1/demo/reset

# Or reset from terminal Makefile
make seed-clear
```

---

## 3. Feature Validation Checklist

### 3.1 Dispute Counsel (Closed-Loop PayPal Disputes v1 Defense)
- [ ] **3-Agent Pipeline**:
  - **Investigator**: Deterministically checks Ed25519 client signature and unbroken SHA-256 financial audit chain.
  - **Advocate**: Drafts structured legal defense citing timestamps, cancellation policies, and verified chat exhibits.
  - **Skeptic**: Calculates mathematical win probability score (88–96%) and advises whether to `FILE_EVIDENCE` or `MAKE_OFFER`.
- [ ] **Court-Ready PDF Dossier (PDF-1.4)**:
  - Generated via `generate_dispute_evidence_pdf` (`backend/app/services/pdf_evidence_generator.py`).
  - Includes booking timestamps, cryptographic checksums, client consent quote, and ledger event sequence.
- [ ] **Merchant Interface**:
  - Responsive drawer ([DisputeDrawer.tsx](file:///Users/mac/Desktop/Paypal/Salon-Desk/frontend/app/merchant/_components/DisputeDrawer.tsx)) supporting mobile, tablet, and desktop viewports.
  - 1-tap settlement offer presets (25%, 50%, 75%, Full).
  - Sandbox win/concede simulation triggers.

### 3.2 Slot Rescue (Waitlist Refill & Automatic Fee Void/Refund)
- [ ] **Slot Rescue Service** (`backend/app/services/slot_rescue_service.py`):
  - When an appointment is late-cancelled or marked no-show, matches eligible waitlist candidates for the vacated time window (`is_slot_rescued`).
  - **Deterministic Referee** (`evaluate_slot_rescue` in `policy_engine.py`):
    - If hold was authorized but not captured: executes `VOID_HOLD` (cardholder released from fee).
    - If fee was already captured: executes `REFUND_CAPTURE` via PayPal refund API.
- [ ] **Audit Trail**: Logs `SLOT_RESCUED_FEE_WAIVED` or `SLOT_RESCUED_FEE_REFUNDED` to the SHA-256 ledger.

---

## 4. Scope Exclusions

- **No Translation Dependencies**: Strictly omit Amharic translation layers, Amharic-specific prompt templates, and multilingual voice workflows. All schemas, rebuttal text, and user feedback must remain in standard English.
