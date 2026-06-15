# Deployment Forensics - yait Beach Clouds, Bigger Headline, Static-Text Reveal + Echo

## Deployment Details

**Date:** 2026-06-14
**Service:** party-app (Railway, project invites-photo-system, environment: production)
**Live target:** https://yait.social/home
**Method:** Direct Railway deploy (`npm run party:deploy` = astro build + `railway up --detach`)
**Railway deployment id:** b1a21434-179a-4e94-9385-c61f02bede20
**Commits deployed:** 69 commits ahead of the prior origin/main (the full session of
cloud, headline, reveal, and drift work), pushed to origin/main at a17ec45.

## Why a direct Railway deploy (not the CI gate)

The configured CI deploy (`.github/workflows/deploy.yml` and `deploy-updated.yml`,
`on: push: branches: [main]`) cannot deploy: both `test-api` and `test-e2e` fail at the
`npm run migrate` step with `password authentication failed for user "postgres"`, so the
`deploy` job is skipped. Root cause (pre-existing, not from this work):
`scripts/migrate.ts` uses `DATABASE_URL` only when it does NOT contain `localhost`; CI's
`DATABASE_URL` is `postgresql://postgres:test@localhost:5432/party`, so migrate falls
back to a hardcoded `password: 'dev'` while the CI Postgres service password is `test`.
The 2026-06-12 run failed identically - the CI gate has never passed. Additional
pre-existing, unrelated failures exist (migration-validation tests, the
database-config-consistency rule, eslint autofix tests, and the Postgres-dependent
suites). Repairing CI is tracked as a separate effort; prod was shipped directly via
Railway, which is how prior deploys actually happened.

## Changes Deployed (high level)

1. Removed the old procedural sunset clouds; rebuilt the hero sky from a pixel trace of
   a beach reference into three tone layers (shadow/mid/cream), smoothed to beziers.
2. Split the biggest cloud into its own group drifting 10% faster (72s vs 80s); the
   whole cloud field drifts left-to-right ~200px at constant (linear) velocity with a
   staggered per-tone parallax, plus a displacement-warp and gentle layered breathing.
3. Sky recoloured to the cyan beach palette.
4. Headline enlarged on desktop: `--headline-fs: clamp(2.8rem, 12vw, 10.5rem)`.
5. Reveal re-architected so the headline text element carries ZERO animation: the wave
   sweep moved onto the clip aperture (SMIL translate from REVEAL_EDGE) over static text.
6. Added a mirrored decorative echo of the reveal wave (vertically flipped, semi-
   transparent white ~5px ~45% stroke) that reveals nothing and animates in sync.

## Pre-flight validation (local)

- All yait tests green: unit + canary 101, integration 21, e2e 26.
- Fixed one in-domain regression the pre-flight caught: `yait-scene.canary.ts` still
  asserted the old SCENE_TIMELINE (5000/1000/6000); updated to the current
  4444/889/5333 (a17ec45).
- Full `test:api` locally shows 116 failures, all non-yait and environment-dependent
  (no local Postgres) - zero yait files among them.

## Post-deploy verification (live, https://yait.social)

- `/home` 200; rendered HTML carries `reveal-echo`, `reveal-echo-line`, 6 `cloud-drift`
  groups including `cloud-drift-hero-{shadow,mid,cream}`, 6 `cloud-layer` paths, cyan
  `#34BBD0` present and old amber `#F9C784` gone, two `type="translate"` sweeps (clip +
  echo).
- Bundled CSS (`/_astro/home.*.css`) carries `clamp(2.8rem, 12vw, 10.5rem)`,
  `reveal-echo-line` `stroke-opacity:.45` `stroke-width:5px`, and the hero `72s` drift.
- Regression intact: `/` (birthday) 200 with `name="favoriteSong"`; `/api/health`
  `{"status":"ok"}`; `/homex` 404.
- Live screenshot at SMIL t=6.5s shows the enlarged "You Are / Invited To" headline
  fully revealed over the cyan beach sky with clouds and sun.

## Follow-ups

- Repair the CI deploy gate (migrate `DATABASE_URL` handling + the other pre-existing
  test failures) so pushes can test and deploy automatically again.
- Mobile reveal tracking is approximate (the SMIL clip sweep uses desktop REVEAL_EDGE
  values; SMIL cannot be media-queried).
