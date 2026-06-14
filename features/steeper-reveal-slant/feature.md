# steeper-reveal-slant

## Verbatim request (2026-06-13)

> can we tilt the line more upwards where the angle is just a bit more up and down?
> but not by too much

## Confirmed understanding

Tilt the reveal cut line a bit more vertical ("up and down"), modestly. It is a
45-degree diagonal today; make it steeper by shortening its horizontal run while
keeping its height: `WHIP_GEOMETRY.slantPx` 370 -> 300 (with `maskH` 370), so the
slant goes from 45 degrees to about 39 degrees off vertical - clearly more upright but
still clearly slanted.

```mermaid
flowchart LR
    A["slantPx 370 = maskH 370<br/>45deg diagonal"]:::old
    B["slantPx 300 < maskH 370<br/>~39deg off vertical (steeper)"]:::new
    A -->|shorter horizontal run| B
    classDef old fill:#F4E8D1,stroke:#264653,color:#264653
    classDef new fill:#E76F51,stroke:#264653,color:#F4E8D1
```

## Mechanism

One constant: `WHIP_GEOMETRY.slantPx` 370 -> 300. The whip path, bump, and cut-edge
rotation all derive from `WHIP_GEOMETRY`, so they follow. Amplitude (50), maskH (370),
width, samples unchanged.

## Validation

To validate steeper-reveal-slant I can confirm the rendered reveal edge is more
vertical (slant horizontal-to-height ratio ~0.81 instead of 1.0) and a single whip
bump still rides it, with letters revealed normally.

## Out of scope

Amplitude, the whip morph cadence, the cut-edge rotation amount, reveal/sail timing,
clouds, envelope.
