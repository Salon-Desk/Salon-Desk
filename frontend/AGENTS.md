<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# SalonDesk frontend — agent guide

Next.js 16 App Router demo for salon booking with PayPal authorization holds (**client**, **merchant**, **admin** portals). Package manager: **pnpm**. Path alias: **`@/*`** → frontend root (`tsconfig.json`).

Monorepo backend and shared agent rules: **[../AGENTS.md](../AGENTS.md)**. Human setup: **[../Readme.md](../Readme.md)**.

**English-only.** Do not add i18n, locale providers, translation dictionaries, or `_localization/` folders.

## Commands

| Script            | Purpose                        |
| ----------------- | ------------------------------ |
| `pnpm dev`        | Dev server (Next default port) |
| `pnpm build`      | Production build               |
| `pnpm start`      | Production server              |
| `pnpm lint`       | ESLint (`--max-warnings=0`)    |
| `pnpm lint:fix`   | ESLint with auto-fix           |
| `pnpm format`     | Prettier check                 |
| `pnpm format:fix` | Prettier write                 |
| `pnpm typecheck`  | `tsc --noEmit`                 |
| `pnpm validate`   | format + lint + typecheck      |

Use ESLint + Prettier (`eslint.config.*`, Prettier config in repo). Match existing 2-space indent and project formatter settings.

## Repository layout

```
app/
  layout.tsx, globals.css, Providers.tsx   Root shell (Redux, auth, toasts)
  middleware.ts                            /org → /merchant rewrite only
  (auth)/login|forgot-password|reset-password
  _components/                             Hub (landing) feature UI
  client/                                  Client portal routes + _components/
  merchant/                                Org console (onboarding, settings, …)
  admin/                                   Platform admin
  book/                                    Redirect → /client/book
  api/                                     Route handlers (demo AI concierge, demo reset)
components/
  ui/                                      Shared primitives (SalonDesk + shadcn)
  forms/                                   RHF* fields, pickers
  layout/                                  Console shell, portal switcher, auth gate
  auth/                                    Sign-in, modal host, profile editor
  ai-concierge/                            Shared concierge UI (drawer, voice orb)
  chat/                                    Global chat widget + use-agent-chat (RTK)
constant/                                  Validation messages, toast colors, …
hooks/                                     Shared hooks (portal stores, concierge, booking draft)
lib/
  store/                                   Demo seed fns + types only (Redux owns runtime state)
  sandbox/                                 demo-reset, local DB helpers for sandbox
  data/                                    Seed / catalog fixtures
  schema/                                  Shared Zod validators
  util/                                    Pure helpers
  utils/                                   cn() and shared class helpers
store/
  index.ts, baseApi.ts                     Redux store + RTK Query base
  authSlice.ts, bookingDraftSlice.ts
  clientDemoSlice.ts, merchantDemoSlice.ts, adminDemoSlice.ts
  api/sharedApi.ts, platformApi.ts, orgApi.ts, clientApi.ts
  slice/                                   Back-compat re-exports of RTK endpoints
types/                                     Shared TypeScript domain types
public/                                    Static assets
```

### Routing (client portal)

| Route                 | Purpose                                      |
| --------------------- | -------------------------------------------- |
| `/client`             | Catalog + concierge (default tab)            |
| `/client/book`        | Checkout; `SplitBookingAuth` when logged out |
| `/client/bookings`    | My bookings                                  |
| `/client/profile`     | Client profile                               |
| `/client/org/[orgId]` | Org-filtered catalog                         |
| `/merchant/*`         | Merchant console (`/org/*` rewrites here)    |
| `/admin/*`            | Platform admin                               |

JWT lives in **localStorage**; edge `middleware.ts` does not enforce auth (use `AuthGate` / layout guards).

## State & API

- **Auth & session**: `store/authSlice.ts`; bootstrap in `Providers.tsx` (`fetchAuthData`, portal `setActiveApp` from pathname).
- **Booking checkout draft**: `store/bookingDraftSlice.ts` + `hooks/use-booking-context.ts`; resume after login on `/client/book`.
- **Portal demo UI** (sandbox bookings, merchant console mock data, admin dashboard mock data): Redux slices `*DemoSlice.ts`, hydrated from localStorage in `Providers.tsx`. Read/write via `hooks/use-portal-stores.ts` (`useClientStore`, `useMerchantStore`, `useAdminStore`).
- **RTK Query**: inject endpoints in `store/api/*Api.ts`. Prefer these over raw `axios`/`fetch` for `/api/v1/*` calls.
  - **Client**: catalog, bookings, payments, `clientConciergeChat` → `POST /api/v1/chat`, LiveKit token.
  - **Org**: `orgApi.ts` → `/api/v1/organizations/*`, settlements.
  - **Platform**: `platformApi.ts` → `/api/v1/admin/*`.
  - **Shared**: `sharedApi.ts` → auth/profile.
- **Legacy**: `store/slice/*` and `store/app.ts` may re-export — new code should import from `@/store` / `@/store/api/clientApi`.

### AI concierge hooks

| Hook             | Location                          | Transport                                                                                   |
| ---------------- | --------------------------------- | ------------------------------------------------------------------------------------------- |
| `useAiConcierge` | `hooks/use-ai-concierge.ts`       | RTK `useClientConciergeChatMutation` when `features.agentChat`; else `app/api/ai/concierge` |
| `useAgentChat`   | `components/chat/useAgentChat.ts` | RTK → `/api/v1/chat` (global chat widget)                                                   |

Client drawer UI: `app/client/_components/ConciergeDrawer.tsx` (export alias `ConciergeDrawer`; legacy name `AiConcierge`).

## UI conventions

- **New UI**: prefer `components/ui` + `cn` from `@/lib/utils`. Add shadcn via `pnpm dlx shadcn@latest add …` (`components.json`).
- **Forms**: `FormProvider` + `components/forms` `RHF*` fields.
- **Global vs feature**: reuse `components/*` when used in 2+ features; hoist hooks to `hooks/`, types to `types/`.
- **Feature isolation**: each portal under `app/<feature>/` with underscore-prefixed internal folders.
- **Pages stay thin**: `page.tsx` composes feature entry components only.
- **Copy**: plain English in components; validation strings in `constant/validation-messages.ts`.

### Client `_components/` naming

Files under `app/client/_components/` use **PascalCase** filenames aligned with primary exports, e.g.:

| File                                       | Primary export(s)                              |
| ------------------------------------------ | ---------------------------------------------- |
| `ClientExperience.tsx`                     | `ClientExperience`                             |
| `ClientBookPage.tsx`                       | `ClientBookPage`                               |
| `SplitBookingAuth.tsx`                     | `SplitBookingAuth`                             |
| `PayPalHoldCheckout.tsx`                   | `PayPalHoldCheckout` (alias `PaypalAuthModal`) |
| `BookingReceipt.tsx`                       | `BookingReceipt` (alias `ReceiptModal`)        |
| `ConciergeDrawer.tsx`                      | `AiConcierge` (alias `ConciergeDrawer`)        |
| `ServiceCard.tsx`, `CatalogFilters.tsx`, … | Same as filename                               |

Public barrel: `app/client/index.ts`.

## App shell

- `app/layout.tsx`: fonts, metadata, `Providers`.
- `app/Providers.tsx`: Redux `Provider`, demo slice hydrate, `AuthProvider`, `AuthModalHost`, optional global `ChatWidget` (hidden on client routes that host their own concierge).
- Portal chrome: `components/layout` (`ConsoleShell`, `AuthGate`, `PortalSwitcher`).
- Hub: `app/page.tsx` + `app/_components/`.

## Feature layout standard (`app/<feature>/`)

| Folder         | Purpose                                            |
| -------------- | -------------------------------------------------- |
| `_components/` | Feature-internal React UI                          |
| `_constants/`  | Feature defaults, demo personas                    |
| `_hooks/`      | Feature-only hooks (hoist shared ones to `hooks/`) |
| `_schemas/`    | Feature Zod schemas (reuse `@/lib/schema/common`)  |
| `_context/`    | Feature React context (merchant/admin)             |
| `index.ts`     | Public barrel                                      |
| `page.tsx`     | Thin route entry                                   |

### Hoisting rules

1. Start new code in the feature’s underscore folders.
2. Schemas in `_schemas/`; messages from `constant/validation-messages.ts`.
3. After **2+ features** need the same piece → hoist to `components/`, `hooks/`, `lib/`, or `types/`.
4. Do not duplicate shadcn primitives inside features.

## TypeScript & quality

- Strict mode; shared domain models in `types/`.
- ESLint + Prettier; run `pnpm typecheck` before considering frontend work done.
- Zod v4 APIs (`lib/schema/common.ts`).
- Avoid unstable values like `new Date()` during Client Component prerender; use fixed seeds or `useEffect` / event handlers.

## Global reusable components

| Area       | Path                                           | Use                       |
| ---------- | ---------------------------------------------- | ------------------------- |
| Primitives | `components/ui/`                               | Buttons, inputs, dialogs  |
| Forms      | `components/forms/`                            | RHF*, pickers             |
| Layout     | `components/layout/`                           | Console shell, portal nav |
| Auth       | `components/auth/`                             | Modals, sign-in forms     |
| AI         | `components/ai-concierge/`, `components/chat/` | Voice orb, global chat    |
