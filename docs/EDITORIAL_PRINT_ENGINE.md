# THE RECEIPT — Editorial Print Engine

## What this machine is

Not a photo booth. Not a web app. A small **editorial print engine**: it
captures a moment, composes it, proofs it, and **issues it as a limited,
collectible print**. The customer-facing language, copy and visuals are
deliberately free of perfume / scent / fragrance references.

## Experience spine

```
IDLE → SELECT AN EDITION → FRAME → CAPTURE → PROOF → ISSUING → COLLECT
```

(Existing internal phases `idle → scent → format → pose → capture → printing →
done` are unchanged in code; only the customer-facing naming and copy move to
the editorial vocabulary.)

## Editions (replaces the scent selection)

Four limited editions, one graphic idea each, shown one-per-screen on a
vertical scroll-snap sequence (no four-up menu):

| No. | Edition    | Character                        | legacy scent (internal, hidden) |
|-----|------------|----------------------------------|---------------------------------|
| 01  | RAW        | First light, unedited.           | cold                            |
| 02  | STILL      | Held, composed, exact.           | clean                           |
| 03  | BOLD       | High contrast. Nothing hidden.   | warm                            |
| 04  | AFTERIMAGE | The trace a moment leaves.       | nocturne                        |

### Perfume removal — how it was done (adapter, non-breaking)

- `app/lib/edition.ts` keeps the `Scent` type, `SCENTS`, and every field the
  printed artefact + backend renderer need. **Nothing renamed or removed.**
- Added an **Edition adapter**: `EDITIONS`, `editionForScent(scent)`,
  `scentForEdition(edition)`. Editions are a *display* layer over the legacy
  scent, so the backend contract (PR #2) is untouched.
- Customer-facing surfaces now speak Edition, not scent:
  - Select screen → `SELECT AN EDITION`, hero = edition code, no notes / mood /
    fragrance / destination.
  - `BoardingPass` stub: `FRAGRANCE / {scent.name}` → `EDITION / {no} · {code}`.
  - `MagazineCover`: `Scent · Photo` → `Edition · Print`; metadata `Scent` →
    `Edition`; footer line = edition character; statement de-perfumed.
  - `i18n.ts` customer copy (idle tagline / cta / location / cycle / marquee,
    format names, pass title/airline, pose label) de-perfumed.
  - `IdleScreen`: `PARFUM RECEIPT STUDIO` → `THE RECEIPT · PRINT STUDIO`;
    `SCENT BECOMES MEMORY` → `A MOMENT, ISSUED`. The silver-lips ritual (the
    protected idle signature) is otherwise unchanged.

## Design principles (see MOTION_SYSTEM.md, UI_QA_REPORT.md)

- Paper white / ink black / registration gray. Metallic silver only as a
  **functional print mark** (edition seal, registration, crop, proof stamp) —
  never a floating chrome object.
- One hero per screen; the printed artefact is the final hero.
- English primary, Japanese support. 1080×1920, touch-first, generous targets.
- Motion limited to four families: TYPE SET · PAPER CUT · REGISTRATION LOCK ·
  PAPER FEED. Tokens in `globals.css` (`--motion-*`, `--ease-*`, `--stagger-*`).

## Status

**Phase 1** (shipped earlier on this branch): design/motion tokens, the
Edition adapter + full customer-facing de-perfuming, docs.

**Phase 2** (this pass) — the printing ritual and kiosk operability:

- **ISSUE CORE** — a four-blade metal sculpture, the machine's signature
  object, visible only during Printing and driven entirely by real print
  state (never a decorative loop). See `ISSUE_CORE.md`.
- **Proof Lock** — Review → Printing is now a short, deliberate commit
  ritual (button removed, registration marks converge, serial/edition
  confirmed) instead of an instant cut, preventing double-tap/double-print.
- **Capture registration** — the 3-frame contact sheet now reads as
  print-position registration (`FRAME 01 · REGISTERED` + crop marks) rather
  than a plain numbered grid.
- **Printing state machine** — `review → proofLock → preparing → registered →
  issuing → completing → ready`, one direction, shared by PASS and FILM,
  implemented in `PrintingScreen.tsx`.
- **Error recovery** — CAMERA UNAVAILABLE / PRINTER OFFLINE / PAPER EMPTY /
  PRINTING PAUSED, session state preserved across retry. See
  `ERROR_RECOVERY.md`.
- **Staff Mode** — hidden long-press + PIN, machine status, one working test
  action. See `STAFF_MODE.md`.
- **Inactivity** — a shared warning ("Session still active?") before an
  auto-reset, excluded during Printing/Capture/Error. See `app/lib/inactivity.ts`.

PASS/FILM paper geometry, photo sizes, crop, print-slot dimensions and feed
direction are unchanged by this phase — see `UI_QA_REPORT.md` for the
regression check.
