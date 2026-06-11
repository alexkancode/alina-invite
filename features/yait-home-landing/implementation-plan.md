# yait-home-landing — implementation plan

## Goals and guardrails

- New route `/home` introducing the yait brand: riviera-poster coastline, envelope
  sailing into the dock revealing "You Are Invited To" in Shrikhand, fry people
  bouncing on arrival, "join the yait club" tagline and signup CTA.
- The live first-birthday site is untouchable: no edits to `index.astro`,
  `global.css`, any API route, or the database. No migrations. The only shared file
  touched is `playwright.config.ts` (additive testMatch entry).
- The page is the product demo: compositor-only animation, zero JS for the intro,
  prefers-reduced-motion fallback, static delivery.

## Architecture decisions

1. **`src/pages/home.astro` with `export const prerender = true`.** Astro renders it
   to static HTML at build time; serving it never touches Postgres. If the database
   is down, `/home` still serves. Zero crash surface added to the live site.
2. **`src/styles/yait.css` as an independent stylesheet** (own `@import "tailwindcss"`
   and `@theme` with yait palette tokens). Deliberately not importing `global.css`:
   the disco theme and yait theme stay uncoupled, so neither page can regress the
   other's styling. The phi spacing scale in global.css is not reused for the same
   reason; yait defines its own minimal spacing tokens.
3. **Pure-CSS, time-based animation.** The entire intro is `@keyframes` on
   `transform`/`opacity` with `animation-delay` choreography — no JS, no scroll
   handlers, nothing to break. Per the agreed technique research: mask reveal moved
   by transform, staggered shared keyframes for the crowd.
4. **Scene config as data, in `src/lib/yait/heroScene.ts`.** All numbers that define
   the scene — fry crowd parameters, stagger delays, timeline constants — are pure
   functions/constants with exported types. The Astro component only maps config to
   markup; every behavior-bearing number is unit-testable without a browser.
5. **Per-fry variation binds through CSS custom properties** (`--fry-delay`,
   `--fry-h`, `--fry-hue`) set on each fry element — the data-binding pattern this
   repo already established with `--album-art` on guest cards. Visual rules live
   exclusively in yait.css.

## Files

### New

| File | Purpose |
|---|---|
| `src/pages/home.astro` | Route shell: head (Shrikhand + Poppins fonts, meta), imports yait.css, composes HeroBay + JoinClubCta |
| `src/styles/yait.css` | Palette tokens, layout rules, all `@keyframes` (sail, word reveal, dock settle, bob, fry bounce, cta rise), reduced-motion block |
| `src/components/yait/HeroBay.astro` | Inline SVG scene: sky band, sun, sea, headland, dock; envelope group (body, flap, wax seal, wake) containing the fry crowd; headline words as mask-revealed spans |
| `src/components/yait/JoinClubCta.astro` | "join the yait club" tagline, CTA button anchoring the future signup form |
| `src/lib/yait/heroScene.ts` | `buildFryCrowd(count, seed)`, `staggerDelays(count, baseMs, stepMs)`, `SCENE_TIMELINE` constants, exported `FryConfig`/`SceneTimeline` types, seeded PRNG (no `Math.random` so output is deterministic and testable) |

### Modified

| File | Change |
|---|---|
| `playwright.config.ts` | Append `e2e.yait-home.test.ts` to testMatch (additive) |

## Scene specification

- Palette tokens from the agreed inspo: `--yait-sky #F9C784`, `--yait-sun #F4A259`,
  `--yait-coral #E76F51`, `--yait-sea #2A9D8F`, `--yait-ink #264653`,
  `--yait-sand #F4E8D1`. Coral stays scarce: wax seal, flag, CTA only.
- Timeline (from `SCENE_TIMELINE`, single source of truth): envelope sails 0–5s
  (translateX with gentle rotate bob), headline words reveal at 1s/2s/3s/4s as the
  envelope passes (clip reveal moved by transform, per-word `animation-delay`),
  dock settle 5–6s (anticipation dip), fry bounce ripple starts at 6s (staggered
  delays from `staggerDelays`), tagline/CTA rise at 6s, envelope idle bob loops
  thereafter.
- Fry crowd: 9 fries, one rounded-rect silhouette, varied only in height, hue
  (within sand/coral/teal family), and face; packed in two overlapping rows inside
  the envelope. Each gets `--fry-delay` (negative values allowed so idle leans start
  mid-cycle) and bounce amplitude class.
- Grain: single SVG `feTurbulence` filter overlay at low opacity on the scene
  container — static, applied once, never animated (filters are paint-expensive).
- `prefers-reduced-motion: reduce`: every animation is disabled via one media-query
  block; the scene's resting state (defined by the keyframes' end values being the
  default property values) shows the envelope docked, headline fully visible, fries
  still. Large viewport traversal is exactly the WCAG vestibular-trigger category.
- Mobile: the bay scales with viewport units; headline wraps to two lines below
  640px; fry count unchanged.

## TDD plan (tests first, watch them fail, then implement)

### Unit — `tests/unit/yait/hero-scene.test.ts`

- `buildFryCrowd(9, seed)` returns 9 fries; same seed → identical output; different
  seeds → different hue/height mixes.
- Every fry's height, hue, and delay falls within the documented bounds.
- `staggerDelays` is monotonically increasing, starts at baseMs, total spread under
  the ripple budget.
- `SCENE_TIMELINE` invariants: last headline word reveals before dock settle ends;
  bounce start equals dock settle end; all durations positive.

### Canary — `tests/canary/yait-scene.canary.ts`

- Locks the `FryConfig` contract the component consumes: constructs the exact object
  shape `HeroBay.astro` maps to markup and asserts every field `buildFryCrowd`
  emits is present with the right type — same pattern as `rsvp-payload.canary.ts`.

### Integration — `tests/integration/home-page.test.ts` (against running server)

- `GET /home` → 200, content-type html.
- Body contains the four headline words, exactly 9 fry elements, the tagline, and
  the CTA.
- Regression guard for the live site: `GET /` → 200 and still contains the RSVP
  form marker; `GET /api/health` → 200.

### E2E — `tests/e2e.yait-home.test.ts` (Playwright)

- Page loads; envelope and all fries visible.
- After the timeline duration, all four headline words have opacity 1 / are in
  viewport.
- `page.emulateMedia({ reducedMotion: 'reduce' })`: headline fully visible
  immediately, no traversal.
- Screenshot at 0s, 3s (mid-sail), and 7s (docked, bouncing) for visual review.

## Local validation

1. `pkill` the local server, `npm run build`, restart via
   `(npm run start:dev > /tmp/rsvp-server.log 2>&1 &)`.
2. Curl smoke tests:
   - Happy: `GET /home` 200 and greps for `You`, `Are`, `Invited`, `To`, fry count,
     `join the yait club`, Shrikhand font link.
   - Unhappy: `GET /home/` and `GET /HOME` behavior recorded; `GET /homex` 404;
     `/home` served with DB container stopped (proves prerender isolation), then DB
     restarted and `/api/health` reconfirmed 200.
   - Regression: `GET /` 200 with RSVP markers, byte-size within expected range.
3. Browser review at 1280px and 390px: gnome-screenshot at mid-sail and docked
   states; check palette proportions (cream/sky dominant, coral scarce), envelope
   scale relative to bay, headline chunk weight, fry packing density.
4. `curl -s localhost:4321/home | grep` chunks to inspect how scene layers nest.

## Deploy

1. Commit grammar: `yait-home-landing plan` (feature.md, inspo.md, diagrams,
   this plan), then `yait-home-landing implementation`.
2. Pre-deploy: `DEPLOYMENT_FORENSICS.md` entry, `BEFORE=$(curl -s -o /dev/null -w
   "%{http_code}" https://yait.social/home)` — expected 404.
3. `npm run party:deploy`; cutover sentinel: `/home` transitions 404 → 200 with the
   headline marker present; poll in background task, report measured cutover.
4. Post-deploy: prod curl suite (same as local), Playwright prod screenshot pass,
   `/` regression check, Railway logs clean; forensics results commit.

## PR checklist pass

| Check | Status in this plan |
|---|---|
| Utility function in a file where it doesn't belong | `heroScene.ts` is a new single-purpose module under `lib/yait/`; nothing bolted onto existing files |
| Inline styles instead of style rules | All rules in yait.css; per-fry variation via custom-property data binding (established `--album-art` pattern); no `style="..."` layout/visual rules |
| Duplicated utility functions | Repo greps found one near-miss: `gameIntegration.ts:393` has an inline time-seeded LCG closure inside its tile-shuffle function. It is not an exported utility, and extracting it would modify live game code, which the isolation guardrail forbids. yait's PRNG is therefore a new, exported, deterministic function in `lib/yait/`; consolidation is deferred until the game code is otherwise being touched. No stagger or delay helpers exist (index.astro hardcodes per-sparkle delays inline) |
| Duplicated style rules | yait.css is a deliberately isolated theme (decision 2); it shares no selectors with global.css and redefines no disco tokens |
| Testable, interfaces where appropriate | All behavior-bearing values flow through exported, typed pure functions; component is a dumb map of config to markup |
| Single-purpose succinct functions | `buildFryCrowd`, `staggerDelays`, PRNG are each one job; timeline is data, not logic |
| Comments | None will be added |
| Full unit + integration tests | Unit, canary, integration, e2e enumerated above; failure-first order |

## Open risks

- Shrikhand at hero size with a moving clip reveal needs visual confirmation that
  the italic lean doesn't clip awkwardly at word boundaries — checked at the
  screenshot step, fallback is per-word fade-rise (no clip).
- `prerender = true` interaction with the Node adapter is asserted by the
  DB-stopped curl test rather than assumed.
- The gantt diagram in feature.md uses second-granularity which mermaid renders
  loosely; it is illustrative, `SCENE_TIMELINE` in code is the source of truth.
