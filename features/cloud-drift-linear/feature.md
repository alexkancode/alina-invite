# cloud-drift-linear

## Verbatim request (2026-06-14)

> can you investigate why the clouds don't appear to be moving left to right?
> [fix chosen: linear oscillation]

## Investigation finding

The drift is not frozen - the animation runs (`playState: running`, `currentTime`
advances) and the pixels do move. The cause is the easing: `ease-in-out` over 80s
starts at zero velocity and ramps, so almost all of the 200px travel is bunched in the
middle of the cycle (t ~30-50s). Measured real-time `translateX`: ~0u at load, ~4u
(5px) by 6s, ~23u (29px) by 20s - the first ~20s (when you look after load) creeps only
~25px, which reads as static, and the warp shimmer masks it further.

## Fix

Change the three drift animations from `ease-in-out` to `linear` so velocity is
constant from load (~2.0 user units/s = ~2.6px/s for the 160u/80s base). Range (200px),
duration (80s), oscillation (`alternate`), and the cream lead all stay.

```mermaid
flowchart LR
    A["ease-in-out 80s<br/>v=0 at load, peak v mid-cycle"]:::old --> B["~25px in first 20s<br/>reads as static"]:::bad
    C["linear 80s<br/>constant v from load"]:::new --> D["~40px by 20s, steady<br/>visibly drifting"]:::good
    classDef old fill:#F4E8D1,stroke:#264653,color:#264653
    classDef bad fill:#E76F51,stroke:#264653,color:#F4E8D1
    classDef new fill:#A9D9CE,stroke:#264653,color:#264653
    classDef good fill:#2A9D8F,stroke:#264653,color:#fff
```

## Out of scope

Range, duration, oscillation direction, parallax, shapes, palette, warp, breathing.
Only the timing function changes (ease-in-out -> linear).

## Validation

To validate cloud-drift-linear I can seek a drift animation to a known `currentTime`
and confirm `translateX` matches the linear prediction (not the ease-in-out curve),
sample real-time `translateX` in the first several seconds to confirm steady early
movement, screenshot two early frames to confirm a visible shift, and re-run the
regression guards.
