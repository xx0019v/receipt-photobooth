# FINAL POLISH PLAN

Small kiosk print machine for a luxury fragrance event. 1080×1920 portrait,
Chromium-kiosk on a Pi. English-led (~70%), JP support (~30%), thermal
black/grey only.

## Current state (good)
Flow: Idle → Scent → Pose → Capture → Printing(eject → RETAKE/CLAIM) → Done.
Two print artefacts exist (PASS landscape, COVER portrait). Format was a
top-right PASS/COVER toggle — **being removed** (reads dev-ish, not ritual).

## Weak points
1. Format chosen via a top-right toggle — not a ritual, breaks immersion.
2. PASS photos still read secondary; want 3 larger frames side by side.
3. Print ritual not format-aware in feel (same eject for both).
4. Review/Done don't frame the *chosen* format as a decision made.
5. JP balance drifts in a few spots.

## Changes (priority order)
1. **Remove top-right StyleToggle.** (KioskApp)
2. **FormatSelectScreen** — new phase after Scent, before Pose. Two large
   touch choices (BOARDING PASS / MAGAZINE COVER), quiet confirm, CONTINUE.
   Sets `usePrintStyle`. (KioskApp, FormatSelectScreen, i18n)
3. **PASS art**: three large frames side-by-side as the hero band; info below
   in calm zones; keep landscape. (ReceiptStrip)  **COVER**: keep the quiet
   film-strip, no QR. (MagazineCover)
4. **Motion/ritual**: format-aware eject; confirm-thump on format pick; Done
   afterglow. CSS-only, Pi-light. (PrintingScreen, globals.css)
5. **Review/Done**: name the chosen format, RETAKE/PRINT/CLAIM timing. (Review,
   Done)

## Agent split (1–2 areas each, no build/commit; integrator = me)
- **A1 flow/state** (me): KioskApp, FormatSelectScreen, i18n, remove toggle.
- **A2 art direction**: ReceiptStrip (PASS 3-across, larger), MagazineCover.
- **A3 motion/ritual**: PrintingScreen, globals.css.
- **A4 review/done**: ReviewScreen, DoneScreen.

## Verify
build green · console clean · EN + JP · PASS flow + COVER flow · format persists
Idle→Scent→**Format**→Pose→Capture→Printing→Done · buttons only after eject ·
1080×1920 touch targets ≥ ~72px · no colour on paper.

## Done bar
Reads as a luxury event device, not a web app. Format choice feels like a
ritual. Both papers feel keepable. No top-right toggle. build passes.
