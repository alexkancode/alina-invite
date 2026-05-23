# Design System: Strawberry & Summer Sky

This document preserves the visual identity of the birthday invitation so any future changes stay on-vibe.

---

## Mood

Fresh strawberries on a summer evening. Deep navy twilight sky. Berry-stained fingers and warm light. The feeling is **bold but natural** — pop art energy channeled through an organic color story instead of a synthetic one.

The design should feel like it was made by someone who knows the rules of graphic design and breaks them with confidence, not recklessness.

---

## Color Palette

### Primary Colors

| Token | HSL | Hex | Role |
|-------|-----|-----|------|
| `--color-pop-red` | `hsl(348, 83%, 47%)` | `#db1d4e` | Primary actions (RSVP button, submit). Deep strawberry. |
| `--color-pop-yellow` | `hsl(3, 100%, 72%)` | `#ff7070` | Headlines, emphasis borders. Warm coral — the flesh of a ripe berry. |
| `--color-pop-blue` | `hsl(205, 85%, 55%)` | `#2196d4` | Hard offset shadows. Bright summer sky at midday. |
| `--color-pop-pink` | `hsl(340, 82%, 60%)` | `#e54080` | Secondary text (time). Strawberry juice pink. |
| `--color-pop-cyan` | `hsl(195, 85%, 65%)` | `#5cc8e6` | Links, focus states, accent text. Pale sky before sunset. |
| `--color-pop-black` | `hsl(215, 50%, 10%)` | `#0d1a2b` | Background. Deep navy — not pure black. A summer night. |
| `--color-pop-white` | `hsl(40, 30%, 96%)` | `#f7f4ef` | Body text. Warm cream — not clinical white. |

### Usage Rules

- **Warm colors** (red, coral, pink) are for content that demands attention: actions, dates, headings
- **Cool colors** (sky blue, pale cyan) are for structural elements: shadows, links, focus rings, secondary actions
- **Never use pure black** (`#000`) or pure white (`#fff`) — the palette lives in the space between
- **Contrasting-hue shadows**: warm elements cast cool blue shadows, cool elements cast warm berry shadows. This is the soul of the lighting system.

### What NOT to Do

- Don't introduce greens, oranges, or purples — they break the strawberry/sky duality
- Don't desaturate the palette into pastels — the colors should be vivid, not soft
- Don't use semi-transparent black for shadows (it muddies the vibrancy)
- Don't add more than one new accent color without removing one

---

## Typography

### Fonts

| Font | Weight | Role |
|------|--------|------|
| **Dela Gothic One** | Regular (400) | Display type — date, time, RSVP heading, "Thank you". Hero moments only. |
| **Inter** | 400, 500, 600 | Everything else — body text, buttons, labels, metadata. |

### Golden Ratio Scale

Each step is ~1.618× the previous:

| Token | Size | Use |
|-------|------|-----|
| `--font-size-phi-xs` | 10px / 0.625rem | Footnotes, timestamps |
| `--font-size-phi-sm` | 14px / 0.875rem | Footer, meta |
| `--font-size-phi-base` | 16px / 1rem | Buttons, form inputs, body |
| `--font-size-phi-md` | 26px / 1.618rem | Location, purpose statement |
| `--font-size-phi-lg` | 42px / 2.618rem | Success messages |
| `--font-size-phi-xl` | 68px / 4.236rem | Time, modal headings |
| `--font-size-phi-hero` | 110px / 6.854rem | Date (the hero) |

### Hierarchy Through Style, Not Labels

Information type is communicated by **how** it looks, never by a label prefix:

| Information | Treatment |
|-------------|-----------|
| Date | Largest. Dela Gothic One. Coral with berry/sky text-shadow. The hero. |
| Time | Large. Dela Gothic One. Berry pink with sky shadow. |
| Location | Medium. Inter. White at 80% opacity. Conversational. |
| Purpose | Medium. Inter. Cyan. Uppercase tracking. Sets the tone before the date lands. |

**Never** write "Date: July 11th" or "Time: 6:00 PM". The typography does that job.

---

## Spacing

### Fibonacci Scale

All spacing uses Fibonacci numbers. No arbitrary pixel values.

| Token | Value | Common Uses |
|-------|-------|-------------|
| `--spacing-phi-xs` | 5px | Tight gaps between related items |
| `--spacing-phi-sm` | 8px | Icon-to-text gaps, inline spacing |
| `--spacing-phi-md` | 13px | Form input padding, button padding (vertical) |
| `--spacing-phi-lg` | 21px | Section internal spacing, page padding |
| `--spacing-phi-xl` | 34px | Grid gaps, button padding (horizontal), major element spacing |
| `--spacing-phi-2xl` | 55px | Between major page sections |
| `--spacing-phi-3xl` | 89px | Page top/bottom padding |

### Rules

- Always pick the nearest Fibonacci value — don't invent `17px` or `24px`
- When in doubt, go one step larger rather than smaller
- Vertical rhythm > horizontal precision

---

## Layout

### Golden Ratio Grid

The primary layout uses a `1fr 0.618fr` grid — a 62/38 split:

- **62% (left)**: The map, or primary content area
- **38% (right)**: Actions panel (RSVP button, calendar link)

On mobile (≤640px), this collapses to a single column.

### Content Width

Max width is **791px** (1280 / φ). Content should never stretch wider than this. It keeps everything readable and proportioned.

### Aspect Ratios

- Map container: `1.618 / 1` (golden rectangle)
- The RSVP modal is vertically oriented with generous padding — no forced aspect ratio, content determines height

---

## Borders & Outlines

Pop art boldness, not hairline subtlety:

| Context | Width | Color |
|---------|-------|-------|
| Buttons, map frame, modal | 3px solid | Token-appropriate (coral for map, cyan for calendar, etc.) |
| Form inputs | 2px solid | `pop-white/30` at rest, `pop-cyan` on focus |
| Dividers | N/A | Use halftone strip instead of `<hr>` |

All borders use `rounded-lg` (8px radius). The modal uses `rounded-xl` (12px).

---

## Shadows & Lighting

### Dual-Color Ambient Light

The page background has two soft radial gradients creating the illusion of colored spotlights:

- **Upper-left**: Berry pink glow (`hsl(340, 82%, 60% / 0.12)`)
- **Lower-right**: Sky blue glow (`hsl(205, 85%, 55% / 0.10)`)

These are intentionally subtle (10-12% opacity). They set mood, not distract.

### Hard Offset Shadows

Buttons use a **4px 4px** offset shadow with zero blur — a pop art signature:

- Primary button (strawberry red) → sky blue shadow
- Secondary button (navy) → berry pink shadow

The contrast between element color and shadow color is the key detail. **Warm element → cool shadow. Cool element → warm shadow.**

### Elevation System (Soft Shadows)

For containers (map, modal) that need depth without the pop art edge:

| Level | Use |
|-------|-----|
| `--shadow-elevation-low` | Subtle lift (cards at rest) |
| `--shadow-elevation-medium` | Map container, elevated sections |
| `--shadow-elevation-high` | Modal (combines with dual glow) |

Low/medium shadows use cool blue hues. High shadows use warm berry hues. All multi-layered per Josh Comeau's technique.

### Hover Glow

On hover, buttons add `--glow-dual` — a bi-directional neon glow:
- Berry pink from upper-left
- Sky blue from lower-right

This reinforces the dual-lighting theme at the interaction level.

---

## Textures

### Halftone Dots

A fixed-position overlay of berry-pink radial dots at **4% opacity** covers the entire page. This is the Ben-Day dot signature from pop art, tuned to whisper rather than shout.

- Dot grid: 8px × 8px
- Color: `hsl(340, 82%, 60%)`
- Opacity: 0.04
- `pointer-events: none` — purely decorative

### Halftone Divider Strip

Instead of horizontal rules, use a 34px-tall halftone strip:
- Dot color: Strawberry red
- Background: Cream paper
- `background-blend-mode: multiply` + `filter: contrast(16)` creates the crisp dot pattern
- Dot size: 21px (Fibonacci)

---

## Interactive Elements

### Button Hierarchy

| Button | Background | Border | Shadow | Font |
|--------|-----------|--------|--------|------|
| **RSVP** (primary) | Strawberry red | 3px navy | 4px sky blue offset | Dela Gothic One, uppercase |
| **Save the Date** (secondary) | Navy | 3px cyan | 4px berry offset | Inter, uppercase |
| **Send** (modal submit) | Strawberry red | 2px navy | 3px sky blue offset | Inter, uppercase |
| **Cancel / Close** (tertiary) | Transparent | 2px white/30 | None | Inter, regular |

### Form Inputs

- Background: transparent (inherits dark navy)
- Border: 2px `pop-white/30`
- Focus border: `pop-cyan` (sky blue)
- Placeholder text: `pop-white/40`
- Transition: `colors` duration

### Modal

- Background: `pop-black` (deep navy)
- Border: 3px coral
- Shadow: high elevation + dual glow
- Backdrop: `pop-black/70` with `backdrop-blur-sm`
- Headings: Dela Gothic One in coral

---

## Accessibility

- All text on navy background meets WCAG AA contrast (4.5:1+)
- Form inputs have visible focus states (cyan border)
- Interactive elements have minimum 55px height (exceeds 44px WCAG target)
- Calendar link has `aria-label` for screen readers
- Radio buttons are 18×18px with `accent-color` matching the palette
- No information is conveyed by color alone

---

## Responsive Behavior

| Breakpoint | Change |
|------------|--------|
| ≤640px | Golden ratio grid collapses to single column |
| All sizes | Hero date uses `clamp(3rem, 10vw, 6.854rem)` — scales fluidly |
| All sizes | Max-width 791px with `px-phi-lg` padding prevents edge-to-edge |

---

## Adding New Elements — Checklist

Before adding any new visual element, verify:

1. **Colors**: Does it use only palette tokens? Warm/cool shadow pairing correct?
2. **Spacing**: Are all values Fibonacci? (5, 8, 13, 21, 34, 55, 89)
3. **Borders**: 2-3px with appropriate palette color?
4. **Font**: Dela Gothic One for display moments, Inter for everything else?
5. **Typography scale**: Using a phi token, not an arbitrary size?
6. **Shadows**: Warm element → cool shadow? Cool → warm?
7. **Labels**: None. The design communicates meaning through style.
8. **Accessibility**: Contrast ratio ≥ 4.5:1? Focus state visible? Tap target ≥ 44px?
