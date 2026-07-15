# UI / QA report — Editorial Print Engine (phase 1)

## Investigation synthesis (read-only audits)

### Current-flow UX (P0–P3)
- **P1** Customer-facing perfume framing (scent / fragrance / notes / mood)
  contradicted the "editorial print engine" concept. → Fixed this phase via
  the Edition adapter + copy de-perfuming.
- **P2** Motion durations were hardcoded per screen (no shared tokens). →
  Added `--motion-*` / `--ease-*` / `--stagger-*` tokens; screens can migrate
  onto them incrementally.
- **P2** Select screen already scroll-snap (good); relabelled to editions.
- **P3** Capture / Frame / Issuing still read as "process" more than "ritual";
  scheduled for the next phase (paper-cut shutter, registration-lock issuing).
- **OK** PASS/FILM artefacts, RETAKE (frames-only), NEW SESSION (full reset),
  same-artefact-across-Review/Printing/Done, EN/JP — all verified previously
  and unchanged by this phase.

### Print / backend integration (read-only, PR #2 not touched)
- Backend `printer.py` streams by `image.height` in 128-dot bands → **variable
  length supported**; `receipt.py` derives height from paper-width scaling →
  no fixed 1760/1880/2000. The frontend length change does not break the
  contract. The Edition adapter changes *display labels only*; the artefact
  prop shape consumed by the renderer is unchanged.

### Performance / accessibility principles
- transform/opacity + CSS only; no WebGL/canvas/backdrop-filter; off-screen
  animations stopped; `prefers-reduced-motion` handled. New tokens add no
  runtime cost. Edition adapter is O(1) array lookups.

## This phase — verification

- **Build**: `npm run build` ✓ (static 5 pages, no type errors).
- **Scope of change**: tokens (globals.css), Edition adapter (edition.ts),
  Select screen, KioskApp wiring, BoardingPass + MagazineCover labels, i18n
  customer copy, Idle copy. **PASS/FILM paper geometry unchanged** (620-wide
  ×2000 pass, 640×1280 film, photos 368²/288²).
- **Backend**: unchanged (PR #2 untouched).
- **Git**: branch `ui/editorial-print-engine` from `main`; no direct push to
  main; no force push; PR opened, not merged.

## Phase 2 — Printing ritual, error recovery, Staff Mode, inactivity

### What was verified live (production build, `next start -p 3090`, 1080×1920)

- Full PASS flow: Idle → Edition → Format → Pose → Capture (3 frames) → Proof
  → **Proof Lock** (corner marks) → **ISSUE CORE** CALIBRATE → REGISTER →
  ISSUE (synced to the right→left feed) → RELEASE → Ready/Claim → Done.
  Screenshots confirm: photos/QR/stub/print-slot geometry unchanged, ISSUE
  CORE never overlaps the paper, no lingering sculpture on Done.
- Full FILM flow: same ritual, ISSUE CORE anchored above the top slit,
  existing FILM artwork/masthead/quote/barcode unchanged.
- **Staff Mode**: hidden corner hold → PIN pad → panel; honest `NOT
  CONNECTED` statuses; disabled Test Camera / Reprint with explanatory notes.
- **Error recovery**: Staff Mode's "Test print (simulate failure)" → the
  print stops mid-issue → **PRINTING PAUSED** screen (RETRY PRINT / RETURN TO
  PROOF) → RETRY PRINT → same session (edition/serial unchanged) → completes
  normally. No console errors, no hydration warnings, at any point.
- `npx tsc --noEmit` clean; `npm run build` clean (static export, 5 pages).

### Bug found and fixed during this QA pass

Re-triggering a print (Staff Mode "Test print" a second time without
claiming the first) didn't reset `PrintingScreen`'s internal ritual state,
because `phase` was already `"printing"` and React reused the mounted
instance. Fixed by keying `PrintingScreen` on a monotonically-incrementing
`printAttempt` counter (`KioskApp.tsx`), incremented on every fresh
attempt (capture finish, Staff test-print, and error retry) — see
`ERROR_RECOVERY.md`.

Also found: the failure-simulation timer was originally decided inside the
`requestAnimationFrame` tick loop, which starved when the preview tab lost
foreground focus during automated testing (rAF throttles on a backgrounded
tab). Moved the fail-decision onto its own `setTimeout`, independent of paint
frames — `PrintingScreen.tsx`'s "ISSUING" effect. This is a correctness fix,
not just a test workaround: a real kiosk browser is always foregrounded, but
gating a failure decision on paint delivery was fragile regardless.

### Not verified in this session (explicitly incomplete)

- Real Raspberry Pi hardware — FPS/CPU under real thermal/printer load.
- Real camera/printer/paper backend signals (PR #2's territory) — CAMERA
  UNAVAILABLE / PRINTER OFFLINE / PAPER EMPTY are typed + rendered, never
  triggered by anything but the Staff Mode PRINT FAILED test.
- Video/GIF capture of the ISSUE CORE motion (see final report).

### reduced-motion — verified live

Patched `window.matchMedia` to force `prefers-reduced-motion: reduce` and ran
the PASS flow through to Printing: the artefact completed in ~120ms with no
blade-transform frames rendered (matches `REDUCED_MOTION_DURATION`), state
still progressed through the full `review → proofLock → … → ready` sequence
(state transitions preserved, only the visual motion suppressed), console
clean.

## Phase 2/3 — 6-frame capture + FrameSelectionCarousel

Full PASS run verified live in production preview (`npm run build` +
`next start -p 3090`), 1080×1920, console/network monitored throughout:

Idle → Edition → Format (PASS) → Pose ("6 frames →" confirmed) → Capture
(all 6 frames, "FRAME 0N / 06" progress, 3×2 contact sheet, per-frame
REGISTERED labels) → Registering Frames (FRAME CORE unprocessed → indexing
→ registering → ready, reflection clip fetched — see below) → Select (tap to
select/deselect, thumbnail nav, 4th-selection blocked at "Selected 3/3",
deselecting frame 2 correctly renumbered frame 4's badge from PRINT 03 to
PRINT 02) → USE THESE 3 → Proof (3 photos in chosen order, "STEP V · THE
PROOF" — correctly renumbered from IV) → Proof Lock → Printing (ISSUE CORE
calibrate/register/issue/release) → Done ("STEP VI" printing step also
renumbered correctly) → Retake (from Proof) returns to Capture (not Pose)
with a fresh 6-frame session, session id/edition/serial preserved. Console
clean and zero unexpected network requests at every step.

FILM path verified the same way through to Proof: 3 photos in chosen order
on the FILM artefact, quote/motif/metadata/barcode unchanged, "STEP V · THE
PROOF" correctly shown, console clean.

Error recovery + Staff Mode regression re-verified after these changes:
Staff Mode PIN → Test Print → simulated failure → "PRINTING PAUSED" shown
with EN+JP copy → Retry Print → resumes on the same 3 photos/serial (no
regeneration), console clean throughout.

### Two real bugs found and fixed during this QA pass

1. **`setPointerCapture` exception silently broke every tap after the
   first.** Automated pointer testing (synthetic `PointerEvent`s with
   fabricated `pointerId`s) surfaced that `setPointerCapture` can throw for
   a `pointerId` the browser doesn't recognize as a live pointer; without a
   `try/catch` the exception aborted `onPointerDown` before drag state was
   recorded, so every subsequent tap/drag silently no-opped (visible as
   Next.js's dev overlay showing "1 Issue"). Fixed with `try {} catch {}`
   around both `setPointerCapture` and `releasePointerCapture` in
   `FrameSelectionCarousel.tsx` (matching the reference Box Carousel's own
   defensive pattern) — confirmed fixed by re-running the same selection
   sequence and seeing "Selected 2/3", "Selected 3/3" progress correctly.
2. **Registering Frames' `registering`/`ready` timers could fire out of
   order.** The original `MAX_MS - 220` calculation for entering `ready`
   could resolve to a timestamp *before* the `registering` timer fired,
   so the state briefly reverted from `ready` back to `registering` a
   moment before the screen unmounted — and, combined with `preload="none"`
   on the reflection `<video>`, meant the clip's fetch never had time to
   start before the screen was gone (only the poster ever loaded, confirmed
   via `read_network_requests`). Rewrote the timeline as a single set of
   monotonically-increasing constants (`RegisteringFramesScreen.tsx`) and
   switched the video to `preload="auto"` (justified — the optimized clip is
   63KB) so the browser fetches/decodes it during the ~1s of indexing that
   precedes `registering`. Re-verified: `frame-register-core.mp4` now shows
   a `206 Partial Content` fetch inside the registering window, console
   clean.

### Not verified in this session (explicitly incomplete)

- Real Raspberry Pi hardware for the new Carousel/FRAME CORE/video path.
- `prefers-reduced-motion` was not re-toggled live specifically for
  `FrameSelectionCarousel`/`FrameCore`/the reflection video in this pass
  (Phase 1/2's ISSUE CORE reduced-motion path was re-verified above); their
  `matchMedia` wiring mirrors the already-verified ISSUE CORE pattern
  exactly, but was not independently re-exercised live.
- Static/video QA captures were not saved to `docs/frame-selection-qa/` —
  no headless-browser-to-disk screenshot tooling (no puppeteer/playwright/
  chromium binary) is available in this environment; all QA above was done
  live in the interactive Browser pane and is recorded here as the QA
  artifact instead of image files.
clean.
