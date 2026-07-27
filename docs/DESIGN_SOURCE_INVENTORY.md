# DESIGN SOURCE INVENTORY

Standing register for every design/animation source supplied to this project.
Each source is audited before use and classified:

- **A** direct port · **B** ported after slimming · **C** motion principle only
- **D** state/pointer design only · **E** visual reference only · **F** not used

No source is ever pasted wholesale; demo assets, demo names, and Framer-only
props are always stripped. License note: none of the OriginKit sources below
carried a confirmable commercial/modification license in this environment, so
per project rule everything is classification C/D/E — principles re-implemented
from scratch, no code, DOM structure, or class names copied.

---

## 2026-07-15 · Button Carousel (Klarna-style) — OriginKit

- Type: React + framer-motion carousel (centre swap + arc thumbnail nav)
- Original use: person-picker demo with name labels
- Dependencies: framer-motion (~35kb) — **not added**
- Heavy parts: `backdropFilter: blur(6px)`, per-render slot recompute,
  `AnimatePresence` sweep of 260px + rotate 8°
- Classification: **C + E** → arc thumbnail rail concept and tap-to-navigate
  in `FrameSelectionCarousel`; rebuilt vanilla (no framer-motion, no blur,
  no black bg, no demo names/images)
- Not used: labels, demo URLs, backdrop-filter, desktop cursor styling

## 2026-07-15 · Coverflow Carousel — OriginKit

- Classification: **D** → one position value as single source of truth,
  size/opacity derived from distance-to-active; idle = zero rAF
- Not used: 3D tilt, shadows, hover, autoplay

## 2026-07-15 · Box Carousel — OriginKit (re-supplied 2026-07-16)

- Type: 3D `preserve-3d` cube carousel, drag via MotionValue
- Classification: **D** → pointer-capture try/catch, `pointercancel` as
  terminal, `activeIndexRef` stale-state guard, rapid-tap lock,
  `isAnimating`-style gesture locking, cleanup discipline — all folded into
  `FrameSelectionCarousel`'s pointer handlers
- Not used: 3D cube, rotateX/Y, `preserve-3d`, perspective, 4-face mapping,
  90° rotation animation, autoplay, video faces — a cube hides part of a 1:1
  photo and costs continuous GPU compositing on a Pi

## 2026-07-16 · Draggable Sticker — OriginKit

- Type: WebGL sticker (32×32 mesh, shader, RENDER_SCALE 2, holo sheen,
  velocity tilt, dynamic shadow, z-index promotion)
- Original use: playful desktop sticker board
- Performance audit: WebGL context + per-frame texture path is the single
  most expensive pattern available to this kiosk; context-loss risk on Pi;
  6 simultaneous photo textures would multiply memory
- Classification: **C + D** → the grab → lift → paste *gesture grammar* and
  its drag-state separation, rebuilt as `FramePeelInteraction` behavior
  inside `FrameSelectionCarousel`:
  - press: `scale 0.992` + `translateY(-6px)` + one-shot silver sheen
    (`peelSheen`, linear-gradient, runs once, reduced-motion: none)
  - peel: vertical-down drag ≥48px detaches a 150px proof ghost that follows
    the finger; tilt = clamp(±2.5°) from horizontal velocity; small
    `box-shadow` only while the ghost exists
  - paste: drop on a PRINT ORDER slot registers the frame in order; drop
    anywhere else cancels silently; ghost unmounts the moment the gesture
    ends (zero idle cost)
- Not used: WebGL, canvas, mesh, shaders, `sheenMode="holo"`, rainbow,
  30–45° tilt, free placement, sticker stacking, persistent sheen
- Colors constrained to white/black/grey/silver per project rule

## 2026-07-16 · Round Carousel — OriginKit

- Type: auto-rotating 3D ring (`rotateY` + `translateZ`, perspective 3000px,
  momentum drag, always-on rAF)
- Performance audit: rAF never idles (rotates even untouched); back-face
  double rendering; brightness filter per face
- Classification: **C + E** → the circle-placement math only: the arc
  thumbnail rail's lift is now computed as a parabola
  (`lift = 14 · dist²`, max 56px — a flattened slice of the ring), sizes
  104/84/68 px, opacity 1/0.8/0.55, all CSS-transitioned from a single
  `activeIndex` (no rAF at all)
- Not used: 3D ring, autoplay, infinite rotation, back faces, perspective,
  black bg, heavy shadows

## 2026-07-13〜15 · ACUSE 12 SVGs + pc：wiget.mp4

See `ORIGINKIT_USAGE.md` — SVGs are byte-identical to the existing
`public/assets/chrome/` library (single embedded rasters; not fragmentable);
the mp4 was profiled and re-encoded 6.5MB→609KB, retaining the complete
6.125s clip as the post-capture loading object.

## 2026-07-16 · pc。lips.mp4 (ACUSE_v)

- Audit: `cmp` byte-identical to the already-shipped Idle hero loop
  `public/assets/chrome/silver-lips.mp4` (2,336,090 bytes, h264,
  2880×2880, 32fps, 5.375s, 3.48Mbps)
- Classification: **F (already shipped)** — no action; the Idle silver-lips
  ritual is a protected design element and its asset is already in place
- Performance note for a future, explicitly-approved pass: the Idle loop
  decodes 2880×2880@32fps continuously while displayed at 850×600. A
  ~1152px re-encode would cut Pi decode cost roughly 6× with no visible
  difference at display size — **not applied**, because the Idle hero and
  its source assets are on the do-not-touch list

## 2026-07-16 · Re-supply of Draggable Sticker / Round Carousel / Box Carousel

The same three sources were re-sent in full. Diffed against the versions
audited above — no new code paths, props, or behaviors beyond what was
already classified and integrated in Loop 1 (`AUTONOMOUS_DESIGN_LOG.md`).
Per the no-repeat rule, no re-implementation; entries above remain the
record.
