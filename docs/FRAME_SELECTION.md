# Frame Selection — 6 captured, 3 chosen, in order

## Why 6 capture / 3 print

The kiosk now captures 6 frames and the guest picks 3, in the order they want
them printed. 6 is a fixed number, not a setting: enough choice to be worth
offering, short enough to not stall the kiosk's throughput, and it pairs
cleanly with the fixed 3-photo PASS/FILM layout (which is unchanged — see
"Protected surfaces" below). 8+ was explicitly ruled out.

## Screen flow

```
capture (6 frames)
  → registeringFrames (FRAME CORE, 1.2–1.8s, one-shot)
  → selectFrames (FrameSelectionCarousel, pick exactly 3 in order)
  → printing (review/proof stage) — unchanged from Phase 2
  → proofLock → preparing → registered → issuing → completing → ready → done
```

`selectFrames` never jumps straight to `printing`'s issuing stage — it always
lands on `printing`'s `review` stage first (the Proof), matching the required
"must pass through Proof" rule; `printing`'s own state machine (Proof Lock +
ISSUE CORE) is untouched.

## State

All in `app/kiosk/KioskApp.tsx`:

- `capturedFrames: number[]` — the 6 raw captures, **never reordered**.
- `frames: number[]` — becomes the 3 *selected* ids, in the guest's chosen
  print order, once Select confirms. This is the same `frames` state that
  already fed `BoardingPass` / `MagazineCover` in Phase 1/2 — no downstream
  consumer changed.
- Selection order itself (`selectedIds`) is local `useState` inside
  `SelectFramesScreen` — a plain ordered array of stable frame ids (the shot
  index, 1-based), not a re-derivable index list, so toggling a selection off
  automatically re-numbers the remaining ones (array splice semantics) without
  any manual re-indexing code.
- `retakeAll()` resets both `frames` and `capturedFrames` and returns straight
  to `capture` (not `pose`) — this is also now what the existing PASS/FILM
  Proof screen's "Retake" button does, per the updated spec for this phase.

## `FrameSelectionCarousel`

`app/components/FrameSelectionCarousel.tsx`. Single source of truth:
`activeIndex` (an integer), passed down from `SelectFramesScreen`. No
`requestAnimationFrame` loop exists anywhere in this component:

- The stage is a flex row of 6 fixed-width (620px) items with a `gap`; its
  `transform: translateX()` is computed directly from `activeIndex` and (while
  dragging) a live `dragX` pixel offset. Settling is a plain CSS `transition`
  (320ms, `cubic-bezier(0.22, 0.61, 0.36, 1)`), not JS-interpolated.
- Drag: `onPointerMove` sets `dragX` directly from the pointer position (no
  rAF, no per-frame React state churn beyond the one number). A vertical-swipe
  guard ignores movement that's clearly not horizontal.
- Tap vs. drag: total horizontal movement is tracked in a ref during the
  gesture; under 8px of movement counts as a tap (toggles selection of the
  frame under the pointer), otherwise the gesture commits a step navigation
  once past a 56px threshold.
- `setPointerCapture`/`releasePointerCapture` are both wrapped in
  `try {} catch {}` (adopted from Box Carousel's defensive pattern) — this
  also fixed a real bug found during QA (below).

### A bug found and fixed during QA

Automated pointer-event testing (dispatching synthetic `PointerEvent`s with a
fabricated `pointerId`) revealed that `setPointerCapture` can throw for a
`pointerId` the browser doesn't recognize as an active pointer. Without a
`try/catch`, that exception aborted `onPointerDown` before `dragState.current`
was set, silently breaking every subsequent tap/drag on that gesture (visible
in Next.js's dev overlay as "1 Issue"). Wrapping the call in `try {} catch {}`
(matching the reference Box Carousel's own defensive style) fixed it — real
touch/mouse input always supplies a valid pointer id, but the fix is free
insurance against edge cases (e.g. a pointer that cancels mid-capture).

## Arc thumbnail rail

6 buttons below the stage, each an 88×88px touch target (spec minimum) with a
visually smaller inner square: 104px active / 84px adjacent / 64px outer,
opacity 1 / 0.78 / 0.5, and a small downward `margin-bottom` offset (0 / 10px
/ 22px) standing in for the "gentle arc" — computed directly from
`|i - activeIndex|`, no continuous MotionValue, no physics.

## Selection marks, order, and the print-order strip

- The active photo shows 4 corner registration ticks (`.proof-lock-mark`,
  reused from Phase 2's Proof Lock) — thin/pale when unselected, solid ink
  when selected.
- A selected photo shows `PRINT 0N` in its corner, N being its position in
  `selectedIds` — not a checkmark, not a colour.
- Below the stage, "Print order" shows 3 small squares (`01`/`02`/`03`);
  empty ones show just the number, filled ones show the actual selected
  photo and are tappable to jump the carousel back to that frame.
- Selecting a 4th frame while 3 are already chosen is a no-op (the toggle
  handler checks `prev.length >= TOTAL_SHOTS` and returns unchanged).

## REGISTERING FRAMES / FRAME CORE

`app/kiosk/screens/RegisteringFramesScreen.tsx` +
`app/components/motion/FrameCore.tsx`. A fixed-duration (clamped 1.2–1.8s)
one-shot interstitial: `unprocessed → indexing → registering → ready`, where
`indexing` steps through the 6 captured frames one at a time
(`registeredCount` prop, 0→6) so the object visibly "reads" each of the 6
photos before settling. See `ORIGINKIT_USAGE.md` for the full audit of why
the supplied 12 SVGs were not used (they turned out to be the project's own
existing chrome-motif library, byte-identical to `public/assets/chrome/*`,
each a single embedded raster with no fragmentable vector structure) and why
FRAME CORE is a separate, smaller sculpture from ISSUE CORE rather than a
reused/retextured copy of it.

A faint, one-shot reflection sourced from the supplied `pc：wiget.mp4` — this
one *was* usable after optimization (6.5MB/2880px/32fps → 63KB/640px/24fps,
1.625s, muted, no loop) — plays once behind the sculpture only during the
`registering` state, at 0.3 opacity with `mix-blend-mode: multiply`, and is
replaced entirely by a static poster image under `prefers-reduced-motion`.
See `ORIGINKIT_USAGE.md` for the full before/after table.

## Reduced motion

- `FrameCore` and `FrameSelectionCarousel` both read
  `prefers-reduced-motion` via `matchMedia` and disable their CSS
  transitions entirely (state still advances on the same timers/logic — only
  the visual interpolation is skipped).
- Selection, navigation, and confirmation all still work identically under
  reduced motion — nothing is gated behind an animation completing.

## PASS / FILM mapping

No change to `BoardingPass.tsx` or `MagazineCover.tsx` — both already read
`frames[0..2]` positionally. `SelectFramesScreen` simply hands
`confirmSelectedFrames` the 3 chosen ids in the guest's order, which become
`frames`, which both artefacts already consume unmodified. Verified live for
both PASS and FILM in production preview (see final report).

## Privacy

The camera is still a synthetic placeholder (`Portrait`, seeded by shot
index — no real photo bytes exist yet; PR #2 owns the real camera/printer
backend). Structurally: `capturedFrames` and `frames` are cleared on both
`reset()` (NEW SESSION) and `retakeAll()`, so no session's frame ids leak into
the next guest's session state. There are no `URL.createObjectURL` calls
anywhere in this codebase yet, so there is nothing to revoke — once a real
camera backend lands, that backend's integration is responsible for revoking
any object URLs it creates, following this same reset/retake cleanup point.

## Known gaps

- Step-count labels in `i18n.ts` were renumbered (Proof: IV→V, Boarding:
  V→VI) to account for the new Select step, but `SelectFramesScreen`'s own
  copy ("Step IV · Select", "Selected N / 3", etc.) is inline English+JP
  rather than routed through the central `i18n.ts` dictionary like every
  other screen. Functionally bilingual (EN primary, JP `sub` line), just not
  centralized — worth folding into `i18n.ts` in a follow-up pass.
- No dedicated inactivity timeout was added for `selectFrames` /
  `registeringFrames` (the existing 60s timeout only covers
  scent/format/pose) — a guest could sit on Select indefinitely. Not a
  regression (no prior screen after Capture had a timeout either), but not
  new coverage.
- `cameraError` (section 47 of the brief) has no real trigger — there is no
  camera backend yet to fail. The `ErrorScreen`/`ERROR_COPY.camera` path from
  Phase 2 remains ready for it.
