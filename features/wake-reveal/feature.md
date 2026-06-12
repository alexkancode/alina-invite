# wake-reveal

## Verbatim request (2026-06-11)

> awesome. can we figure out how to have the movement of the boat "reveal" the main
> text progressively?

## Confirmed understanding

The headline currently rises word by word on fixed timers that merely coincide with
the envelope's passage. Instead, the boat's movement itself reveals the text: the
words appear in the envelope's wake behind a clipping edge that sweeps left to right
in lockstep with the hull — slowing through each tack exactly as the boat does,
easing into completion as it docks. The per-word timers go away.

## How: a counter-transform wipe driven by the boat's own track

```mermaid
flowchart TB
    T["SAIL_TRACK<br/>the boat's x waypoints<br/>0% -92vw / 40% -52vw / 75% -16vw / 100% 0"]
    R["buildRevealEdge(SAIL_TRACK)<br/>same offsets, proportional percents<br/>-100% / -56.52% / -17.39% / 0%"]
    M["@keyframes reveal-mask<br/>.headline-mask translateX<br/>overflow hidden window"]
    X["@keyframes reveal-text<br/>.headline counter-translateX<br/>text stays put on screen"]
    E["Net effect: stationary text,<br/>reveal edge sweeps with the boat,<br/>transform-only, same easing"]

    T -->|derived, one source of truth| R
    R --> M
    R --> X
    M --> E
    X --> E

    classDef src fill:#264653,stroke:#264653,color:#F4E8D1
    classDef derived fill:#2A9D8F,stroke:#264653,color:#F4E8D1
    classDef css fill:#F4A259,stroke:#264653,color:#264653
    classDef net fill:#E76F51,stroke:#264653,color:#F4E8D1

    class T src
    class R derived
    class M,X css
    class E net
```

The mask and its inner text translate in opposite directions by identical magnitudes
on the same offsets and easeInOutSine curve as `sail-x`, so the window's edge moves
proportionally with the hull and the text never moves on screen — the standard
transform-only reveal, keeping the compositor guarantee.

## Plan

1. `heroScene.ts`: `buildRevealEdge(track)` mapping each track waypoint to a
   proportional mask percent (rounded to 2 decimals); export `REVEAL_EDGE`.
   `SCENE_TIMELINE` drops `wordRevealStartsMs` / `wordRevealDurationMs` (the timers
   this feature retires).
2. Unit tests (failure-first): REVEAL_EDGE endpoints (-100 to 0), offsets identical
   to SAIL_TRACK, strictly increasing, exact proportionality to track x. Timeline
   invariants updated for the slimmer SCENE_TIMELINE.
3. Canaries: yait-scene timeline equality updated; sail-keyframes canary gains
   reveal-mask / reveal-text blocks checked against REVEAL_EDGE (text negated) and
   the shared easing declaration on both.
4. Markup/CSS: headline wrapped in `.headline-mask` (overflow hidden, takes the old
   positioning); `.word` spans stay (tests and spacing) but word-inner and word-rise
   go; reduced-motion list covers the two new animated elements (default state =
   fully revealed).
5. E2E: clock-pinned at 2.0s the mask's computed translateX is proportional to the
   40 percent waypoint (about -56.5 percent of viewport); at 0 the headline is fully
   off-window. Existing docked/reduced-motion/compositor tests carry over.
6. Validate locally (suites, beat frames, curl markers unchanged), deploy with
   sentinel = compiled stylesheet containing "reveal-mask", forensics pre/post.

### PR checklist pass

Derivation lives beside the track data it derives from (`heroScene.ts`); all rules
in yait.css; no duplicated utilities or rules (word-rise is removed, not forked);
typed pure function testable without a browser; single purpose per function; no
comments; unit + canary + integration + e2e cover it.
