# Play All Previews — Implementation Plan

Feature alias: `play-all-previews`

## Step 1 — `preview-ended` events from AudioPreviewManager (TDD)

File: `src/components/spotify-combobox/AudioPreviewManager.ts`,
tests: extend `tests/unit/audio-preview-manager.test.ts`

- Natural completion (`ended` listener) dispatches a bubbling
  `preview-ended` CustomEvent on the button with `detail.reason = 'ended'`.
- `stopCurrentPreview()` (manual stop, takeover by another play) dispatches `'stopped'`.
- Playback error dispatches `'error'`.
- Existing reset behavior (glyph, `data-preview-state`, disabled) unchanged.

## Step 2 — PlayAllController (TDD)

File: `src/components/guest-list/PlayAllController.ts`,
tests: `tests/unit/play-all-controller.test.ts`

- Constructor injects the list container, the trigger button, and the
  `PreviewPlaybackController`.
- `toggle()`: idle → start sequence; running → stop (delegates the actual audio stop to the
  playback controller path via `AudioPreviewManager` through the current button).
- Sequence: snapshot the card buttons in DOM order; for each: call
  `handlePlayClick(button)`; if afterwards `button.dataset.previewState !== 'playing'`
  (miss, error, or unavailable) advance immediately; otherwise wait for that button's
  bubbled `preview-ended` — `ended`/`error` advance, `stopped` aborts.
- Trigger button reflects state via `data-playlist-state` (`idle`/`running`) and text
  ("Play all" / "Stop"); resets on finish or abort.
- One delegated `preview-ended` listener on the container, alive for the page's lifetime;
  the controller ignores events for buttons it is not waiting on.

## Step 3 — Page wiring and markup

File: `src/pages/index.astro`

- "Play all" button markup beside the guest-list section; hidden until `loadGuestList`
  renders at least one `.guest-song-play`.
- Instantiate `PlayAllController` with the existing guest-list `PreviewPlaybackController`;
  the button's click handler calls `toggle()`.
- Style rules (`.guest-play-all`, running state) in the page style block; visually related
  to the existing green play controls; no inline styles.

## Step 4 — E2E

File: extend `tests/e2e.guest-list-preview.test.ts`

- With seeded song cards: the Play all button is visible; clicking it puts the first card
  into the playing state and the trigger into the running state; clicking again stops and
  resets both. (Full multi-track advancement is locked by unit tests — a real 30s preview
  per track is not e2e material.)

## Step 5 — Verify, rebuild, redeploy, smoke

- Run manager, controller, guest-list, preview suites; rebuild, redeploy locally.
- Curl: endpoints unchanged (no API surface in this feature).
- UI: screenshots of idle and running states; confirm sequence behavior manually via a
  short observation window (first card playing, button in stop state).

## PR-Readiness Review

- Utility in the wrong home? Sequencing lives in `guest-list/` beside its only consumer;
  the manager gains an event, not playlist knowledge.
- Inline styles? Class rules only.
- Duplicated utilities/styles? Reuses the playback controller, resolver, manager, and
  existing green-button visual language.
- Testable? All dependencies constructor-injected; events synthesized in jsdom tests.
- Single purpose? Manager: audio lifecycle + announcements. PlayAll: sequencing only.
- Comments? None.
- Full tests? Steps 1, 2, 4.
