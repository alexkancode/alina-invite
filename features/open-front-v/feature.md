# open-front-v

## Verbatim request (2026-06-12)

> the wax seal should be behind the top envelope tab and up by 50% of the wax
> seal's height. The front closure of the envelope needs to be removed, if it is
> all a part of the same graphic we'll need to modify it to look like an envelope
> front that is opened where the top goes down into a V

## Confirmed understanding

1. The wax seal tucks behind the flap (drawn before the triangle in the flap SVG)
   and rises by 50 percent of its own height (cy 26 to 16 with r 10), so it peeks
   over the flap's apex.
2. The front closure seam (the V lines from the top corners to the center) is
   removed; the front panel itself reshapes into an opened envelope front whose
   top edge dips from the corners down into a center V (corner y 38 dipping to
   100,80 in the art viewBox).
3. Because the V mouth would otherwise see through to the sky, the flap SVG
   extends downward with an interior band (the same darker sand as the flap's
   inner face) backing the mouth, and the fries seat slightly deeper
   (bottom 56 to 48 percent).

## Plan

1. `HeroBay.astro`: flap SVG viewBox grows to 200x140 — interior rect first, then
   the seal (behind), then the triangle; front art's rect plus seam replaced by
   one V-notched path; wake and pennant unchanged.
2. `yait.css`: `.envelope-flap` repositions (bottom 39 percent, the triangle base
   staying on the body's top edge) and `.fries` seats at bottom 48 percent.
3. Tests (failure-first): integration asserts the old closure seam path is gone,
   the V-notch path and interior band ship, and exactly one seal remains; the
   existing e2e flap/z-order probes carry over.
4. Close-up frames judge the read at both viewports (seal peek, V mouth, no
   see-through during bounce peaks).
5. Validate locally, deploy with sentinel = prod /home HTML containing the
   V-notch path fragment, forensics pre/post.

### PR checklist pass

Markup and two style values; no logic, no duplication, no comments; integration
additions plus existing geometry e2e cover it.
