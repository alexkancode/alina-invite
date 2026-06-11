# Dock Carousel

## Understanding

The bottom dock is restructured into a single-row carousel:

1. Right of the vertical Play all pill sits a vertically stacked counter element:
   "Going (N)" on top (passive count) and "Not Going (N)" below. The Not Going entry takes
   over the reveal toggle from the floating pill it replaces — clicking it shows/hides the
   not-going-without-song guests; it is disabled (but still shows the count) when there is
   nothing hidden to reveal.
2. The cards render in one horizontal row that scrolls only the cards: native swipe on
   mobile (overflow scrolling), plus left/right arrow buttons at either edge of the cards'
   visible area that page the scroll position.

```mermaid
flowchart LR
    subgraph dock [frosted dock - one row]
        PA[Play all<br/>vertical pill]
        subgraph counters [stacked counters]
            G["Going (N)"]
            NG["Not Going (N)<br/>reveal toggle"]
        end
        L[left arrow]
        CARDS[cards - single row<br/>swipe / scroll horizontally]
        R[right arrow]
    end
    PA --- counters --- L --- CARDS --- R

    style PA fill:#1e5c2e,color:#fff
    style G fill:#8B2FC9,color:#fff
    style NG fill:#483D8B,color:#fff
    style CARDS fill:#1a3a5c,color:#fff
    style L fill:#5c4a1a,color:#fff
    style R fill:#5c4a1a,color:#fff
```

## Design decisions

- Counts come from one exported `summarizeAttendance` helper beside the renderer (same
  home as `isDeferredGuest`), so the labels, the toggle's disabled state, and the deferred
  logic can never disagree.
- Arrows are CSS-drawn chevrons (the site's established geometry-over-glyphs standard) and
  scroll by ~80% of the visible width with smooth behavior.
- The mobile media rules that sized entries at 25% width with vertical scrolling are
  replaced by the single-row model at all widths; entries keep their natural size.
- Play all, previews, art cards, and deferred hiding are unchanged in behavior.

## Second follow-up after field review

On mobile the arrows are hidden entirely (swipe is the natural affordance); the
state-aware arrows remain a desktop-only control.

## Follow-up after field review

Arrows become state-aware: rendered only when the rail actually overflows, with the left
arrow hidden while the rail sits at its start and the right arrow hidden at the end —
recomputed live on scroll and resize. The visibility decision is a pure exported
`arrowVisibility(scrollLeft, clientWidth, scrollWidth)` helper beside the renderer so it
is unit-testable, with a small rounding tolerance at the edges.

## Outcome

- One glanceable dock row: playlist control, attendance tallies, and a swipeable card rail
  with arrow paging.
- Locked by unit tests on the summary helper, e2e on counter text/toggle behavior, and e2e
  on scroll mechanics (arrows move scrollLeft; overflow is horizontal).
- Deployed to production once verified locally.
