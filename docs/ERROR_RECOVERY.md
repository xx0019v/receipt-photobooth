# Kiosk error recovery

## States

Defined in `app/lib/errors.ts` (`ErrorKind`), rendered by
`app/kiosk/screens/ErrorScreen.tsx`. White background, one short title, one
line of cause, at most two actions:

| Kind | Title | Actions |
|---|---|---|
| `camera` | CAMERA UNAVAILABLE | RETRY CAMERA · RETURN TO IDLE |
| `printer-offline` | PRINTER OFFLINE | RETRY · RETURN TO PROOF |
| `paper-empty` | PAPER EMPTY | CALL STAFF · RETURN TO PROOF |
| `print-failed` | PRINTING PAUSED | RETRY PRINT · RETURN TO PROOF |

(`print-failed` intentionally uses the softer "PRINTING PAUSED" wording per
spec — "PRINT FAILED" was judged too alarming for a guest-facing screen.)

## State preservation

`KioskApp` owns `frames`, `serial`, `edition`, `issuedDate`, `issuedTime`,
`selectedQuote`, `selectedChromeMotif` for the whole session. Entering the
`error` phase does not touch any of them — `retryFromError` simply returns to
`printing` (or `returnToProofFromError` back to the Review stage) with the
exact same session data, so:

- serial / edition / issue date / quote are **never regenerated** on retry.
- the PASS/FILM artefact is byte-identical before and after a recovery.
- `PrintingScreen` is remounted (keyed by a `printAttempt` counter) on every
  fresh attempt so its internal ritual state (`review → proofLock → … →
  ready`) always restarts clean — this also fixes a real bug found during QA:
  re-triggering a print while already in the `printing` phase did not
  previously remount the component (the `phase` value hadn't changed), so a
  retry could silently reuse a finished ritual's state instead of restarting.

## Double-print protection

The PRINT button only exists in the `review` stage; the instant a guest taps
it, `PrintingScreen` moves to `proofLock` and the button is gone from the DOM
— there is no disabled-but-present button to double-tap. A print failure
mid-`issuing` transitions straight to the `error` phase; retry starts a brand
new ritual (new `printAttempt` key) rather than resuming a half-finished one,
so nothing can be issued twice.

## Backend status (honest gap)

No backend emits `camera`, `printer-offline`, or `paper-empty` today — PR #2
owns the camera/printer/paper hardware integration and this phase did not
modify it. Only the types (`ErrorKind`), the screen, and one **Staff-Mode-only**
test trigger (`TEST PRINT (simulate failure)`, which forces a `print-failed`)
exist. There is no test trigger visible in a normal guest session — Staff Mode
requires the hidden long-press + PIN (see `STAFF_MODE.md`), and is inert
entirely when `NEXT_PUBLIC_STAFF_PIN` is unset.

## Inactivity during recovery

`useInactivity` (see below) is not armed while `phase === "error"` — a guest
mid-recovery is never auto-reset.
