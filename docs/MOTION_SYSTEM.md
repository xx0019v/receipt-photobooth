# Motion System — Editorial Print Engine

One motion language for the whole machine. Every animation belongs to exactly
one of **four families**; nothing floats, bounces, glows, or loops for
decoration.

## Four families

1. **TYPE SET** — letter-spacing / weight / position settling as type is
   composed. Used for headings, edition names, step labels.
2. **PAPER CUT** — `clip-path` / `mask` reveal of a sheet or panel. Used for
   screen and artefact reveals.
3. **REGISTRATION LOCK** — hairlines, numbers and marks snapping into their
   printed position. Used for metadata, edition number, proof marks.
4. **PAPER FEED** — mechanical stepped travel of paper being printed / ejected.
   Used only in Issuing.

## Tokens (single source — `app/globals.css :root`)

| token | value | use |
|-------|-------|-----|
| `--motion-instant` | 110ms | touch feedback |
| `--motion-fast` | 200ms | micro transition |
| `--motion-standard` | 360ms | component reveal |
| `--motion-scene` | 580ms | page transition |
| `--motion-ritual` | 900ms | type-set / registration settle |
| `--ease-enter` | cubic-bezier(0.16,1,0.3,1) | reveals / settles (no overshoot) |
| `--ease-exit` | cubic-bezier(0.4,0,1,1) | dismissals |
| `--ease-paper` | cubic-bezier(0.22,0.61,0.36,1) | mechanical paper feed |
| `--stagger-type` | 42ms | per-letter / per-line type set |
| `--stagger-photo` | 90ms | per-frame reveal |

Screens must reference these variables, not hardcode durations. Existing
custom keyframes (`fadeUp`, `reveal`, `scan`, `receiptOut`, `screenIn`,
`quietConfirm`, scent-scroll reveal) already map onto these four families and
are kept as the independent implementation.

## Rules

- transform / opacity only for animated properties; no WebGL, no canvas FX, no
  `backdrop-filter`, no large blur, no continuous animation.
- Off-screen and idle animations are stopped.
- `prefers-reduced-motion`: position moves off, opacity-only, printing shown as
  a static progressive state; completion / interaction logic unchanged
  (already implemented across screens in `globals.css` + the Printing screen's
  scoped reduced-motion overrides).

## Recommended timing (tune by feel, not by number)

touch 80–140ms · micro 160–240ms · reveal 280–480ms · page 450–700ms ·
printing = matched to the physical feed.
