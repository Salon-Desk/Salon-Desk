import path from 'node:path'

const frontendRel = (files) =>
  files.map((file) => path.relative('frontend', file)).filter(Boolean)

const backendRel = (files) =>
  files.map((file) => path.relative('backend', file)).filter(Boolean)

export default {
  'frontend/**/*.{js,jsx,ts,tsx,mjs}': (files) => {
    const rel = frontendRel(files)
    if (!rel.length) return []
    const joined = rel.map((f) => `"${f}"`).join(' ')
    return [
      `pnpm --dir frontend exec eslint --max-warnings=0 --fix ${joined}`,
      `pnpm --dir frontend exec prettier --write ${joined}`,
    ]
  },
  'frontend/**/*.{json,md,css,yml,yaml}': (files) => {
    const rel = frontendRel(files)
    if (!rel.length) return []
    const joined = rel.map((f) => `"${f}"`).join(' ')
    return [`pnpm --dir frontend exec prettier --write ${joined}`]
  },
  'backend/**/*.py': (files) => {
    const rel = backendRel(files)
    if (!rel.length) return []
    const joined = rel.map((f) => `"${f}"`).join(' ')
    return [
      `cd backend && uv run ruff check --fix ${joined}`,
      `cd backend && uv run ruff format ${joined}`,
    ]
  },
  'backend/pyproject.toml': () => [
    'cd backend && uv run ruff check .',
    'cd backend && uv run ruff format --check .',
  ],
}
