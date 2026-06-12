# larger-headline

## Verbatim request (2026-06-12)

> can we make the text elements even larger?

## Confirmed understanding

The headline grows about 30 percent on desktop: `--headline-fs` becomes
`clamp(2.8rem, 11vw, 8.5rem)` (roughly 106px to 136px at the 1280 reference). The
mobile floor rises only slightly (2.6rem to 2.8rem) so "Invited To" with its 100px
indent still fits a 390px screen. The wave-clip geometry rederives from the taller
line box: maskH and slantPx become 185 (the 45 degrees holds), five periods keep
the ~50px wavelength, amplitude and the 537ms independent delay unchanged.

## Plan

1. CSS: the one `--headline-fs` token changes (canary already locks it appearing
   exactly once).
2. `heroScene.ts`: WAVE_GEOMETRY rescales to 185/185, periods 5, samples 40.
3. Tests (failure-first): geometry round-trip and the 45-degree invariant update;
   the matched-wavelength assertion loosens from closeTo precision to an explicit
   5px band (52.4 vs the original 50.6); the canary font token expectation updates.
4. E2E: existing probes self-adjust (they measure rendered geometry); mobile frame
   inspected for indent overflow.
5. Validate locally, deploy with sentinel = compiled stylesheet containing
   "clamp(2.8rem,11vw,8.5rem)" (minified form verified locally), forensics
   pre/post.

## Design decision (confirmed 2026-06-12)

At the new size the second line ends at 897px while the docked envelope starts at
781px, so the boat permanently fronts most of the "To" at rest on desktop. Options
presented: move the boat's rest to 68 percent, cap the size at ~7.1rem, or accept.
User chose to accept the overlap — the boat reads as foreground scenery. Mobile is
unaffected (line ends 385px of 390, above the envelope).

### PR checklist pass

One token plus one geometry constant; no duplication (the single-clamp canary
holds); no comments; tests updated in step.
