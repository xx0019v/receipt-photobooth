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
