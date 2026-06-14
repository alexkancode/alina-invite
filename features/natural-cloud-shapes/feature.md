# natural-cloud-shapes

## Verbatim request (2026-06-13)

> can we look into more natural cloud shapes?
> [chosen: build it now]

## Confirmed understanding

The current clouds are stacked ellipses, which can read as a row of separate balls.
Replace that with one smooth, irregular organic silhouette per cloud - a lumpy top of
unequal soft bumps over a flat base, drawn as a single smoothed bezier outline - so
each cloud reads as one natural puff. Keep everything else: the cream-to-coral
gradient, the rim-glow pulse, the drift/bob/breathe, and the far parallax plane.

## Mechanism

`buildCloud` is reworked: instead of returning ellipses + a base rect, it builds a
seeded set of perimeter points (bottom-left corner, then alternating valleys and
unequal peaks across the top with a sine height envelope and jitter, then bottom-right
corner) and smooths them into a single closed cubic-bezier `<path>` via Catmull-Rom,
with a flat bottom. One path per cloud, filled by the existing vertical gradient.

```mermaid
flowchart LR
    A["4 bottom-aligned ellipses + base rect<br/>(can look like stacked balls)"]:::old
    B["seeded peaks/valleys -> Catmull-Rom -> one smooth<br/>irregular bezier outline (lumpy top, flat base)"]:::new
    A --> B
    classDef old fill:#F4E8D1,stroke:#264653,color:#264653
    classDef new fill:#E76F51,stroke:#264653,color:#F4E8D1
```

## Validation

To validate natural-cloud-shapes I can screenshot the sky and confirm the clouds read
as single soft irregular puffs (not rows of balls), with the two-tone gradient, glow,
and motion intact; the unit test asserts a closed smooth path with a flat base and
irregular lumps above it.

## Out of scope

Gradient/colour, rim-glow pulse, drift/bob/breathe, far plane, sun/sea/headline.
Only the cloud silhouette generator and the per-cloud markup (path vs ellipses) change.
