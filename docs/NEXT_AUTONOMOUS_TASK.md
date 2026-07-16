# NEXT AUTONOMOUS TASK

## Loop Number

7

## Current HEAD

`0ce0783828756e2e2341cf20ea8aea5a55f86f35`

## Remote HEAD

`0ce0783828756e2e2341cf20ea8aea5a55f86f35`

## Current Preview

Production build at `http://localhost:3090`, PID 74018, 1080x1920 portrait,
HTTP 200. Preview source matches current HEAD.

## Current Quality Status

PASS Done keeps the ticket dominant and clearly connects it to the right-side
collection slot. Manual reset is safely bounded to one button. During live QA,
only 4 seconds remained by the time the completed artifact was visually
reviewed, and the button still said Tap anywhere although the full surface is
intentionally non-interactive.

## Remaining Problems

- The 12-second reset gives little time to inspect and physically collect the
  artifact before the next guest screen appears.
- The English action label contradicts the bounded-button interaction.
- The countdown says New edition although the event is a privacy reset.

## Selected Priority

P1: align Done reset timing and copy with the physical collection interaction.

## Why This Task Is Next

The mismatch is visible on every completed session and can rush collection or
mislead a guest into tapping the artifact. It is higher impact than decorative
refinement and does not alter backend or print contracts.

## User Impact

Guests receive a calmer 20-second collection window and an exact Start next
session action. The countdown clearly explains the automatic reset.

## Files Likely Involved

- `app/kiosk/screens/DoneScreen.tsx`
- `app/lib/i18n.ts`
- `docs/UI_QA_REPORT.md`
- `docs/AUTONOMOUS_DESIGN_LOG.md`

## Acceptance Criteria

- Automatic reset occurs at 20 seconds for PASS and FILM.
- The button says Start next session, not Tap anywhere.
- EN and JP countdowns state that an automatic reset will occur.
- The progress line starts full and reaches zero with the countdown.
- Manual reset remains restricted to the bounded button.
- Artifact, collection direction, privacy cleanup, and 1080x1920 geometry stay.

## Regression Risks

- A longer timeout could retain session imagery longer than intended.
- Copy could wrap in JP or compete with the countdown.
- Interval and timeout cleanup could diverge.

## Verification Plan

- TypeScript, diff check, copy audit, production build.
- PASS and FILM Done entry, 20-second countdown, manual and automatic reset.
- EN/JP layout, button geometry, artifact hierarchy, overflow, console, network.
- Confirm previous-session photos clear on reset.

## Completion Result

PASS. FILM reached Done through the complete production flow with its 3-frame
order and serial intact. Done initially announced Start next session and Auto
reset in 20s, retained 1080x1920 geometry, and returned to Idle automatically.
The completed artifact and prior-session frame content were absent after reset.
TypeScript, diff check, production build, console, hydration, and overflow
checks passed.
