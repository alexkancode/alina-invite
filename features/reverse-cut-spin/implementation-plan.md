# reverse-cut-spin - implementation plan

## Source (`src/components/yait/HeroBay.astro`)

In the clip `<animateTransform type="rotate">`, flip the peak angle sign:
`values="0 0.5 0.5; 15 0.5 0.5; 0 0.5 0.5; 15 0.5 0.5; 0 0.5 0.5"` ->
`values="0 0.5 0.5; -15 0.5 0.5; 0 0.5 0.5; -15 0.5 0.5; 0 0.5 0.5"`.

Center (0.5 0.5), `keyTimes`, `dur`, `fill`, easing all unchanged.

## Tests

- `tests/integration/home-page.test.ts`: the cut-line test asserts the `values`
  contain the `-15 0.5 0.5` peaks (was `15 0.5 0.5`); other attrs unchanged.
- `tests/e2e.yait-home.test.ts`: the existing cut-line test (rotate node present,
  revealed glyph byte-stable) still holds; re-run.

## PR checklist pass

- One attribute value flips; no new code, inline styles, duplication, or comments.

## Validation

- `npx vitest run` in-scope green; `npx playwright test e2e.yait-home.test.ts` green.
- Local rebuild + redeploy; CURL confirms the clip carries `-15 0.5 0.5` and no
  `15 0.5 0.5` positive peak; 404 and `/api/health` 200.
- Read the clip's animated rotate at a beat via SMIL setCurrentTime and confirm -15
  degrees. To validate reverse-cut-spin I can capture the reveal at a beat and confirm
  the cut line tilts the opposite way while the letters stay put.
