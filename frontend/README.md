# SalonDesk frontend

Next.js 16 App Router — client, merchant, and admin portals for the SalonDesk demo.

## Quick start

From repo root, see **[../Readme.md](../Readme.md)** for database, backend API, and env setup.

```bash
cd frontend
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). API default: `http://127.0.0.1:8000`.

## Scripts

| Command                     | Description                    |
| --------------------------- | ------------------------------ |
| `pnpm dev`                  | Development server             |
| `pnpm build` / `pnpm start` | Production build / serve       |
| `pnpm validate`             | Prettier + ESLint + TypeScript |
| `pnpm typecheck`            | `tsc --noEmit` only            |

## Agent & code conventions

**[AGENTS.md](./AGENTS.md)** is the source of truth for folder layout, Redux/RTK Query, portal routes, PascalCase client components, and hoisting rules.

Monorepo-wide backend layout and API prefixes: **[../AGENTS.md](../AGENTS.md)**.

## Stack (high level)

- **Routing**: App Router under `app/`; `middleware.ts` rewrites `/org` → `/merchant`.
- **State**: Redux Toolkit + RTK Query (`store/`); sandbox demo data in `*DemoSlice.ts`.
- **Styling**: Tailwind + shared `components/ui`.
- **Auth**: JWT in localStorage; `(auth)/login` and portal auth modals.

Do not add i18n — English-only UI copy.
