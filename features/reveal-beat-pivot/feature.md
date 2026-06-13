# reveal-beat-pivot

## Verbatim request (2026-06-13)

> can we actually do the same rotational effect on the reveal line as it goes?

(Following [[envelope-beat-pivot]], which swivels the envelope toward the screen at
the two inner beats.)

## Confirmed understanding

Apply the same rotateY beat-swivel to the headline reveal: the revealed text and its
wavy edge swivel toward the viewer (~20 degrees, with perspective) at the two inner
beats and return flat, in unison with the envelope's pivot. The headline is much
wider than the envelope, so the perspective is larger to keep it a tasteful swivel
rather than a violent foreshorten.

## Mechanism

The pivot goes on `.headline-mask`, the outer headline container, which currently
carries no transform - so a rotateY animation lives there with no conflict (the sweep
`reveal-mask` is on the inner `.reveal-window`, and the counter `reveal-text` on
`.headline`). Rotating `.headline-mask` tilts the whole revealed headline - clip edge
and text together - so "the reveal line" itself swivels.

```mermaid
flowchart TB
    M[".headline-mask (NEW: reveal-pivot rotateY at beats)"]:::new
    W[".reveal-window (clip + reveal-mask sweep)"]:::b
    H[".headline (reveal-text counter)"]:::c
    L["headline lines"]:::d
    M --> W --> H --> L
    classDef new fill:#E76F51,stroke:#264653,color:#F4E8D1
    classDef b fill:#2A9D8F,stroke:#264653,color:#F4E8D1
    classDef c fill:#F4A259,stroke:#264653,color:#264653
    classDef d fill:#264653,stroke:#264653,color:#F4E8D1
```

The `reveal-pivot` keyframes run over the reveal duration (5.333s) with peaks at the
reveal's two inner beats (20.83% and 57.29%) - the same real-time moments (~1.1s and
~3.05s) as the envelope's pivot - so the headline and envelope swivel together.

```mermaid
flowchart LR
    K0["0%: rotateY 0"]:::flat --> K1["20.83% (beat 1): rotateY 20deg"]:::peak
    K1 --> K2["~39% (between): rotateY 0"]:::flat
    K2 --> K3["57.29% (beat 2): rotateY 20deg"]:::peak
    K3 --> K4["to: rotateY 0"]:::flat
    classDef flat fill:#F4E8D1,stroke:#264653,color:#264653
    classDef peak fill:#E76F51,stroke:#264653,color:#F4E8D1
```

## Validation

To validate reveal-beat-pivot I can pin the reveal clock at a beat (1111ms) and
confirm `.headline-mask` carries a non-identity 3D transform (matrix3d) that returns
toward identity between beats; and review a capture to confirm the headline swivels
tastefully (not distorted) in unison with the envelope.

## Out of scope

Sail/reveal timing, beats, the whip, the existing envelope pivot. The reveal pivot is
additive on `.headline-mask`; no markup change.
