# steeper-reveal

## Verbatim request (2026-06-15)

> for the reveal line, can we make it like 20% more vertical?
> [confirmed: reduce the edge's horizontal run 20% (slantPx 300 -> 240)]

## Confirmed understanding

Make the reveal wave edge (the whip clip that uncovers the headline) ~20% more vertical
by reducing its horizontal slant run 20%: `WHIP_GEOMETRY.slantPx 300 -> 240` over the
unchanged `maskH` (370). The wave bump amplitude and the reveal timing stay the same.

## Mechanism

The whip edge runs diagonally: `slantPx` horizontal over `maskH` vertical. Dropping
`slantPx` to 240 makes the diagonal stand up steeper (angle from vertical ~39deg ->
~33deg). `WHIP_EDGE_FRAMES` regenerate from the new geometry; the reveal clip in
`HeroBay` consumes them unchanged. `WHIP_LINE_FRAMES` is unused in the app now (the wake
uses `WAKE_FRAMES`), so only the reveal clip is affected.

```mermaid
flowchart LR
    A["slantPx 300 / maskH 370 (~39deg from vertical)"]:::old --> B["slantPx 240 / maskH 370 (~33deg, more vertical)"]:::new
    classDef old fill:#F4E8D1,stroke:#264653,color:#264653
    classDef new fill:#2A9D8F,stroke:#264653,color:#fff
```

## Out of scope

The reveal sweep timing (REVEAL_EDGE), the wave bump amplitude, the headline, the wake,
the boat. Only the whip edge's horizontal slant changes.

## Validation

To validate steeper-reveal I can unit-assert `WHIP_GEOMETRY.slantPx === 240` (still <
maskH); the whip bump/baseline tests stay green (amplitude unchanged); the e2e slant
ratio (slant run / height) drops with the steeper edge, so its lower bound is relaxed.
Screenshot the reveal mid-sweep and confirm the diagonal stands up more vertical.
