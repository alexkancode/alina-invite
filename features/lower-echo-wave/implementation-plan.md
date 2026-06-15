# lower-echo-wave - implementation plan

## Source

### `src/styles/yait.css`
- `.reveal-echo`: add `transform: translateY(100%)` (drop down by its own height). No
  other change; the existing `position: absolute` + `.yait-main { overflow: hidden }`
  already guarantee no scroll and clip the off-screen part.

## Tests (TDD)

### `tests/canary/sail-keyframes.canary.ts`
- The `.reveal-echo` rule contains `transform: translateY(100%)`.

### `tests/e2e.yait-home.test.ts`
- The `.reveal-echo-line` bounding box top is now below the `.headline` bounding box
  bottom (it dropped beneath the headline).
- The page introduces no scroll: `document.documentElement.scrollWidth <= clientWidth`
  and `scrollHeight <= window.innerHeight` (within a 1px tolerance).

## PR checklist pass

- One CSS rule, single purpose, no inline styles, no comments, no duplication. Scroll
  safety reuses the existing `.yait-main` overflow clip rather than adding a redundant
  rule. Pinned by canary (CSS) + e2e (position + no-scroll).

## Validation

- `npx vitest run tests/canary/sail-keyframes.canary.ts` green; rebuild; e2e green.
- Take down server, rebuild, redeploy locally; screenshot the hero and confirm the
  wiggling line sits lower (below the headline) and nothing scrolls. CURL `/home`
  (echo still present), `/` (`favoriteSong`), `/api/health` 200, `/homex` 404.
