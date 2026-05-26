# Page Load Animation Sequence

All animations that fire on initial page load, in chronological order.

---

## Timeline

| Time | Animation | Element | Mechanism |
|------|-----------|---------|-----------|
| 0s | Sunburst rotation begins | `#sunburst-svg` | CSS `animation: disco-rotate 180s linear infinite` |
| 0s | Sparkle twinkle begins | 22 `.sparkle` SVGs | CSS `animation: sparkle 3s ease-in-out infinite` (staggered delays 0-4.2s) |
| 0s | Sparkle mouse parallax active | 3 `.sparkle-layer` divs | JS `mousemove` → `requestAnimationFrame` → `transform: translate3d()` |
| 0s | Disco ball spin begins | `#discoBall` | CSS `animation: disco-ball-spin 20s linear infinite` (wobble) |
| 1s | Rainbow stripes slide in | 26 bar divs (13 left, 13 right) | CSS `animation: sliding-bar 4s linear forwards` with `clip-path: inset()` |
| 1s | "July 11th" text rides in from left | `.slide-text` (left) | CSS `animation: ride-in-date 4s linear forwards` — white→navy color transition |
| 1s | "3-6pm" text rides in from right | `.slide-text` (right) | CSS `animation: ride-in-date-rtl 4s linear forwards` — white→navy color transition |
| 4.4s | Arc text fades out (mobile only) | `.arc-text-svg` | CSS `animation: fade-out-arc 0.6s ease-out forwards` |
| 5s | Map + buttons fade in and slide up | `.content-reveal` grid | CSS `animation: reveal-up 0.8s ease-out forwards` — opacity 0→1, translateY 21px→0 |
| 5.5s | Arc text + disco ball drops from above | `.arc-disco-unit` | CSS `animation: bounce-in 1.2s ease-in forwards` — falls from -120vh, 2 bounces on impact |
| 7.7s | Shine sweeps across "Alina's Birthday" text | `.birthday-label` | CSS `animation: shine-sweep 0.6s ease-in-out forwards` — light pink highlight through `background-clip: text` |
| 7.7s | Shine sweeps across RSVP button | `.rsvp-shine` div | CSS `animation: shine-sweep 0.6s ease-in-out forwards` — light pink gradient sweep |

---

## Continuous Animations (Loop Forever)

| Animation | Element | Mechanism | Duration | Performance |
|-----------|---------|-----------|----------|-------------|
| Sunburst rotation | `#sunburst-svg` | CSS `disco-rotate` keyframes | 180s per revolution | Compositor-only (`transform: rotate`) |
| Sparkle twinkle | 22 `.sparkle` SVGs | CSS `sparkle` keyframes | 3s cycle, staggered | Compositor-only (`opacity` + `transform: scale`) |
| Disco ball spin + wobble | `#discoBall` | CSS `disco-ball-spin` keyframes | 20s per revolution | Compositor-only (`transform: rotateY/rotateX`) |
| Mouse parallax | Sparkle layers + sunburst | JS `mousemove` → `rAF` → `translate3d` | Continuous | Compositor-only, gated behind `(hover: hover)` + `prefers-reduced-motion` |

---

## One-Time Animations (Play Once, Forward Fill)

| Animation | Keyframe Name | Duration | Delay | Easing | Properties Animated |
|-----------|--------------|----------|-------|--------|-------------------|
| Rainbow stripes (LTR) | `sliding-bar` | 4s | 1s | linear | `clip-path: inset()` |
| Rainbow stripes (RTL) | `sliding-bar-rtl` | 4s | 1s | linear | `clip-path: inset()` |
| "July 11th" ride-in | `ride-in-date` | 4s | 1s | linear | `transform: translate()` + `color` (white→navy) |
| "3-6pm" ride-in | `ride-in-date-rtl` | 4s | 1s | linear | `transform: translate()` + `color` (white→navy) |
| Arc text fade (mobile) | `fade-out-arc` | 0.6s | 4.4s | ease-out | `opacity` |
| Map/buttons reveal | `reveal-up` | 0.8s | 5s | ease-out | `opacity` + `transform: translateY` |
| Disco ball bounce drop | `bounce-in` | 1.2s | 5.5s | ease-in | `transform: translateX + translateY` (drop + 2 bounces) |
| Birthday label shine | `shine-sweep` | 0.6s | 7.7s | ease-in-out | `background-position` (through `background-clip: text`) |
| RSVP button shine | `shine-sweep` | 0.6s | 7.7s | ease-in-out | `background-position` |

---

## User-Triggered Animations

| Trigger | Animation | Element | Mechanism |
|---------|-----------|---------|-----------|
| RSVP button hover | Reverse shine sweep | `.rsvp-shine` | CSS `animation: shine-sweep-reverse` via `:hover` rule |
| RSVP button hover | Dual glow shadow | `#rsvp-btn` | Inline `onmouseenter/onmouseleave` swapping `box-shadow` |
| Calendar button hover | Dual glow shadow | `#cal-btn` | Inline `onmouseenter/onmouseleave` swapping `box-shadow` |
| RSVP "Going" submit | Star burst (24 stars radiate) | Dynamic SVGs appended to body | JS creates SVGs with CSS `animation: star-burst` — radial from button center |
| Calendar button click | Content fades out | `main`, `.stripe-panel` | JS adds `.cal-transition-hide` class (CSS `opacity: 0` transition) |
| Calendar button click | Rays shrink to icon | `#sunburst-svg` | JS sets `width/height: 120px` (CSS `transition: width/height 1.5s`) |
| Calendar button click | Sparkles shrink to center | `#sparkle-field` | JS sets `transform: scale(0.03)` (CSS `transition: transform 1.5s`) |
| Calendar button click | Big calendar icon appears | Dynamic div | JS creates flex-centered viewport div, fades in via `opacity` |
| Calendar button click | Icon flip | SVG inside big icon | JS applies CSS `animation: cal-flip 0.5s` at 1s mark |
| RSVP modal open | Accent color shifts to pink | `body.accent-pink` | JS toggles class, CSS rules override slide-text + sparkle colors |
| Disco ball click | Game modal opens | `#game-modal` | JS toggles `hidden`/`flex` classes |

---

## Accessibility

All animations respect `prefers-reduced-motion: reduce` via a global CSS rule that forces `animation-duration: 0.01ms` and `transition-duration: 0.01ms`. Mouse parallax is additionally gated behind `(hover: hover) and (pointer: fine)` media query.

---

## Performance Notes

- **Compositor-only animations** (transform, opacity): Sunburst rotation, sparkle twinkle, disco ball spin, mouse parallax, content reveal, bounce drop
- **Paint-triggering animations**: Rainbow stripe `clip-path` (no layout, triggers paint on small area), shine `background-position` (tiny paint area on text)
- **No layout-triggering animations**: Nothing animates width/height/top/left in the load sequence (sunburst width/height transition only fires on calendar click interaction)
- **Total animated elements on load**: ~50 (22 sparkles + 26 stripe bars + arc text + disco ball + content grid + shine overlays)
