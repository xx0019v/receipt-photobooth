# NEXT AUTONOMOUS TASK

## Current HEAD

`d99e66267273d0f07ca0ab393c832db4b8874a5b`

## Current Preview

Production build at `http://localhost:3090`, 1080x1920 portrait, HTTP 200.

## Current Quality Status

Format presents PASS or FILM at dominant scale and has a large edge switch,
but it does not implement the swipe path called for by the interaction brief.

## Remaining Problems

- PASS and FILM cannot be changed with a direct paper swipe.
- The edge switch always points right, even when returning from FILM to PASS.
- Selection changes should be announced as state changes.

## Selected Priority

P1: add a robust horizontal swipe alternative to Format selection.

## Why This Is Next

Format is the second-highest priority surface after Done. A visible button
must remain, but the large paper surface should also support the natural
gesture promised by the interaction direction.

## Files Likely Involved

- `app/kiosk/screens/FormatSelectScreen.tsx`
- `docs/UI_QA_REPORT.md`
- `docs/AUTONOMOUS_DESIGN_LOG.md`

## Acceptance Criteria

- Swipe left selects FILM and swipe right selects PASS.
- Vertical movement and short taps do not change the format.
- The existing edge button remains at least 88px wide and works by tap.
- The edge label communicates the correct direction.
- The selected format is exposed through an aria-live status.
- PASS/FILM paper size, Continue action, EN/JP, and downstream mapping remain.

## Regression Risks

- Pointer capture could interfere with the edge switch.
- A small movement could cause an accidental format change.
- Selection might toggle twice if button events bubble into the swipe region.

## Verification Plan

- TypeScript, diff check, and production build.
- 1080x1920 tap, left swipe, right swipe, short tap, and vertical gesture.
- Confirm selected state and downstream PASS/FILM Proof mapping.
- Check console, pointer errors, overflow, and reduced-motion behavior.

## Completion Result

PASS. A 140px controlled horizontal gesture selected FILM to the left and
PASS to the right. A tap and a 180px vertical gesture left FILM unchanged.
The edge control remained 88x320 and selected FILM by tap. Selection status is
announced through aria-live. Production build, TypeScript, 1080x1920 overflow,
pointer, and console checks passed.
