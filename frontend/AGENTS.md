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

---

## Core Architectural Rules & Standards (MANDATORY)

Every agent and developer working in `frontend/` MUST adhere to these seven architectural rules:

### Rule 1: Tables — Exclusively `BasicDataGridTable`

- **Component**: `@/components/table/BasicDataGridTable` (`components/table/BasicDataGridTable.tsx`).
- **Standard**: Every tabular list across all portals (merchant staff, merchant services, merchant invoices, admin salons, admin commissions, admin taxonomy, admin reviews, admin billing) MUST use `BasicDataGridTable`.
- **Column Definitions**: Define pure column arrays typed with `ColumnDefinition<T>[]` from `@/types/table`. Keep column definitions in separate files (e.g., `StaffTableColumns.tsx`, `SalonTableColumns.tsx`). Do NOT define columns inline in view components.
- **Built-in Actions**: Use the table's built-in action props instead of creating custom action columns:
  - `onView`, `onEdit`, `onDelete`, `onSuspend`, `onApprove`, `onReject` for standard CRUD actions
  - `renderRowActions` for custom row-level action rendering
  - `customButtons` for table-level action buttons (e.g., "Add Service")
  - Set `showActions={true}` to enable the actions column
- **Pagination & Controls**: Pass `currentPage`, `totalPages`, `totalItems`, `itemsPerPage`, `onPageChange`, `onItemPerPageChange`, `showPagination`, and `showSearch`.
- **Prohibited**:
  - Raw `<table>`, `<tbody>`, `<tr>`, `<td>` grids in views.
  - Competing table wrappers (such as legacy `components/ui/data-table.tsx` — removed and banned).
  - Non-standard pagination components.
  - Defining columns inline in view components (must be in separate files).
  - Creating custom action columns when built-in action props are available.

### Rule 2: Filterable Lists — Exclusively `useListingParams`

- **Hook**: `@/hooks/useListingParams` (`hooks/useListingParams.ts`).
- **Standard**: Every searchable, filterable, or paginated table/view MUST manage its query parameters via `useListingParams` backed by a Zod schema.
- **Schema Pattern**: Define listing schemas in `lib/listing-params/` using `listingDefaultsFromSchema` and `ListingParamSchema` from `@/hooks/useListingParams`. Each schema file should define defaults for page, limit, search, sort, and domain-specific filters (e.g., `admin-commission-list-params.ts`).
- **URL Synchronization**: Page numbers, search queries, sort directions, and domain filters synchronize automatically with Next.js router query parameters (`useSearchParams`).
- **Prohibited**:
  - Ad-hoc `useState` for pagination (`page`, `pageSize`) or filter fields.
  - Custom debounce loops that bypass `useListingParams`.

### Rule 3: Dialogs & Modals — Exclusively `CustomResponsiveDialog`

- **Components**:
  - `@/components/dialog/CustomResponsiveDialog` (`components/dialog/CustomResponsiveDialog.tsx`) for adaptive desktop modals / mobile responsive dialogs.
  - `@/components/drawer/CustomDrawer` (`components/drawer/CustomDrawer.tsx`) for dedicated slide-over / bottom / side drawer surfaces.
- **Standard**: Every modal, drawer, or sheet dialog across client, merchant, and admin portals MUST use `CustomResponsiveDialog` (for modals/dialogs) or `CustomDrawer` (for dedicated drawer surfaces). They provide full accessibility (`DialogTitle`/`DrawerTitle`, descriptions) and keyboard navigation.
- **Confirmation Dialogs**: For specific actions, use specialized domain confirmation dialogs from `@/components/dialog`:
  - `DeleteConfirmationDialog`
  - `CancelConfirmationDialog`
  - `PaymentConfirmationDialog`
- **Prohibited**:
  - Competing modal wrappers (`components/ui/modal.tsx`, `components/ui/confirm-dialog.tsx` — deleted and banned).
  - Direct uncontrolled Radix/shadcn `Dialog` or `Drawer` implementations in feature views.

### Rule 4: Forms — `useFormHandler` + Zod + `FormProvider` + `RHF*`

- **Hook**: `@/hooks/formHandler` (`hooks/formHandler.ts`). Use `useFormSubmitHandler` for forms with Zod schema and RTK Query mutations.
- **Standard**: Every form must follow the standard form architecture:
  1. Define a strict Zod schema (Zod v4) in a separate schema file (e.g., `lib/schema/auth.ts` or feature's `_schemas/` folder). Reuse common validators from `@/lib/schema/common` (`fieldValidators`, `refineInternationalPhone`).
  2. Initialize via `useFormHandler({ schema, defaultValues, onSubmit })` or `useFormSubmitHandler` for RTK Query integration.
  3. Wrap the form in `FormProvider`.
  4. Use standardized `RHF*` field components from `@/components/forms` (`RHFTextField`, `RHFSelectField`, `RHFNumberField`, `RHFTextareaField`, `DatePickerField`, `DateRangePicker`).
  5. Connect to RTK Query mutations with unified toast/error handling.
- **Prohibited**:
  - Uncontrolled or raw `<form>` with ad-hoc `useState` validation.
  - Manual error rendering when `RHF*` components provide built-in validation messages.

### Rule 5: Component Structure, Naming & Thin Pages

- **Strict 1 Component Per File**: Every `.tsx` file MUST contain strictly ONE primary React component. Multi-component files are forbidden. Sub-components, cards, header panels, or dialog views must be extracted into their own dedicated files.
- **PascalCase File Naming**: Every React component file MUST be named in `PascalCase.tsx` (e.g. `AdminSalonsView.tsx`, `MerchantStaffView.tsx`, `CancelBookingDialog.tsx`).
- **Thin Route Pages (< 30 LOC)**: Every route `page.tsx` file MUST be a thin shell under 30 lines of code. It only sets metadata/auth guards and delegates immediately to a dedicated view component (e.g. `app/admin/salons/page.tsx` simply renders `<AdminSalonsView />`).
- **Domain Barrels**: Shared components belong in domain-specific barrels (`@/components/table`, `@/components/dialog`, `@/components/card`, `@/components/badge`, `@/components/button`, `@/components/auth`, `@/components/forms`, `@/components/loader`).

### Rule 6: UI & Design Tokens

- **Stat Cards**: Use `@/components/card` (`StatCard`).
- **Badges**: Use `@/components/badge` (`StatusBadge`, `HoldStateBadge`, `OrganizationStatusBadge`, `ChangeRequestStatusBadge`).
- **Buttons**: Use `@/components/button` (`PrimaryButton`, `RefreshButton`). Every button MUST use these reusable components—no raw `<button>` elements or ad-hoc button styles.

### Rule 7: State Components — EmptyState & ErrorState

- **EmptyState**: Use `@/components/empty/EmptyState` for empty data states in tables, lists, and views.
- **ErrorState**: Use `@/components/empty/ErrorState` for error states.
- **Standard**: These components provide consistent UX for empty/error states across all portals. They accept icon, title, description, and optional action props.
- **Prohibited**:
  - Custom empty state JSX (e.g., inline "No data found" text).
  - Ad-hoc error message rendering without using ErrorState.

---

## Repository layout

```
app/
  layout.tsx, globals.css, Providers.tsx   Root shell (Redux, auth, toasts)
  middleware.ts                            /org → /merchant rewrite only
  (auth)/login|forgot-password|reset-password
  _components/                             Hub (landing) feature UI
  client/                                  Client portal routes + _components/
  merchant/                                Org console (onboarding, settings, …) + _components/
  admin/                                   Platform admin + _components/
  book/                                    Redirect → /client/book
  api/                                     Route handlers (demo AI concierge, demo reset)
components/
  badge/                                   StatusBadge, HoldStateBadge, domain badges
  button/                                  PrimaryButton, RefreshButton
  card/                                    StatCard, PanelCard
  dialog/                                  CustomResponsiveDialog, confirmation dialogs
  drawer/                                  CustomDrawer
  table/                                   BasicDataGridTable, Pagination, TableActionLink
  forms/                                   RHF* fields, DatePickerField, dropzones
  layout/                                  Console shell, portal switcher, auth gate
  auth/                                    Sign-in, modal host, views, profile editor
  ai-concierge/                            Shared concierge UI (drawer, voice orb)
  chat/                                    Global chat widget + useAgentChat (RTK)
  loader/                                  LoadingSpinner, Skeletons
  ui/                                      Base Radix primitives & utility controls
constant/                                  Validation messages, toast colors, …
hooks/                                     useListingParams, formHandler, portal stores
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
types/                                     Shared TypeScript domain types (table.tsx, etc.)
public/                                    Static assets
```

### Routing (client portal)

| Route                      | Purpose                                   |
| -------------------------- | ----------------------------------------- |
| `/client`                  | Catalog + concierge (default tab)         |
| `/client/book`             | Redirects to the draft / last checkout    |
| `/client/book/[serviceId]` | Full-page checkout (`?slot=&stylist=`)    |
| `/client/bookings`         | My bookings                               |
| `/client/profile`          | Client profile                            |
| `/client/org/[orgId]`      | Org-filtered catalog                      |
| `/merchant/*`              | Merchant console (`/org/*` rewrites here) |
| `/admin/*`                 | Platform admin                            |

JWT lives in **localStorage**; edge `middleware.ts` does not enforce auth (use `AuthGate` / layout guards).

## State & API

- **Auth & session**: `store/authSlice.ts`; bootstrap in `Providers.tsx` (`fetchAuthData`, portal `setActiveApp` from pathname).
- **Booking checkout draft**: `store/bookingDraftSlice.ts` + `hooks/use-booking-context.ts`; sign-in from checkout resumes on `/client/book/[serviceId]` with the selection in the query string.
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
| `useAgentChat`   | `components/chat/useAgentChat.ts` | RTK → `/api/v1/chat` with `portal` (`client` \| `merchant` \| `admin`)                      |

- **Client** (`ConciergeDrawer`): booking concierge — recommendations, auth, holds.
- **Merchant / admin** (global `ChatWidget` in `Providers.tsx` via `portalFromPathname`): system help only — no booking cards; backend skips booking tools and uses guide RAG (`org_guide` / `admin_guide`).

Client drawer UI: `app/client/_components/ConciergeDrawer.tsx`.

## UI conventions

- **Primitives**: prefer domain modules (`@/components/table`, `@/components/dialog`, `@/components/card`, `@/components/badge`, `@/components/button`) + `cn` from `@/lib/utils`.
- **Forms**: `useFormHandler` + `FormProvider` + `components/forms` `RHF*` fields.
- **Global vs feature**: reuse `components/*` when used in 2+ features; hoist hooks to `hooks/`, types to `types/`.
- **Feature isolation**: each portal under `app/<feature>/` with underscore-prefixed internal folders.
- **Pages stay thin**: `page.tsx` strictly < 30 LOC; composes feature entry components only.
- **Copy**: plain English in components; validation strings in `constant/validation-messages.ts`.

## Feature layout standard (`app/<feature>/`)

| Folder         | Purpose                                            |
| -------------- | -------------------------------------------------- |
| `_components/` | Feature-internal React UI (PascalCase.tsx)         |
| `_constants/`  | Feature defaults, demo personas                    |
| `_hooks/`      | Feature-only hooks (hoist shared ones to `hooks/`) |
| `_schemas/`    | Feature Zod schemas (reuse `@/lib/schema/common`)  |
| `_context/`    | Feature React context (merchant/admin)             |
| `index.ts`     | Public barrel                                      |
| `page.tsx`     | Thin route entry (< 30 LOC)                        |

### Hoisting rules

1. Start new code in the feature’s underscore folders.
2. Schemas in `_schemas/`; messages from `constant/validation-messages.ts`.
3. After **2+ features** need the same piece → hoist to `components/`, `hooks/`, `lib/`, or `types/`.
4. Do not duplicate shadcn primitives inside features.

## TypeScript & quality

- Strict mode; shared domain models in `types/`.
- ESLint + Prettier; run `pnpm validate` before considering frontend work done.
- Zod v4 APIs (`lib/schema/common.ts`).
- Avoid unstable values like `new Date()` during Client Component prerender; use fixed seeds or `useEffect` / event handlers.

## Schema patterns

### Form schemas

- **Location**: Define in `lib/schema/` for shared schemas or `app/<feature>/_schemas/` for feature-specific schemas.

- **Pattern**: Import `z` and common validators from `@/lib/schema/common` (`fieldValidators`, `refineInternationalPhone`).

- **Example**:

  ```typescript
  import { z } from 'zod'
  import { fieldValidators, refineInternationalPhone } from '@/lib/schema/common'

  export const authSchema = z.object({
    email: fieldValidators.email,
    password: fieldValidators.password,
    phone: refineInternationalPhone(),
  })
  ```

### Listing schemas

- **Location**: Define in `lib/listing-params/` for domain-specific listing parameters.

- **Pattern**: Import `listingDefaultsFromSchema` and `ListingParamSchema` from `@/hooks/useListingParams`.

- **Example**:

  ```typescript
  import { listingDefaultsFromSchema, type ListingParamSchema } from '@/hooks/useListingParams'
  import { z } from 'zod'

  export const AdminCommissionListParamsSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(20),
    search: z.string().optional(),
    status: z.enum(['all', 'active', 'inactive']).default('all'),
  }) satisfies ListingParamSchema

  export const adminCommissionListDefaults = listingDefaultsFromSchema(
    AdminCommissionListParamsSchema,
  )
  ```

## Global reusable components

| Area       | Path                 | Use                                                       |
| ---------- | -------------------- | --------------------------------------------------------- |
| Tables     | `components/table/`  | `BasicDataGridTable`, `Pagination`, `TableActionLink`     |
| Dialogs    | `components/dialog/` | `CustomResponsiveDialog`, confirmation dialogs            |
| Drawers    | `components/drawer/` | `CustomDrawer`                                            |
| Cards      | `components/card/`   | `StatCard`, `PanelCard`                                   |
| Badges     | `components/badge/`  | `StatusBadge`, `HoldStateBadge`, domain status badges     |
| Buttons    | `components/button/` | `PrimaryButton`, `RefreshButton`                          |
| Forms      | `components/forms/`  | `RHFTextField`, `RHFSelectField`, `DatePickerField`, etc. |
| Layout     | `components/layout/` | `ConsoleShell`, `PortalSwitcher`, `AuthGate`              |
| Auth       | `components/auth/`   | Modals, sign-in forms, auth views                         |
| Loaders    | `components/loader/` | `LoadingSpinner`, skeleton loaders                        |
| State      | `components/empty/`  | `EmptyState`, `ErrorState`                                |
| AI & Chat  | `components/chat/`   | Voice orb, global chat, concierge UI                      |
| Primitives | `components/ui/`     | Base Radix primitives & utility controls                  |
