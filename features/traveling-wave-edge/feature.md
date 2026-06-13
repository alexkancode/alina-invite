# traveling-wave-edge

## Verbatim request (2026-06-13)

> I think we have the wrong thing "waving". You know how there is a sine style wave
> transforming the edge of the reveal slants? it is that wave that should look like
> a sine wave in action where the sine wave is moving forward, so the waves are
> traveling down the slant

## What the investigation found

The roll built in [[perceptible-wave-roll]] and [[faster-wave-roll]] IS a correct
traveling wave (crests propagate one wavelength down the slant per period; measured
the edge region changing 900-1225 px across a cycle). But it never reads as one:

1. During the 6s reveal the wavy edge is also sweeping across the screen (the wipe).
   The crest travel runs in nearly the same direction as that sweep, so it is
   swamped - you read it as the whole edge sliding, not crests marching.
2. After the reveal the SMIL freezes and the edge parks past the last letter (the
   resting slant sits in the sky at x~1095-1280; the text ends at x~638 / ~897).
   So there is no stationary wavy edge left to watch the crests travel along.

There is no moment where you see a still slant with ripples running down it.

## Confirmed understanding (direction chosen: persistent wavy edge)

Leave a wavy edge resting at the headline after the reveal and keep the wave
traveling forever (no freeze). The headline ends up slightly clipped by the live
edge rather than a flat cut - accepted trade.

Mechanism, kept deliberately small and non-disruptive to the tuned boat-synced
reveal:

- Shift only the reveal's RESTING position so the wavy slant docks over the
  headline's trailing edge instead of parking in the sky. Only the final keyframe
  of the sweep changes; every mid-sweep waypoint (and the stern-locked tracking it
  drives) is untouched.
- Run the roll indefinitely (drop the freeze and the repeatCount derivation), at a
  readable one-wavelength-per-second period (revert the 333ms shimmer). On a now-
  stationary edge a readable speed reads as a traveling wave, not flicker.

## The ragged-right wrinkle (called out)

The headline is left-aligned and ragged: "You Are" ends near x638, "Invited To"
near x897. Both lines share one clip shape and one resting transform, so a single
resting edge can graze only one line's trailing edge. The plan rests it grazing the
longer line (line 2), which keeps content readable (only the tail of "To" is grazed
by crests); line 1's wave then sits in the sky just past "You Are". Per-line docking
is possible later but needs separate offsets and is out of scope here. To validate
the resting position I can screenshot the settled headline and adjust the rest
percent until the graze looks right.

## Before vs after

```mermaid
flowchart TB
    subgraph before["Now"]
        B1["Reveal sweeps; wave travels but is<br/>swamped by the sweep (same direction)"]:::bad
        B2["Edge freezes and parks in the sky<br/>past the text: nothing to watch"]:::bad
        B1 --> B2
    end
    subgraph after["traveling-wave-edge"]
        A1["Reveal sweeps as before<br/>(mid-sweep waypoints unchanged)"]:::ok
        A2["Edge DOCKS over the headline's<br/>trailing edge at rest"]:::good
        A3["Roll never freezes: crests march<br/>down the stationary slant forever"]:::good
        A1 --> A2 --> A3
    end
    before --> after

    classDef bad fill:#F4E8D1,stroke:#264653,color:#264653
    classDef ok fill:#2A9D8F,stroke:#264653,color:#F4E8D1
    classDef good fill:#E76F51,stroke:#264653,color:#F4E8D1
```

```mermaid
flowchart LR
    RE["REVEAL_EDGE end waypoint<br/>percent 0 (parks in sky)<br/>-> REVEAL_REST_PERCENT (docks on text)"]:::data
    RO["WAVE_ROLL: drop repeatCount/freeze<br/>period 333 -> 1000 (readable)"]:::data
    RE --> CSS["reveal-mask/reveal-text 'to' keyframes<br/>(canary auto-derives from REVEAL_EDGE)"]:::out
    RO --> SMIL["animateTransform repeatCount=indefinite<br/>(no fill=freeze)"]:::out

    classDef data fill:#264653,stroke:#264653,color:#F4E8D1
    classDef out fill:#F4A259,stroke:#264653,color:#264653
```

## Accessibility

Under prefers-reduced-motion the existing rule sets `animation: none` on the lines,
so they rest at the un-transformed state (translateX 0): text fully revealed, no
clip docking, no motion. The inline script still strips the SMIL node. Accessible
state is the clean full headline.

## Out of scope

- Per-line independent docking offsets.
- Reveal sweep trajectory / stern-locked tracking (untouched).
- Amplitude (stays 12.5px).
