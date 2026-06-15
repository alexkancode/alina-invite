# lower-echo-wave

## Verbatim request (2026-06-15)

> the mirrored wiggling line behind the boat ... push it down vertically to where it
> actually starts where it currently ends? and have it not affect screen scroll if it
> goes too far off the screen, it should just be hidden
> [confirmed: shift down by ~its own height; clip off-screen, never add scroll]

## Confirmed understanding

The mirrored decorative wave is `.reveal-echo` (the semi-transparent white
`reveal-echo-line` overlay in the headline band). Shift it straight down by about its
own height so its new top sits where its bottom currently is (lower, toward the boat).
Any part that lands off-screen must be clipped/hidden and must never introduce a
scrollbar.

## Mechanism

- `.reveal-echo` is `position: absolute; inset: 0` inside `.headline-mask`. Add
  `transform: translateY(100%)` to drop it down by its own height (new top = old bottom).
- Scroll safety is already structural: `.reveal-echo` is absolutely positioned (out of
  flow, so it cannot extend page height) and `.yait-main` is `overflow: hidden`
  (`min-height: 100svh`), which clips anything past the hero. `.headline-mask` has no
  `overflow`, so the dropped echo stays visible below the headline until `.yait-main`
  clips it. No new clipping rule is needed; the change is the single transform, validated
  to add no scroll.

```mermaid
flowchart TD
    A["reveal-echo (inset:0 in headline-mask)"]:::e -->|translateY(100%)| B["dropped one height: new top = old bottom"]:::e
    B --> C["off-screen part clipped by .yait-main overflow:hidden"]:::clip
    B --> D["absolute => out of flow => no scroll"]:::clip
    classDef e fill:#CDEAE0,stroke:#264653,color:#264653
    classDef clip fill:#2A9D8F,stroke:#264653,color:#fff
```

## Out of scope

The reveal itself, the headline, clouds, the echo stroke style/animation (morph + sweep
stay). Only the echo's vertical offset changes.

## Validation

To validate lower-echo-wave I can screenshot the hero and confirm the wiggling line now
sits lower (below the headline), and assert in e2e that the `reveal-echo-line` bounding
box is below the headline and that the page has no horizontal or vertical scroll
introduced (`scrollWidth <= clientWidth`, `scrollHeight <= innerHeight`). The canary
pins the `transform: translateY(100%)` rule.
