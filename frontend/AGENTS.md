<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Shega Store Agent — agent guide

Next.js 16 App Router agent dashboard (customers, RFQs, commissions). Package manager: **pnpm**. Path alias: **`@/*`** → repo root (`tsconfig.json`).

## Commands

| Script                            | Purpose                             |
| --------------------------------- | ----------------------------------- |
| `pnpm dev`                        | Dev server (Next default port)      |
| `pnpm build` / `pnpm start`       | Production                          |
| `pnpm validate`                   | `prettier --check` + ESLint + `tsc` |
| `pnpm lint` / `pnpm lint:fix`     | ESLint (`--max-warnings=0`)         |
| `pnpm format` / `pnpm format:fix` | Prettier check / write              |
| `pnpm typecheck`                  | `tsc --noEmit`                      |

Pre-commit (Husky): `lint-staged` → full format check → lint → typecheck → build. Match `.prettierrc` (2 spaces, LF, single quotes, **no semicolons**, printWidth 100).

## Repository layout

```
app/                 App Router: layout, page, ClientWrapper, InnerWrapper, globals.css
  (private)/         Authenticated agent shell + feature routes (dashboard, customers, commissions, …)
components/
  ui/                shadcn/base-nova primitives (do not duplicate)
  forms/             Shared React Hook Form fields (RHF*), pickers, upload
  layout/            Shared private-shell chrome + `_localization` for sidebar/header
  button|dialog|drawer|empty|loader|table|tab/   Shared cross-feature reusable UI
constant/            App constants (`variables`, table, toast colors)
hooks/               Shared client hooks
lib/
  i18n/              Locales, dictionaries, LocaleProvider, server locale
  util/              Pure helpers
  utils.ts           cn() and shared class helpers
store/               Prefer Redux Toolkit + RTK Query here when adding APIs (may be empty today)
types/               Shared TypeScript types (incl. TranslationKey)
public/              Static assets
```

- **New UI**: prefer `components/ui` + `cn` from `@/lib/utils`. Add shadcn via `pnpm dlx shadcn@latest add …` (see `components.json` aliases).
- **Forms**: wrap with `FormProvider`, use existing `RHF*` components under `components/forms`.
- **Global vs feature UI**: reuse **global** building blocks (`ui/`, `forms/`, `button/`, `dialog/`, `loader/`, `layout/` for shared shell) anywhere in the app. When a component, utility, constant, or hook is reused across 2 or more features, hoist it to the appropriate global directory.
- **Feature isolation**: keep private feature trees under `app/(private)/<feature>/` self-contained with underscore-prefixed folders. Do not copy generic form primitives, buttons, or shadcn wrappers into feature folders.
- **API**: when introducing HTTP, prefer RTK endpoints in `store/` and a shared axios client; env via `NEXT_PUBLIC_*`.
- **Do not** add business logic under `app/` beyond routing and thin page composition.

## App shell

- `app/layout.tsx`: server layout, `getServerLocale()`, wraps children in **`ClientWrapper`**, sets `html lang={initialLocale}`.
- **`ClientWrapper`**: `LocaleProvider`, Sonner toaster, **`InnerWrapper`**.
- **`InnerWrapper`**: pass-through today; reserved for auth bootstrap / realtime later—keep file, avoid extra providers unless needed.
- Private chrome: `app/(private)/layout.tsx` composes `components/layout` (sidebar/header); shared strings in `components/layout/_localization`.

## Localization (`lib/i18n`)

Supported locales: **`en`**, **`am`** (`lib/i18n/locale.ts`).

Dictionary assembly: `lib/i18n/dictionaries/en.ts` & `am.ts` import JSON and export a single `as const` tree. **Current scope (store agent):**

| Namespace           | Files                                                  | Use                                     |
| ------------------- | ------------------------------------------------------ | --------------------------------------- |
| `pages.layout`      | `components/layout/_localization/{en,am}.json`         | Sidebar / header / logout copy          |
| `pages.dashboard`   | `app/(private)/dashboard/_localization/{en,am}.json`   | Dashboard                               |
| `pages.customers`   | `app/(private)/customers/_localization/{en,am}.json`   | Customers                               |
| `pages.commissions` | `app/(private)/commissions/_localization/{en,am}.json` | Commissions                             |
| `pages.not-found`   | `dictionaries/pages/not-found/*.json`                  | 404                                     |
| `validation`        | `dictionaries/validation/*.json`                       | Zod / form messages                     |
| `common`            | `dictionaries/common/*.json`                           | Shared UI (forms, table, pagination, …) |
| `metadata`          | `dictionaries/metadata/*.json`                         | SEO / titles                            |

- Add strings: update **both** `en` and `am` JSON, register imports in `en.ts` / `am.ts`, use typed keys via `TranslationKey` / `useTranslation()` / `clientTranslate()`.
- Server: `getServerLocale()` (`lib/i18n/server.ts`). Client: `LocaleProvider`, cookie + `localStorage` persistence (`persistClientLocale`).
- Do **not** re-add removed page namespaces without product need; keep dictionaries lean for this app.

## TypeScript & quality

- Strict mode; prefer explicit types in `types/` for domain models.
- ESLint: flat config `eslint.config.mjs` (Next core-web-vitals + import sort + unused imports).
- Empty interfaces extending another type → use `type` aliases.
- Zod v4 APIs (see `lib/schema/common.ts` for patterns).

## IDE / extensions

Use project Prettier from `node_modules`. Match `.prettierrc` and EditorConfig if present.

## Global reusable components (`components/`)

These folders are **app-wide**—import them from any route or feature:

| Area               | Path                                      | Use                                                              |
| ------------------ | ----------------------------------------- | ---------------------------------------------------------------- |
| Primitives         | `components/ui/`                          | Buttons, inputs, dialogs, tables—shadcn/base-nova                |
| Forms              | `components/forms/`                       | `RHF*`, `FormProvider`, pickers, file upload                     |
| Actions & feedback | `components/button/`, `loader/`, `empty/` | `PrimaryButton`, loading spinners, skeletons, empty/error states |
| Overlays & dialogs | `components/dialog/`, `drawer/`, `table/` | `CustomResponsiveDialog`, modal dialogs, drawers, pagination     |
| Tabs               | `components/tab/`                         | Shared tab patterns                                              |
| App shell          | `components/layout/`                      | Shared private-shell chrome + localization for sidebar/header    |

## Feature layout standard (`app/(private)/<feature>/`)

Every major agent feature (`dashboard`, `customers`, `commissions`, RFQs, etc.) strictly adheres to **underscore-prefixed internal folders**:

| Folder           | Purpose                                                                   |
| ---------------- | ------------------------------------------------------------------------- |
| `_components/`   | Feature-internal React UI components; composed in the route page          |
| `_constants/`    | Feature-specific default state, seeds, and static local config            |
| `_hooks/`        | Feature-specific custom React hooks                                       |
| `_libs/`         | Feature-specific getters, transformers, and data helpers                  |
| `_localization/` | Feature `en.json` / `am.json` translation dictionaries                    |
| `_schemas/`      | Feature-specific Zod validation schemas (uses `@/lib/schema/common`)      |
| `_types/`        | Feature-local TypeScript interfaces and types                             |
| `_utils/`        | Pure helper functions scoped exclusively to this feature                  |
| `index.ts`       | Public API barrel exporting entry components, hooks, constants, and types |

### Hoisting & Schema Rules (Local Feature vs Global)

1. **Private by default**: All code starts inside the feature's underscore folders.
2. **Validation schemas in `_schemas/`**:
   - Feature form schemas must live in `_schemas/` (not inline inside component files).
   - Reuse common field validators and primitives from `@/lib/schema/common.ts`.
   - All validation error messages must be localized via `constant/validation-messages.ts` and `lib/i18n/dictionaries/validation/`.
3. **Hoist on reuse**: When a component, utility, hook, validator, or constant is needed by 2+ features or global routes, hoist it:
   - UI components / dialogs / buttons → `components/button/`, `components/dialog/`, `components/layout/`, etc.
   - Shared field validators & schemas → `lib/schema/common.ts`
   - Shared hooks → `hooks/`
   - Shared constants → `constant/`
   - Shared utility functions → `lib/util/`
   - Shared data contracts / models → `types/`
4. **Keep pages thin**: `app/(private)/…/page.tsx` should compose feature UI, not own large business logic.

## Related agent rules

File-scoped Cursor rules live in `.cursor/rules/` (i18n, components, features, store, lib). Prefer those when editing matching paths.
