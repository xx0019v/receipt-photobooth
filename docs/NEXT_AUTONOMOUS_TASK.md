# NEXT AUTONOMOUS TASK

## Loop Number

6

## Current HEAD

`5ba20c84941588ed3bb2aefa123fe53be56d0081`

## Remote HEAD

`5ba20c84941588ed3bb2aefa123fe53be56d0081`

## Current Preview

Production build at `http://localhost:3090`, PID 68119, 1080x1920 portrait,
HTTP 200. The build was produced from the current source before commit.

## Current Quality Status

Idle, Edition, Format, Pose, Capture, Registering Frames, and Frame Selection
run in production without overflow. The active Frame Selection proof supports
tap, swipe, and peel, but its selection action exists only on the gesture
surface. Thumbnail buttons only navigate between frames.

## Remaining Problems

- The primary register/deselect action has no explicit bounded control.
- Keyboard and assistive-technology users cannot register the active proof.
- The text hint describes a gesture but does not expose current selection state
  as an actionable control.

## Selected Priority

P1: add an explicit active-proof register/deselect action while preserving all
existing gestures.

## Why This Task Is Next

This is the first functional accessibility gap found during the required full
flow. It has greater user impact than another Done or Format visual adjustment.

## User Impact

Guests gain a clear, forgiving way to add or remove the current frame without
having to discover the photo-surface gesture. Keyboard and assistive technology
receive the same selection capability.

## Files Likely Involved

- `app/components/FrameSelectionCarousel.tsx`
- `docs/UI_QA_REPORT.md`
- `docs/AUTONOMOUS_DESIGN_LOG.md`

## Acceptance Criteria

- A visible control registers or removes the active proof.
- The control exposes `aria-pressed` and a frame-specific accessible name.
- Rapid activation cannot immediately select then deselect.
- Existing photo tap, horizontal swipe, peel/drop, thumbnail navigation,
  3-frame limit, and print order remain unchanged.
- The control is at least 44px high and does not create 1080x1920 overflow.

## Regression Risks

- A second activation path could bypass the rapid-tap guard.
- Added height could crowd the thumbnail arc or bottom action rail.
- Selection state could refer to a stale active frame after navigation.

## Verification Plan

- TypeScript, diff check, current Web Interface Guidelines audit, and build.
- Select/deselect with the explicit control and with the photo surface.
- Navigate by thumbnail and swipe, then select the newly active frame.
- Confirm 3-frame limit, order, Ready action, overflow, console, and network.

## Completion Result

PASS. The 660x60 action rail registers or removes the current proof, exposes
frame-specific accessible names and `aria-pressed`, and shares the existing
220ms rapid-activation lock with the photo gesture. Explicit selection,
deselection, thumbnail navigation, 3-frame order, fourth-frame rejection, and
PASS Proof through Done passed in the production build. The document remained
1080x1920 with no overflow and browser error/warning logs remained empty.
