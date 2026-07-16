# NEXT AUTONOMOUS TASK

## Current HEAD

`51fd01ecc4f5442908eefb8bd7d3498a1e629f35`

## Current Preview

Production build at `http://localhost:3090`, 1080x1920 portrait, HTTP 200.

## Current Quality Status

PASS and FILM complete successfully, but Done currently treats the entire
screen as the NEW SESSION button. That couples the physical collection area
to a destructive session reset.

## Remaining Problems

- Collecting the paper can accidentally reset the session.
- NEW SESSION is visually described in the footer but has no bounded control.
- The collection instruction needs stronger spatial connection to the printer
  outlet without reducing the paper hero.

## Selected Priority

P1: separate paper collection from session reset on PASS Done and FILM Done.

## Why This Is Next

Done is the final physical handoff. An accidental reset at the moment the
guest reaches for the print is a higher risk than further decorative polish.

## Files Likely Involved

- `app/kiosk/screens/DoneScreen.tsx`
- `docs/UI_QA_REPORT.md`
- `docs/AUTONOMOUS_DESIGN_LOG.md`

## Acceptance Criteria

- The screen background and paper area do not reset the session.
- A clear NEW SESSION control remains available and includes the countdown.
- PASS still directs collection to the right.
- FILM still directs collection below.
- Automatic return remains 12 seconds.
- EN and JP remain legible at 1080x1920.
- Reduced motion, cleanup, serial, issue date, and artefact geometry regressions
  are not introduced.

## Regression Risks

- Removing the full-screen button could reduce the manual reset touch target.
- Footer recomposition could clip at 1920px.
- Nested interactive controls must not be introduced.

## Verification Plan

- TypeScript and production build.
- Production preview at 1080x1920.
- PASS Done and FILM Done visual inspection.
- Confirm only NEW SESSION triggers reset.
- Confirm 12-second automatic reset and clean timer teardown.
- Check console, overflow, and asset requests.

## Completion Result

PASS. Done no longer resets from the paper or background surface. PASS and
FILM expose one bounded NEW SESSION control with the live countdown, while the
12-second automatic return remains unchanged. PASS paper was raised above the
action layer and the collection/action rails now have explicit stacking.
Production build, TypeScript, 1080x1920 PASS/FILM flows, HTTP, overflow, and
console checks passed.
