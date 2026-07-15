# Motion System — Editorial Print Engine

One motion language for the whole machine. Every animation belongs to exactly
one of **four families**; nothing floats, bounces, glows, or loops for
decoration.

## Seven families (Printing adds two, Frame Selection adds one)

1. **TYPE SET** — letter-spacing / weight / position settling as type is
   composed. Used for headings, edition names, step labels.
2. **REGISTRATION LOCK** — hairlines, numbers and marks snapping into their
   printed position. Used for metadata, edition number, proof marks, Proof
   Lock's four corner marks, and Capture's per-frame crop marks.
3. **PAPER CUT** — `clip-path` / `mask` reveal of a sheet or panel. Used for
   screen and artefact reveals, and the Proof Lock → Printing transition.
4. **ISSUE CORE** — the four-blade printing sculpture's own
   calibrate/register/issue/release motion. See `ISSUE_CORE.md`. Used only
   in Printing.
5. **PAPER FEED** — mechanical stepped travel of paper being printed / ejected.
   PASS: right→left. FILM: existing top-down direction. Used only in Issuing,
   and always in phase with ISSUE CORE's `issue` state (same `progress` value).
6. **COLLECT SETTLE** — a 1–2px settle + single opacity fade as Printing exits
   to Done; no loop, nothing lingers on the Done screen.
7. **FRAME CORE** — the six-fragment registration sculpture's own
   unprocessed/indexing/registering/ready motion. See `FRAME_SELECTION.md`.
   Used only in the Registering Frames interstitial between Capture and
   Select — distinct from ISSUE CORE (different object, different states,
   never shares an animation).

## Frame Selection Carousel — a source-of-truth position, not a new family

The carousel's own motion (track `translateX`, thumbnail size/opacity by
distance) is REGISTRATION LOCK + PAPER CUT applied to a touch list rather than
a new family: one integer (`activeIndex`) plus a live drag offset drives a
single CSS `transition`, exactly like Proof Lock's marks converge on a value
rather than looping. See `FRAME_SELECTION.md` for the full breakdown.

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

| `--ease-metal` | cubic-bezier(0.22,1.06,0.36,1) | ISSUE CORE register (small overshoot) |
| `--ease-register` | cubic-bezier(0.22,0.61,0.36,1) | ISSUE CORE calibrate/release, Proof Lock marks |

Screens must reference these variables, not hardcode durations. Existing
custom keyframes (`fadeUp`, `reveal`, `scan`, `receiptOut`, `screenIn`,
`quietConfirm`, scent-scroll reveal) already map onto these families and are
kept as the independent implementation. Proof Lock / ISSUE CORE add
`proofMarkConverge` and `paperCutWipe` (both in `globals.css`), scoped to the
Printing screen and Capture's registration marks.

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
