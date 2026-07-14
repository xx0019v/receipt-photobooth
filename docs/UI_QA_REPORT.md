# UI / QA report — Editorial Print Engine (phase 1)

## Investigation synthesis (read-only audits)

### Current-flow UX (P0–P3)
- **P1** Customer-facing perfume framing (scent / fragrance / notes / mood)
  contradicted the "editorial print engine" concept. → Fixed this phase via
  the Edition adapter + copy de-perfuming.
- **P2** Motion durations were hardcoded per screen (no shared tokens). →
  Added `--motion-*` / `--ease-*` / `--stagger-*` tokens; screens can migrate
  onto them incrementally.
- **P2** Select screen already scroll-snap (good); relabelled to editions.
- **P3** Capture / Frame / Issuing still read as "process" more than "ritual";
  scheduled for the next phase (paper-cut shutter, registration-lock issuing).
- **OK** PASS/FILM artefacts, RETAKE (frames-only), NEW SESSION (full reset),
  same-artefact-across-Review/Printing/Done, EN/JP — all verified previously
  and unchanged by this phase.

### Print / backend integration (read-only, PR #2 not touched)
- Backend `printer.py` streams by `image.height` in 128-dot bands → **variable
  length supported**; `receipt.py` derives height from paper-width scaling →
  no fixed 1760/1880/2000. The frontend length change does not break the
  contract. The Edition adapter changes *display labels only*; the artefact
  prop shape consumed by the renderer is unchanged.

### Performance / accessibility principles
- transform/opacity + CSS only; no WebGL/canvas/backdrop-filter; off-screen
  animations stopped; `prefers-reduced-motion` handled. New tokens add no
  runtime cost. Edition adapter is O(1) array lookups.

## This phase — verification

- **Build**: `npm run build` ✓ (static 5 pages, no type errors).
- **Scope of change**: tokens (globals.css), Edition adapter (edition.ts),
  Select screen, KioskApp wiring, BoardingPass + MagazineCover labels, i18n
  customer copy, Idle copy. **PASS/FILM paper geometry unchanged** (620-wide
  ×2000 pass, 640×1280 film, photos 368²/288²).
- **Backend**: unchanged (PR #2 untouched).
- **Git**: branch `ui/editorial-print-engine` from `main`; no direct push to
  main; no force push; PR opened, not merged.

## Remaining for next phases (4–8)
- Per-screen ritual: Capture paper-cut shutter, Issuing registration-lock
  sequence (still → marks lock → feed → number confirm → collect), Frame/Pose
  as composition set.
- Migrate remaining hardcoded durations onto motion tokens.
- Full 1080×1920 EN/JP × normal/reduced-motion × PASS/FILM × RETAKE/NEW-SESSION
  screenshot matrix into `docs/ui-editorial-engine/`.
- Chrome-Performance pass (long tasks / layout shift / fps / memory) and a
  Raspberry-Pi weight note.

Note: live full-flow browser capture is currently hampered by preview-tab timer
throttling in this environment; screens are verified by build + isolated
component measurement + static render. Real-device (Pi) validation still
required.
