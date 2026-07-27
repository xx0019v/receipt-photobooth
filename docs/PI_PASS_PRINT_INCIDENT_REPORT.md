# Incident — Raspberry Pi printed the old PASS design

## Summary

A guest-facing PASS printed on the Pi came out as the **pre-pivot "SCENT
BOARDING PASS"** (perfume branding, 1000×636 Python layout), not the current
editorial `BoardingPass` shown on screen (2100×620, "THE RECEIPT").

## Evidence (this repo, reproduced locally)

- `docs/pi-print-incident/actual-printed-pass.png` — a local reproduction made
  by running the PR #2 candidate `backend/booth/receipt.py`. 384×603, `SCENT MEMORY
  AIRWAYS` / `SCENT BOARDING PASS` / `FRAGRANCE … Iris · Black Amber · Smoke`.
- `docs/pi-print-incident/expected-current-pass.png` — the canonical raster
  from the current design (384×1301, editorial, photos in print order, real QR).
- `docs/pi-print-incident/comparison.png` — the two side by side.

## Code-level cause reproduced; live incident cause still pending Pi evidence

The repository proves that cause **E (two design definitions)** can reproduce
the reported output. It does **not** prove which commit, service, or renderer
ran on today's Pi; that remains pending live systemd/journal/artifact evidence.

1. `origin/main` (`261cd31`) ships **no `backend/` and no print wiring**:
   `git ls-tree origin/main | grep ^backend/` → 0 files; `app/lib/api.ts` is
   absent; the only print code is `PrintingScreen.startPrintRitual`, a
   *simulated* timer animation with no network call.
2. The available Pi backend candidate in **PR #2
   (`feat/2-backend-core`)** has `backend/booth/receipt.py`, which
   re-implements the artefact in Python:
   - `receipt.py:163` → `W, H = 1000, 636` (PASS)
   - `receipt.py:38-41` → `AIRLINE = "SCENT MEMORY AIRWAYS"`,
     `PASS_TITLE = "SCENT BOARDING PASS"`, `STUDIO = "PARFUM RECEIPT STUDIO"`
   - `receipt.py:257` → `W, H = 640, 780` (COVER = a quote card, not the
     640×1280 FILM)
3. Any Pi process using that route would print the Python layout. Confirming
   that today's service used this exact checkout/import path requires SSH.

This is the strongest code-supported explanation and the local reproduction
matches the reported stale perfume layout. It is not labeled the final
physical root cause until the Pi evidence is captured.

Contributing factors: the legacy `POST /print` defaulted unknown styles to the
PASS layout (silent fallback), and `receipt.py` regenerated its own date/scent
defaults, so even a correct call could not reproduce the on-screen edition.

## Corrective action (in `fix/pi-pass-physical-print-parity`)

- One canonical `PrintArtifactSpec`, frozen once per edition
  (`app/lib/printArtifact.ts`).
- A single native-SVG print renderer (`app/lib/printSvg.ts`) drawing PASS and
  FILM from that spec + the components' own dimension constants — no second
  layout, no `foreignObject` screenshot.
- New endpoint `POST /api/sessions/{sid}/print-artifact`: the kiosk uploads the
  exact pixels + SHA-256; the backend validates, thermalises, prints, and never
  rebuilds a layout (`backend/booth/artifact.py`, `main.py`, `jobs.py`).
- The legacy `/print` route now **refuses unknown styles (422)** instead of
  defaulting to PASS; `receipt.py` is no longer on the print path.
- `NEXT_PUBLIC_BOOTH_MODE=hardware` disables every mock fallback; the kiosk
  polls the real job and never shows Done unless the backend says `done`.
- Real camera JPEGs flow through Capture, frame selection, proof, PASS/FILM
  and the canonical SVG. Hardware mode refuses missing photos, QR, motif,
  manifest fields, wrong geometry, or a mock driver.
- Every job writes `manifest.json`, source/thermal/final/payload PNGs,
  `job-state.json`, and `print.log` under
  `sessions/{serial}/print-jobs/{job-id}/`.
- A different hash/key for the same session is HTTP 409. Explicit retry may
  requeue only a zero-band failure; any possible partial print is blocked for
  operator inspection.

## Recurrence prevention

- `backend/tests/test_golden.py` pins the PASS/FILM thermal rasters
  byte-for-byte; any layout drift fails CI.
- `backend/tests/test_artifact.py` + `test_api.py` reject unknown style, hash
  mismatch, wrong width, oversized/broken PNG, and serial mismatch.
- Deploy note: the Pi must serve a `ui-dist` built from this branch AND run this
  branch's backend; the two are now the same design definition, so a partial
  deploy can no longer split them.

## NOT verified — needs the physical Pi

This report was produced **without access to the Raspberry Pi** (no SSH path
exists from the build environment: no `~/.ssh/config` entry, `known_hosts` holds
only `github.com`, no `ssh`/`scp`/`rsync` history to the Pi, and no host/IP in
the repo). The following were therefore **not** done and must not be reported as
done:

- reading the Pi's live `systemctl` / `journalctl` for today's job
- capturing the Pi's actual `receipt.png` from today's incident
- a photograph of the physical misprint
- deploying this branch to the Pi and physically reprinting
- confirming the reprinted PASS matches the screen on paper

Connection discovery attempted on 2026-07-27 JST: repository/docs/deploy
search, `~/.ssh/config`, `known_hosts`, zsh/bash history, ARP cache, Bonjour
`_ssh._tcp`/`_workstation._tcp`, and common documented hostnames. No exact Pi
host was identifiable, so no address was guessed and no unrelated machine was
contacted.

`actual-printed-pass.png` here is a faithful **local reproduction** of the Pi's
renderer output, not the physical artefact that came out of the machine.
