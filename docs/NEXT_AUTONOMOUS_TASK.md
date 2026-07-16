# NEXT AUTONOMOUS TASK

## Loop Number

8

## Current HEAD

`7af0b29d346f928d01942e74a34c4173b0e20c32`

## Remote HEAD

`7af0b29d346f928d01942e74a34c4173b0e20c32`

## Current Preview

Production build at `http://localhost:3090`, PID 75876, 1080x1920 portrait,
HTTP 200. Preview source matches current HEAD.

## Current Quality Status

Inactivity protection correctly warns 15 seconds before reset and excludes
Capture, Printing, Error, and Done. Its current visual is a small centered card
with no remaining-time display, unlike the full-screen editorial machinery used
by the rest of the kiosk.

## Remaining Problems

- Guests cannot see how long remains before privacy reset.
- The generic modal/card composition weakens the print-engine identity.
- Continue and End session have equal visual weight despite different intent.

## Selected Priority

P1/P2: turn inactivity warning into a full-screen, timed session-hold surface.

## Why This Task Is Next

An unexpected reset can discard a guest's in-progress choices. Showing the real
15-second deadline improves recovery and transforms a generic overlay into a
coherent part of the kiosk's issuing system.

## User Impact

Guests can immediately understand the deadline, continue with one dominant
action, or deliberately clear the session with a quieter secondary action.

## Files Likely Involved

- `app/components/InactivityWarning.tsx`
- `docs/UI_QA_REPORT.md`
- `docs/AUTONOMOUS_DESIGN_LOG.md`

## Acceptance Criteria

- The overlay displays a live 15-to-0 second countdown.
- Continue is dominant; End session remains clear but secondary.
- Buttons are at least 80px high with visible focus and exact labels.
- Continue closes the warning and rearms inactivity.
- End session clears state and returns to Idle.
- Interval cleanup is guaranteed on unmount.
- EN/JP, reduced motion, 1080x1920, and underlying flow remain intact.

## Regression Risks

- A local interval could outlive the warning.
- Pointer activity on the overlay could rearm before the chosen action runs.
- The large counter could crowd Japanese support copy.

## Verification Plan

- TypeScript, diff check, production build, current guideline audit.
- Wait for warning in production and observe countdown decrement.
- Test Continue, re-trigger, then End session and privacy cleanup.
- Check EN/JP, focus, overflow, console, hydration, and HTTP.

## Completion Result

PASS. The warning now occupies the full 1080x1920 surface, presents a live
15-second session-hold counter, and gives Continue visual priority over End
session. Production timing reached the warning, counted down, and auto-reset.
In separate timed passes, Continue dismissed the warning while preserving the
Edition screen, and End session returned to Idle. Stopping pointer propagation
kept the Stage activity handler from unmounting the dialog before button click.
The interval cleans up on unmount. Final TypeScript, production build, HTTP,
overflow, console, and hydration checks passed.

## Stop Condition

Historical autonomous Loop 8 is complete. No additional P0-P2 issue was found
that can be improved safely without repeating already-passed visual work. The
remaining validation requires Raspberry Pi camera, printer, paper, and thermal
load hardware. Resume from real-device integration evidence, not another
speculative layout pass.
