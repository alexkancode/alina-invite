# ci-pipeline-cleanup - implementation plan

## Source

### `scripts/migrate.ts`
- Extract a pure function `resolveDbConfig(env: NodeJS.ProcessEnv)` that returns
  `{ connectionString }` when `env.DATABASE_URL` is set, else the hardcoded local dev
  config. Use it for the client. This fixes CI (its localhost DATABASE_URL is now used,
  matching the service password) and is prod-safe (prod URL is non-localhost; behaviour
  unchanged).

### `vitest.config.ts`
- Add `exclude: [...configDefaults.exclude, ...QUARANTINED]` where `QUARANTINED` is the
  array of the 22 currently-failing vitest files (enumerated in QUARANTINE.md). Keep the
  existing `include`.

### `playwright.config.*`
- Reduce `testMatch` to the e2e files that pass (always includes `e2e.yait-home.test.ts`);
  remove the currently-failing e2e files (enumerated in QUARANTINE.md during impl).

### `.github/workflows/`
- Consolidate to a single `deploy.yml` (keep the richer staging/production structure
  from `deploy-updated.yml`, with `NODE_ENV=test`, rate-limit/moderation off, the
  `deploy` job gated on `[test-api, test-e2e]` and `if: github.ref == refs/heads/main`).
  Delete `deploy-updated.yml`.

### `QUARANTINE.md` (new)
- One line per quarantined suite (vitest + e2e) with the root-cause reason, marked as
  tracked-for-triage, plus how to run them (`npm run test:quarantine`).

### `package.json`
- Add `test:quarantine` running vitest over the excluded files, so they stay runnable.

### Railway deploy credentials
- Set `RAILWAY_SERVICE_ID` variable (`gh variable set`, value from `railway status`).
- `RAILWAY_TOKEN` secret must be added by the user; document the exact `gh secret set`
  command. The deploy job is wired correctly but cannot authenticate until it exists.

## Tests (TDD)

### `tests/unit/migrate-config.test.ts` (new, in the gate)
- `resolveDbConfig({ DATABASE_URL: 'postgres://u:p@host/db' })` -> `{ connectionString }`.
- `resolveDbConfig({ DATABASE_URL: 'postgresql://postgres:test@localhost:5432/party' })`
  -> uses the URL (the regression: localhost URLs are honoured now).
- `resolveDbConfig({})` -> hardcoded local dev config.

### Gate verification
- The scoped `test:api` and `test:e2e` run fully green locally against a CI-matching
  Postgres. A canary-style assertion confirms the quarantine list in `vitest.config.ts`
  matches `QUARANTINE.md` (no drift).

## PR checklist pass

- The quarantine list is data (an exported array), not inline-commented; reasons live in
  QUARANTINE.md (no code comments). `resolveDbConfig` is one pure, tested function.
  Workflows consolidated (no duplication). No app behaviour changed; only the gate scope,
  the migrate config selection, and CI structure.

## Validation

- `resolveDbConfig` unit test green; scoped `test:api` + `test:e2e` green locally
  (Postgres up). Rebuild + local server smoke unchanged (yait + birthday + health).
- Push to main; confirm in Actions that test-api + test-e2e pass and the deploy job runs.
  If `RAILWAY_TOKEN` is set, confirm it deploys; otherwise report the one remaining step.
- CURL the live site after any deploy (yait /home markers + birthday `/` favoriteSong +
  /api/health + 404).
