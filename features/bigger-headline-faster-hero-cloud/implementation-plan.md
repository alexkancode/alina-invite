# bigger-headline-faster-hero-cloud - implementation plan

## Source

### `src/styles/yait.css`
- `.headline-mask`: `--headline-fs: clamp(2.8rem, 11vw, 8.5rem)` -> `clamp(2.8rem, 12vw, 10.5rem)`.
- Add hero drift rules (reuse existing keyframes at 72s = 10% faster):
  - `.cloud-drift-hero-shadow { animation: drift-shadow 72s linear infinite alternate; }`
  - `.cloud-drift-hero-mid { animation: drift-mid 72s linear infinite alternate; }`
  - `.cloud-drift-hero-cream { animation: drift-cream 72s linear infinite alternate; }`

### tracer (`/tmp/cloud-sample/trace.py`) + `src/lib/yait/cloudArt.ts`
- Add `components(unionMask)` (iterative flood fill) returning the biggest component's bbox.
- Split each tone's loops into `hero` / `rest` by simplified-loop centroid in that bbox.
- Emit `CLOUD_ART` with `CloudArtLayer { tone; group: 'rest' | 'hero'; d }`, six entries,
  ordered shadow(rest,hero), mid(rest,hero), cream(rest,hero).

### `src/components/yait/HeroBay.astro`
- Render each layer in its own group:
  `<g class={`cloud-drift cloud-drift-${l.group === 'hero' ? 'hero-' : ''}${l.tone}`} filter="url(#yait-cloud-warp)"><path class={`cloud-layer cloud-${l.tone}`} d={l.d}/></g>`.

## Tests (TDD)

### `tests/unit/yait/cloud-art.test.ts`
- Six layers; every `(tone, group)` of {shadow,mid,cream} x {rest,hero} present exactly once;
  each `d` is a closed bezier (`C`, no ` L `); deterministic. Hero layers are non-empty.

### `tests/canary/sail-keyframes.canary.ts`
- The headline clamp assertions use the new `clamp(2.8rem, 12vw, 10.5rem)`.
- Linear-drift test: rest `.cloud-drift-{shadow,mid,cream}` are `80s linear`; hero
  `.cloud-drift-hero-{...}` are `72s linear`. Parallax/min-range tests unchanged.

### `tests/integration/home-page.test.ts`
- Six `cloud-layer` paths and six `cloud-drift` groups, each carrying the warp filter;
  `cloud-drift-hero-shadow/mid/cream` present.

### `tests/e2e.yait-home.test.ts`
- Headline: a desktop `.headline` font-size at 1200px viewport is larger than before
  (e.g. >= 140px).
- Hero faster: `getComputedStyle('.cloud-drift-hero-shadow').animationDuration` < that of
  `.cloud-drift-shadow` (72s < 80s). Keep the existing parallax + reduced-motion tests.

## PR checklist pass

- Split logic lives in the tracer (data generator); component grouping is one purpose.
  Hero drift reuses existing keyframes (no duplication), only the duration differs.
  No inline styles, no comments. Six-layer contract pinned by unit; speed by canary + e2e.

## Validation

- `npx vitest run tests/unit tests/canary` green; rebuild; integration green; e2e green.
- Take down server, rebuild, redeploy.
- CURL `/home`: six cloud-drift groups incl `cloud-drift-hero-*`, each warp-filtered;
  headline clamp present. `/` (`favoriteSong`), `/api/health` 200, `/homex` 404.
- Screenshot desktop hero: bigger headline, two clean lines; over time the biggest cloud
  visibly leads the others. To validate I can seek the SVG and sample hero vs rest drift
  translate at equal times and confirm the hero is further along (faster).
