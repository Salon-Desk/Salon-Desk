<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# SalonDesk — agent guide

Next.js 16 App Router demo for salon booking with PayPal authorization holds (client, merchant, admin portals). Package manager: **pnpm**. Path alias: **`@/*`** → frontend root (`tsconfig.json`).

**English-only.** Do not add i18n, locale providers, translation dictionaries, or `_localization/` folders.

## Commands

| Script        | Purpose                        |
| ------------- | ------------------------------ |
| `pnpm dev`    | Dev server (Next default port) |
| `pnpm build`  | Production build               |
| `pnpm start`  | Production server              |
| `pnpm lint`   | Biome check                    |
| `pnpm format` | Biome format write             |

Match Biome (`biome.json`): 2-space indent, project formatter settings.

## Repository layout

```
app/                 App Router: layout, globals.css, portal routes
  _components/       Hub (landing) feature UI
  client/            Client portal feature (+ thin page.tsx)
  merchant/          Merchant console feature
  admin/             Platform admin feature
  book/              Alias route → client
  org/               Alias route → merchant
  api/               Route handlers (AI concierge, demo reset)
components/
  ui/                Shared primitives (SalonDesk + shadcn/radix-nova)
  forms/             Shared React Hook Form fields (RHF*), pickers, upload
  layout/            Shared console chrome (sidebar shell, portal switcher)
  brand/             Logo and brand marks
  button|dialog|drawer|empty|loader|table|tab|…   Shared reusable UI
constant/            App constants (validation messages, toast colors, …)
hooks/               Shared client hooks (store, toast, media query, …)
lib/
  store/             Persistent portal stores
  data/              Seed / catalog data
  schema/            Shared Zod validators
  util/              Pure helpers
  utils.ts           cn() and shared class helpers
types/               Shared TypeScript domain types
public/              Static assets
```

- **New UI**: prefer `components/ui` + `cn` from `@/lib/utils`. Add shadcn via `pnpm dlx shadcn@latest add …` (see `components.json`).
- **Forms**: wrap with `FormProvider`, use existing `RHF*` under `components/forms`.
- **Global vs feature UI**: reuse global building blocks anywhere. When a component, hook, constant, or util is used by 2+ features, hoist it to the matching global directory.
- **Feature isolation**: keep each portal under `app/<feature>/` with underscore-prefixed internal folders. Do not copy generic form primitives or shadcn wrappers into feature folders.
- **API**: route handlers under `app/api/`; portal state via `lib/store` + hooks. Env via `NEXT_PUBLIC_*`.
- **Do not** put business logic in `app/**/page.tsx` beyond thin composition.
- **Copy**: use plain English strings in components. Validation copy lives in `constant/validation-messages.ts`.

## App shell

- `app/layout.tsx`: root server layout, fonts, Sonner toaster, `html lang="en"`.
- Portal chrome: `components/layout` (`ConsoleShell`, `AuthGate`, `PortalSwitcher`).
- Hub landing: `app/page.tsx` composes `app/_components`.

## TypeScript & quality

- Strict mode; prefer explicit types in `types/` for shared domain models.
- Biome for lint/format (`biome.json`).
- Empty interfaces extending another type → use `type` aliases.
- Zod v4 APIs (see `lib/schema/common.ts`).
- Avoid unstable values like `new Date()` during Client Component prerender; use fixed values or read time in `useEffect` / event handlers.

## Global reusable components (`components/`)

App-wide — import from any route or feature:

| Area               | Path                                      | Use                                                      |
| ------------------ | ----------------------------------------- | -------------------------------------------------------- |
| Primitives         | `components/ui/`                          | Buttons, inputs, dialogs, tables                         |
| Forms              | `components/forms/`                       | `RHF*`, `FormProvider`, pickers, file upload             |
| Actions & feedback | `components/button/`, `loader/`, `empty/` | `PrimaryButton`, spinners, skeletons, empty/error states |
| Overlays & dialogs | `components/dialog/`, `drawer/`, `table/` | Responsive dialogs, drawers, data grids, pagination      |
| Tabs               | `components/tab/`                         | Shared tab patterns                                      |
| App shell          | `components/layout/`                      | Console shell, auth gate, portal nav                     |
| Brand              | `components/brand/`                       | Logo                                                     |

## Feature layout standard (`app/<feature>/`)

Every portal feature (`client`, `merchant`, `admin`, and hub via `app/_components`) uses **underscore-prefixed internal folders**:

| Folder         | Purpose                                                        |
| -------------- | -------------------------------------------------------------- |
| `_components/` | Feature-internal React UI; composed by the route page          |
| `_constants/`  | Feature-specific defaults, seeds, static local config          |
| `_hooks/`      | Feature-specific custom React hooks                            |
| `_libs/`       | Feature-specific getters, transformers, data helpers           |
| `_schemas/`    | Feature Zod schemas (reuse `@/lib/schema/common`)              |
| `_types/`      | Feature-local TypeScript types                                 |
| `_utils/`      | Pure helpers scoped to this feature                            |
| `index.ts`     | Public API barrel (entry components, hooks, constants, types)  |
| `page.tsx`     | Thin route: import and render the feature entry component only |

Hub landing lives at `app/` with `_components/` next to `page.tsx` (same rules, no nested route segment).

### Hoisting & schema rules

1. **Private by default**: new feature code starts in that feature’s underscore folders.
2. **Validation schemas in `_schemas/`**:
   - Feature form schemas live in `_schemas/`, not inline in components.
   - Reuse `@/lib/schema/common.ts`.
   - Error messages use English strings from `constant/validation-messages.ts` (no i18n layer).
3. **Hoist on reuse** (2+ features or global routes):
   - UI → `components/button/`, `components/dialog/`, `components/layout/`, etc.
   - Shared schemas → `lib/schema/common.ts`
   - Shared hooks → `hooks/`
   - Shared constants → `constant/`
   - Shared utils → `lib/util/`
   - Shared models → `types/`
4. **Keep pages thin**: `app/<feature>/page.tsx` only composes the feature entry export.
