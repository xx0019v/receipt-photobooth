# Staff Mode

## Access

`app/components/StaffMode.tsx` renders one invisible 96×96px button in the
stage's bottom-left corner on every screen (`aria-hidden`, `opacity-0`,
`tabIndex={-1}` — never visible or reachable by keyboard/tab order for a
guest). A 3-second hold opens a 4-digit PIN pad; a correct PIN opens the
panel.

The PIN comes from `NEXT_PUBLIC_STAFF_PIN`. **If it is unset, `StaffMode`
returns `null` and the hotspot does not render at all** — Staff Mode is
completely inert in any deployment that hasn't explicitly configured a PIN.
The PIN is a client-exposed `NEXT_PUBLIC_*` var by necessity (this is a static
kiosk build with no server to hold a secret) — it is a physical-access
convenience gate, not a security boundary; treat it like a lock-screen code
for a device staff already has physical access to.

## Panel contents

- **Machine status** — CAMERA / PRINTER / PAPER, each shown as `NOT
  CONNECTED`. This is deliberately honest: no backend is wired to this build
  (PR #2 owns hardware integration), so nothing here claims a connection it
  doesn't have.
- **Test camera** — disabled, with the note "No camera backend wired".
- **Test print (simulate failure)** — the one working test action. Runs one
  full issuing cycle and forces a `print-failed` recovery screen, for QA of
  `ERROR_RECOVERY.md`'s retry path without needing a real printer fault.
- **Reprint last job** — disabled unless a job was completed this session
  (`lastJob`, set in `KioskApp.claim()`); even then it's disabled because
  there's no printer backend to actually reprint through — it shows the
  serial as a status line, not a working action, per the "don't display a
  broken feature as working" rule.
- **Clear current session** — resets to Idle exactly like a guest-triggered
  reset.
- **Return to idle** / **Exit staff mode**.

## What Staff Mode does not do

It does not touch ISSUE CORE as decoration — the one place it invokes the
sculpture is indirectly, by running the same Printing ritual (through TEST
PRINT) any guest print goes through. It does not fabricate camera/printer
telemetry. It is not reachable while a guest's session data is at risk of
being clobbered mid-print — the trigger corner is always present (so staff
can always reach it), but nothing in the panel forces a phase change without
an explicit tap.
