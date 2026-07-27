# Raspberry Pi print parity — audit

## Refs inspected (fetched from GitHub, not from memory)

| ref | HEAD |
|---|---|
| `origin/main` (current UI source of truth) | `261cd31` |
| `origin/development` | `3e0462f` |
| `origin/feat/2-backend-core` (PR #2 head) | `bd76818` |
| `origin/feat/1-backend-core` (PR #1, closed) | `9515275` |
| working branch | `feat/pi-print-artifact-parity` (off `origin/main`) |

Pull requests: #3–#9 all **MERGED into main**. **#2 is the only OPEN PR**
(`feat/2-backend-core` → `development`) and was left untouched. #1 is CLOSED.

No branch named for `printer` / `pi` / `hardware` / `renderer` exists beyond
`feat/1-backend-core` and `feat/2-backend-core`.

## Root cause

The screen artefact and the printed artefact are **built twice, from two
different design definitions, by two different languages**:

- **Screen** — React: `app/components/BoardingPass.tsx`, `app/components/MagazineCover.tsx`
- **Print** — Python: `backend/booth/receipt.py` re-implements a layout from scratch

Because the Python renderer owns its own layout and copy, every UI change on
`main` silently diverges from what the thermal printer actually emits. Nothing
enforces parity — there is no shared spec, no shared constant, no test.

## Dimension mismatch

| | current `main` (screen) | PR #2 Python renderer (print) |
|---|---|---|
| PASS artwork | **2100 × 620** landscape (`BOARDING_W/H`) | **1000 × 636** landscape |
| PASS physical | 620 × 2100 canvas, rotated once | rotated 90°, scaled to 384 dots |
| FILM artwork | **640 × 1280** portrait | **640 × 760** ("quote card") |
| FILM printed | upright, no rotation | upright |

The FILM renderer is not a scaled version of the screen FILM — it is a
different artefact (a quote card), missing the three-photo vertical strip
proportions of the 640×1280 design.

## Copy / branding mismatch (most severe)

`receipt.py` still prints the **pre-pivot perfume branding that `main`
deliberately removed**:

```python
AIRLINE    = "SCENT MEMORY AIRWAYS"
PASS_TITLE = "SCENT BOARDING PASS"
STUDIO     = "PARFUM RECEIPT STUDIO"
DEFAULT_SCENT = {"code": "SM-001", "name": "AFTER HOURS",
                 "notes": ["Iris", "Black Amber", "Smoke"]}
```

Current `main` is an *Editorial Print Engine*: no SCENT / PARFUM / notes
language anywhere in the customer-facing UI (removed in PR #7). A guest would
see an editorial edition on screen and receive a perfume boarding pass in
their hand. This alone makes the printed output unusable as the product.

Also divergent: `BRAND`/masthead treatment, edition vs scent framing, stub
content, QR placement, barcode geometry, photo count/crop, and metadata rows.

## Silent-fallback dangers found

1. **Unknown style prints anyway.** `receipt.py`:
   `KNOWN_STYLES = ("pass", "cover")` with the documented behaviour
   *"Anything else falls back to the default layout instead of erroring"*.
   A future/unknown style would be printed as a PASS rather than refused.
   The brief forbids this; it must be a 4xx.
2. **`frames` optional.** `POST /print` treats a missing `frames` list as
   "print every captured frame in capture order" — with 6-capture/3-select on
   `main`, a dropped field silently prints **six** photos in the wrong order.
3. **Renderer regenerates values.** `receipt.py` has `edition_date()` /
   `edition_time()` defaulting to `datetime.now()`, so a retry can print a
   different timestamp than the screen showed.
4. **Mock fallback is the default.** `config.py` defaults both drivers to
   `"mock"`; on the Pi, a misconfigured env silently "prints" to a PNG on disk
   while the UI shows success. Nothing distinguishes hardware from mock.

## What is sound in PR #2 (worth porting as-is)

- `printer.py` — mock + ESC/POS drivers, banded raster with a real progress
  callback, usblp (`/dev/usb/lp0`) path plus pyusb fallback.
- `jobs.py` — single-worker `PrintQueue`, real states
  `queued → rendering → printing → done | error`, per-session job reuse.
- `sessions.py`, `camera.py`, `config.py`, deploy units, udev rule.
- Real, scannable QR + `/p/{serial}` share page + `receipt.png` route.

The defect is confined to **`receipt.py` reconstructing the design**.

## Decision — canonical raster handoff (native SVG)

Adopt the brief's first-choice architecture:

1. The frontend owns the design (it already does, on `main`).
2. One session-fixed `PrintArtifactSpec` is frozen when the guest confirms
   their three frames (`app/lib/printArtifact.ts`).
3. The frontend rasterises the artefact into a PNG and hands the backend the
   pixels.
4. The backend **never rebuilds the layout** — it validates, thermalises
   (grayscale → autocontrast → Floyd–Steinberg → 1-bit), prints, and saves the
   exact bytes it printed (`backend/booth/artifact.py`).
5. Unknown style / bad hash / wrong width / runaway height / serial mismatch →
   explicit 422, never a fallback print.

### Why native SVG, not a DOM screenshot

The brief's step 3 originally reads "rasterise the same components." The first
implementation cloned the live `BoardingPass` / `MagazineCover` DOM into an
`<svg><foreignObject>` and drew that to a canvas. **That taints the canvas**:
`canvas.toBlob()` throws `Tainted canvases may not be exported` — reproduced
here even for a bare `<div>` with no images or fonts (Electron/Chromium 148).
The brief itself lists the reasons to avoid html2canvas-style capture (CSS
transform drift, font races, devicePixelRatio, clip-path, Chromium
differences), so this is a documented hazard, not a surprise.

The artefact is therefore drawn as **native SVG** (`app/lib/printSvg.ts`):
`<text>`, `<rect>`, `<line>`, `<image>` — no `foreignObject`. It rasterises
cleanly and identically across browsers and on the Pi. Parity holds because the
SVG reads every value from the one `PrintArtifactSpec` and every dimension from
the same constants the React components export (`BOARDING_*`, `ARTWORK`). The
on-screen review still uses the React components; the print SVG is the
sanctioned **thermal translation** of that same design and data — same regions,
same photo order, same metadata, same proportions, monochrome — which is
exactly the difference §10 permits.

### Verified (mock backend, Print Artifact Inspector)

| | PASS | FILM |
|---|---|---|
| artwork | 2100 × 620 landscape | 640 × 1280 portrait |
| print canvas | 620 × 2100 (rotated once, in SVG) | 640 × 1280 (no rotation) |
| raster @ 384 dots | 384 × 1301 | 384 × 768 |
| physical @ 8 dot/mm | 48 × 162.6 mm | 48 × 96 mm |
| black ratio | 5.0 % | 4.6 % |
| frame order | [4, 1, 6] | [4, 1, 6] |
| QR | real, `/p/{serial}` | none |
| `receipt.png` == `artifact-thermal.png` | byte-identical | byte-identical |

Golden rasters for both live in `backend/tests/golden/`; `test_golden.py`
re-thermalises each source and asserts it reproduces the committed 1-bit image
byte-for-byte.

## Ported (additive only)

`backend/**`, `deploy/**`, `docs/backend-requirements.md`, `app/lib/api.ts`.
**No frontend file from PR #2 was applied** — those are older than `main`
(verified: the only `app/` path added is `app/lib/api.ts`).
