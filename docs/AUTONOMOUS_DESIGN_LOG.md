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

## Loop 3 - 2026-07-16 - Done collection and reset separation

- **Start HEAD:** `51fd01e`
- **Target:** PASS Done and FILM Done.
- **Problem:** the entire Done surface was a button. Reaching toward the paper
  could trigger a destructive session reset, and NEW SESSION had no bounded
  touch target of its own.
- **Direction:** preserve the editorial paper-first composition while
  separating the physical collection zone from the next-session control.
- **Changes:** replaced the full-screen button with a non-interactive screen
  surface; added one 920px-wide NEW SESSION action with the existing live
  countdown; kept the 12-second automatic return; raised the PASS ticket and
  established explicit paper, collection-rail, and action-layer stacking;
  removed the visible em dash from the FILM Done kicker.
- **QA:** `git diff --check` pass; `npx tsc --noEmit` pass; production build
  pass in 13s; HTTP 200; PASS and FILM executed from Idle through Done at
  1080x1920; PASS action 920x92 at y=1762; FILM action 920x82 at y=1800;
  document 1080x1920 with no overflow; FILM collection rail 920x88 at y=1398;
  browser errors/warnings 0.
- **Lint note:** the repository's `npm run lint` opens Next.js's first-time
  ESLint configuration prompt, so it is not a non-interactive lint command.
  Next build's lint/type validation, TypeScript, diff check, and the current
  Web Interface Guidelines review were used instead.
- **Result:** 合格 (pass).

## Loop 4 - 2026-07-16 - Format paper swipe

- **Start HEAD:** `d99e662`
- **Target:** `FormatSelectScreen`.
- **Problem:** the large paper preview only changed through the 88px edge
  button; the promised direct swipe path did not exist.
- **Direction:** make the paper itself gesture-aware without replacing the
  visible, accessible tap control.
- **Changes:** added single-pointer horizontal gesture recognition with a
  72px threshold and vertical-intent rejection; left selects FILM, right
  selects PASS; pointer capture is defensive; button-origin gestures are
  ignored; the reverse edge label now points left; selected state uses an
  aria-live region.
- **QA:** TypeScript, diff check, and production build pass in 13s; controlled
  140px left/right swipes pass; short tap and 180px vertical drag do not
  change selection; 88x320 edge button remains functional; document remains
  1080x1920; console and pointer errors 0.
- **Performance:** no continuous listener, rAF, timer, or React update during
  idle; one ref record per active pointer only.
- **Result:** 合格 (pass).

## Loop 5 - 2026-07-16 - Contextual Edition page turns

- **Start HEAD:** `9581fd6`
- **Target:** `ScentScreen` Edition catalogue.
- **Problem:** the bottom cue said only Scroll, did not name its destination,
  and offered no bounded touch alternative to the native scroll gesture.
- **Direction:** retain the full-viewport editorial catalogue and scroll snap,
  while turning the quiet footer cue into a contextual page-turn control.
- **Changes:** each non-final scene now names and opens the next edition; the
  final scene returns directly to RAW; controls are 96px high, expose complete
  accessible names, and use instant movement when reduced motion is preferred.
- **QA:** TypeScript, diff check, and production build pass; RAW, STILL, BOLD,
  AFTERIMAGE, and RAW again resolved to scrollTop 0, 1920, 3840, 5760, and 0;
  RAW selection still opened Format; document remains exactly 1080x1920.
- **Performance:** no new listener, timer, rAF, or idle render work; page lookup
  and reduced-motion detection occur only on a page-turn activation.
- **Result:** 合格 (pass).

## Loop 6 - 2026-07-16 - Explicit Frame registration

- **Start HEAD:** `5ba20c8`
- **Target:** `FrameSelectionCarousel` active-proof action.
- **Priority:** P1 interaction and accessibility.
- **Problem:** the main proof could be selected only through its pointer
  gesture; thumbnail buttons navigate but do not register a frame, leaving no
  explicit keyboard or assistive-technology selection path.
- **Direction:** preserve the proof as the visual hero and add one thin,
  machine-like registration rail instead of another card or large CTA.
- **Changes:** added a 660x60 Register frame / Remove from print action with
  frame and print-order state, `aria-pressed`, descriptive accessible names,
  and visible focus. Photo tap and the new control share one rapid-tap lock.
- **Interaction:** explicit select/deselect, thumbnail navigation, existing
  tap, swipe, peel/drop, fourth-frame rejection, and print order remain.
- **Performance:** no listener, timer, rAF, or idle render work was added.
- **QA:** TypeScript, diff check, production build, 1080x1920 overflow,
  explicit select/deselect, double activation, thumbnail navigation, 3-frame
  order, fourth selection rejection, PASS Proof, Printing, and Done passed;
  browser errors/warnings 0.
- **Independent critique:** pass. The rail clarifies the action without
  competing with the 660px proof or making the screen resemble a web form.
- **Commit / push / PR:** `add explicit frame registration action`; normal
  push to PR #7, which remains open.
- **Result:** 合格 (pass).

## Loop 7 - 2026-07-16 - Done collection time and reset semantics

- **Start HEAD:** `0ce0783`
- **Target:** PASS / FILM Done reset boundary and bilingual copy.
- **Priority:** P1 physical collection and privacy-reset clarity.
- **Problem:** the screen auto-reset after 12 seconds and still instructed
  Tap anywhere although only the bounded button intentionally resets a session.
- **Direction:** give the printed artifact a calm collection window and name
  the reset mechanism exactly, without enlarging the secondary CTA.
- **Changes:** increased automatic reset to 20 seconds; changed the action to
  Start next session; changed EN/JP countdowns to state Auto reset explicitly.
- **Structure / interaction:** no layout, collection direction, print mapping,
  manual reset boundary, or cleanup contract changed.
- **Performance:** one timeout and one 1-second interval remain, both with the
  existing unmount cleanup; the longer window adds no idle render frequency.
- **QA:** TypeScript, diff check, production build, complete FILM flow, Film
  Proof, Printing, Done, 20-second initial countdown and automatic Idle return
  passed; prior artifact content cleared; 1080x1920 overflow 0; browser errors,
  warnings, and hydration warnings 0.
- **Independent critique:** pass. The paper remains the hero, the secondary
  action is now truthful, and the slower reset better matches physical pickup.
- **Commit / push / PR:** `clarify done reset timing and action`; normal push
  to PR #7, which remains open.
- **Result:** 合格 (pass).

## Loop 8 - 2026-07-16 - Timed full-screen Session Hold

- **Start HEAD:** `7af0b29`
- **Target:** inactivity warning and its Continue / End session boundary.
- **Priority:** P1 timeout recovery plus P2 system coherence.
- **Problem:** the warning was a small generic modal with no visible deadline;
  its pointerdown also bubbled to the Stage activity handler, which could hide
  the warning before its button click completed.
- **Direction:** treat inactivity as a full-screen SESSION HOLD issued by the
  machine, with the real deadline as the dominant typographic object.
- **Changes:** replaced the card with a full 1080x1920 editorial composition;
  added a live 15-to-0 counter; made Continue the dominant action; retained a
  quiet End session action; stopped overlay pointerdown propagation; added
  modal semantics, specific labels, large touch targets, and focus treatment.
- **Performance:** one 1-second local interval, cleared on unmount; no rAF,
  media, asset, listener, or continuous layout read added.
- **QA:** warning trigger and countdown passed; automatic reset passed;
  timed Continue preserved Edition; a second timed warning followed by End
  session returned to Idle; JP support copy passed; 1080x1920 overflow 0;
  browser console/hydration warnings 0. Final build after removing repetitive
  assertive live-region behavior compiled in 4.5s and returned HTTP 200.
- **Independent critique:** initial implementation failed the screen-reader
  cadence review because dialog-wide assertive live updates could repeat every
  second. Removed that attribute while retaining alertdialog semantics.
- **Commit / push / PR:** `turn inactivity into a timed session hold`; normal
  push to PR #7, which remains open.
- **Result:** 合格 (pass).
