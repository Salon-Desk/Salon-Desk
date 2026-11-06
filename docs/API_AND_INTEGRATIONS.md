# SalonDesk — API Catalog & Integrations

SalonDesk exposes a clean, modular REST API under `/api/v1/` built with FastAPI and documented via OpenAPI.

---

## 1. HTTP Endpoint Prefixes

All routes are mounted under `/api/v1/`:

| Prefix | Domain / Portal | Description |
|---|---|---|
| `/auth` | Authentication | Sign-up, sign-in, user profiles, password reset tokens |
| `/catalog` | Public Discovery | Browse salons, services, category taxonomy, and stylist availability |
| `/bookings` | Client Bookings | Create appointments, sign Ed25519 terms, view active holds, cancel |
| `/payments` | Payment Holds | PayPal authorization hold creation, approval return callback |
| `/settlements` | Merchant Settlements | Mark show (`final_capture: true`) or mark no-show (partial capture) |
| `/organizations` | Merchant Portal | Salon settings, working hours, stylists, service catalog, billing |
| `/admin` | Platform Admin | Organization approvals, categories, commission ledger, analytics |
| `/chat` | RAG Concierge | Semantic natural language booking chat with service recommendation cards |
| `/livekit` | Voice Agent | Mint room tokens and dispatch realtime voice worker sessions |
| `/ai` | Copilot & Tools | Stylist availability checks, owner scheduling copilot |
| `/webhooks` | PayPal Webhooks | Handles `CHECKOUT.ORDER.APPROVED`, `PAYMENT.AUTHORIZATION.CREATED`, `CUSTOMER.DISPUTE.*` |
| `/demo` | Demo Management | `POST /demo/reset` for clearing and re-seeding the sandbox environment |
| `/health` | Health Check | Root system and database connectivity status check (`{"status": "ok"}`) |

Interactive Swagger documentation is available locally at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

---

## 2. Postman Collection

A pre-configured Postman collection is maintained in [`postman/collection.json`](../postman/collection.json).

To regenerate or refresh the Postman collection directly from the live FastAPI OpenAPI schema without starting a server:

```bash
make postman
```

Or print usage:
```bash
make postman-help
```

---

## 3. PayPal Webhooks & Sandbox Simulation

SalonDesk validates incoming PayPal webhook payloads using asymmetric signature verification via `POST /v1/notifications/verify-webhook-signature`.

Supported PayPal webhook events:
- `CHECKOUT.ORDER.APPROVED`
- `PAYMENT.AUTHORIZATION.CREATED`
- `PAYMENT.CAPTURE.COMPLETED`
- `CUSTOMER.DISPUTE.CREATED`
- `CUSTOMER.DISPUTE.UPDATED`
- `CUSTOMER.DISPUTE.RESOLVED`

