# ci-pipeline-cleanup

## Verbatim request (2026-06-14)

> Please go ahead and take on cleaning up the CI pipeline
> [confirmed: full green gate; consolidate to one workflow; on finding ~115 pre-existing
> failures across ~33 files, chosen: meaningful gate + quarantine]

## Findings (investigation)

- The CI deploy (`deploy.yml` + `deploy-updated.yml`, both `on: push: branches:[main]`)
  has NEVER passed. Both fail at `npm run migrate`:
  `scripts/migrate.ts` only uses `DATABASE_URL` when it does NOT contain `localhost`, so
  CI's `postgresql://postgres:test@localhost:5432/party` is ignored and it connects with
  a hardcoded `password: 'dev'` against a `test` service.
- Even with Postgres connected, ~115 tests across ~22 vitest files (plus several e2e
  files) fail for independent, pre-existing reasons unrelated to the deployable app:
  spotify mocks return undefined, adminApiClient Zod mismatches, calendar tests import a
  deleted source file (`platformDetectionService.js`), feature-flag skill assertions
  drifted, leaderboard returns 201 vs 200, malformed test harnesses (CommonJS vs ESM,
  non-vitest runners), a stale migration-validation expectation, and an eslint `--config`
  path pointing at the old `.eslintrc.js`.
- Two deploy workflows both fire on push (double deploy). `deploy-updated.yml` is the
  richer one (staging on PR, production on main, environments, DB backup step).
- `RAILWAY_TOKEN` secret and `RAILWAY_SERVICE_ID` variable are NOT configured, so the
  deploy job cannot authenticate to Railway even with a green gate.

## Decision

Make the gate meaningful and green by fixing the real blocker and quarantining the
pre-existing broken suites (tracked, not deleted), rather than repairing ~115 unrelated
tests. Consolidate to one workflow.

1. Fix `scripts/migrate.ts` to prefer `DATABASE_URL` whenever set (extract a pure,
   testable `resolveDbConfig`). Prod is unaffected (its URL is non-localhost either way).
2. Quarantine the currently-failing vitest files via `vitest.config.ts` `exclude`, and
   the currently-failing e2e files via the Playwright `testMatch`, so the gate runs the
   passing remainder (which includes all yait tests and the birthday regression guard).
3. `QUARANTINE.md` lists every quarantined suite with a one-line reason, tracked for
   separate triage.
4. Consolidate to a single `deploy.yml` (delete `deploy-updated.yml`); one deploy per
   push to main.
5. Set the `RAILWAY_SERVICE_ID` variable; document that the user must add the
   `RAILWAY_TOKEN` secret for the deploy job to authenticate.

```mermaid
flowchart TD
    P["push to main"]:::ev --> T1["test-api (vitest, quarantine excluded)"]:::job
    P --> T2["test-e2e (playwright, quarantine excluded)"]:::job
    T1 --> G{both green?}:::dec
    T2 --> G
    G -->|yes| D["deploy (railway up, needs RAILWAY_TOKEN)"]:::deploy
    G -->|no| X["no deploy"]:::stop
    M["migrate.ts: prefer DATABASE_URL"]:::fix --> T1
    M --> T2
    Q["QUARANTINE.md (tracked backlog)"]:::doc -.-> T1
    classDef ev fill:#264653,stroke:#264653,color:#fff
    classDef job fill:#F4A259,stroke:#264653,color:#264653
    classDef dec fill:#FBE3BC,stroke:#264653,color:#264653
    classDef deploy fill:#2A9D8F,stroke:#264653,color:#fff
    classDef stop fill:#E76F51,stroke:#264653,color:#fff
    classDef fix fill:#A9D9CE,stroke:#264653,color:#264653
    classDef doc fill:#CDEAE0,stroke:#264653,color:#264653
```

## Out of scope

Repairing the quarantined suites' actual logic (separate triage), and the app features
they cover. The yait scene and the birthday regression guard remain in the gate.

## Validation

To validate ci-pipeline-cleanup I can run the scoped `test:api` and `test:e2e` locally
against a CI-matching Postgres and confirm both are green; unit-test `resolveDbConfig`
for the DATABASE_URL selection; push to main and confirm test-api + test-e2e go green in
Actions and the deploy job runs (it will need `RAILWAY_TOKEN`); and confirm
`QUARANTINE.md` enumerates exactly the excluded suites.
