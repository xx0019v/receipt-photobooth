# Autonomous Design Log

Running record of each autonomous ANALYZE→…→REVERIFY loop, so no loop ever
repeats a failed approach. Newest last.

## Loop 1 — 2026-07-16 · Peel + arc + pointer hardening (Design Sources: Draggable Sticker / Round / Box)

- **Target:** `FrameSelectionCarousel` + `SelectFramesScreen`
- **Changes:**
  1. Peel drag-to-slot (Draggable Sticker principles, CSS-only): press lift
     (scale 0.992 / −6px / one-shot sheen), vertical drag ≥48px detaches a
     150px proof ghost (tilt ±2.5° from velocity), drop on a PRINT ORDER
     slot registers in order, drop elsewhere cancels. Tap selection kept as
     the primary path; peel is optional.
  2. Arc rail geometry from Round Carousel's circle math flattened to a
     parabola: `lift = 14·dist²` (max 56px), sizes 104/84/68, opacity
     1/0.8/0.55 — replaces the previous ad-hoc 0/10/22 steps.
  3. Pointer hardening from Box Carousel: single-pointer guard (second
     pointerdown ignored while one is live), explicit gesture mode state
     machine (undecided→swipe|peel), `pointercancel` terminal (no tap/no
     drop), 220ms rapid-tap lock, scale-corrected local coords for the
     ghost (kiosk stage is scaled).
  4. `SelectFramesScreen`: slot refs for hit-testing, quiet one-shot
     "3 frames already registered" line (2s, replaces the counter, no toast).
- **Verify (production build, 1080×1920, JP mode):** typecheck ✓ build ✓
  peel-drop onto slot 01 → SELECTED 1/3 ✓ ghost renders during drag ✓
  dead-zone drop cancels ✓ tap select ✓ double-tap collapses to one
  selection ✓ left swipe navigates without selecting ✓ 3rd selection +
  USE THESE 3 → Proof (STEP V) ✓ console errors 0 ✓
- **Critique:** arc garland reads clearly, active thumb dominant, photo
  remains the hero; no toy-sticker look (monochrome, 2.5° max tilt); peel is
  discoverable via the "drag down to place" hint line. PASS.
- **Notes for future loops:** browser-pane background-tab throttling slows
  the 6-shot capture dramatically during automated QA — poll with
  screenshots, don't assume a hang. React flush is async: assert DOM state
  in a `setTimeout`, never synchronously after dispatching events.
- **Result:** 合格 (pass) — committed.

## Loop 2 — 2026-07-16 · Re-supplied sources audit (no code change)

- **Input:** Draggable Sticker / Round Carousel / Box Carousel re-sent in
  full, plus `ACUSE/` (12 SVGs) and `ACUSE_v/` (2 mp4s).
- **Audit:** the three carousel/sticker sources diff-checked against Loop 1's
  audit — identical, already classified C/D/E and integrated; SVGs already
  established as byte-identical to `public/assets/chrome/`. The one new
  item, `pc。lips.mp4`, is byte-identical (`cmp`) to the shipped Idle hero
  loop `silver-lips.mp4` → classification F (already shipped).
- **Decision:** no re-implementation (no-repeat rule; Select screen is
  frozen as passed). One performance finding logged for a future approved
  pass: the Idle loop's 2880×2880@32fps decode is the heaviest ongoing cost
  on a Pi and could be re-encoded ~1152px with no visible change — not
  applied because the Idle hero asset is protected.
- **Verify:** working tree clean (only third-party untracked `AGENTS.md`),
  preview HTTP 200 on the Loop 1 build, no code delta → no rebuild needed.
- **Result:** 合格 (registry update only) — committed.
