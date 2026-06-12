# taller-tucked-fries

## Verbatim request (2026-06-12)

> that worked! can we make the fry people 50% taller and tuck them in so we can't
> see the bottom of their fry bodies?

## Confirmed understanding

The fry crowd grows 50 percent taller (FRY_HEIGHT_RANGE 52-84 becomes 78-126) and
seats deeper in the pocket (fries baseline from bottom 48 to 30 percent) so their
feet stay hidden behind the front V at all times — including at the top of the
bounce (max amplitude 16px of headroom below the V dip).

## Plan

1. `heroScene.ts`: FRY_HEIGHT_RANGE [78, 126]; the crowd builder, bounds tests,
   and bindings all re-derive.
2. `yait.css`: `.fries` bottom 48 to 30 percent.
3. Tests (failure-first): the scene canary numerically locks the new height range;
   a new e2e geometric tuck assertion — the fries container baseline minus the
   maximum bounce amplitude stays below the front V dip (computed from the art's
   rendered box at 80/140 of its height) — fails at the current seating and passes
   at the new one.
4. Close-up frames at both viewports judge proportions (taller heads above the
   mouth; verify mobile does not overgrow its smaller envelope — if it does, a
   media-query height scale on `.fry` is the fallback).
5. Validate locally, deploy with sentinel = prod /home HTML containing a new fry
   height value unique to the taller range, forensics pre/post.

### PR checklist pass

Two constants and one style value; derivations and tests re-derive from the
constants (no duplicated numbers); no comments; canary plus geometric e2e cover it.
