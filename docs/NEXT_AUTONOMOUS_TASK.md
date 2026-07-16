# NEXT AUTONOMOUS TASK

## Current HEAD

`9581fd6a769b39a37686a1e02a1b70a6c34c5b70`

## Current Preview

Production build at `http://localhost:3090`, 1080x1920 portrait, HTTP 200.

## Current Quality Status

Edition already uses one full-screen edition per scroll-snap scene. The bottom
hint only says Scroll, provides no destination, and is not actionable.

## Remaining Problems

- Guests cannot see which edition is next.
- There is no touch alternative for moving between edition pages.
- The final page has no direct return to the first edition.

## Selected Priority

P2: replace the generic scroll cue with contextual edition navigation.

## Why This Is Next

The edition catalogue is visually strong but its navigation is less explicit
than Format and Frame Selection. A bounded page-turn control improves clarity
without turning the screen into a conventional menu.

## Files Likely Involved

- `app/kiosk/screens/ScentScreen.tsx`
- `docs/UI_QA_REPORT.md`
- `docs/AUTONOMOUS_DESIGN_LOG.md`

## Acceptance Criteria

- Each non-final page names and opens the next edition.
- The final page offers a direct return to the first edition.
- Native scroll and scroll snap remain functional.
- Page turns honor reduced motion.
- Edition selection, EN/JP support, and 1080x1920 geometry remain unchanged.
- Controls meet the 44px touch minimum and have clear accessible names.

## Regression Risks

- Programmatic scrolling could target the document instead of the kiosk rail.
- Smooth scrolling could ignore reduced-motion preference.
- The new control could compete visually with Select this edition.

## Verification Plan

- TypeScript, diff check, and production build.
- Tap through RAW, STILL, BOLD, AFTERIMAGE, then return to RAW.
- Verify scrollTop increments by exactly one viewport.
- Verify reduced-motion uses an instant page turn.
- Check selection, overflow, console, and network.

## Completion Result

PASS. The bounded page-turn control moved RAW to STILL, BOLD, and AFTERIMAGE
at exact 1920px viewport increments, then returned to RAW at scrollTop 0.
Native scroll snap remains in place, controls are 96px high with descriptive
accessible names, and the reduced-motion branch changes smooth movement to an
instant page turn. RAW selection still opened Format. Production build,
TypeScript, diff check, and 1080x1920 overflow checks passed.
