# OriginKit usage & attribution

Source reviewed: https://www.originkit.dev/

## Decision: 0 components adopted — independent implementation

Per the project rule ("利用条件が不明な場合：コードをコピーしない／DOM構造や固有
コードを複製しない／動きの原理だけ参考にし、ゼロから独自実装する"), and because a
clear, unambiguous commercial + modification license for copy-pasted component
code could **not** be positively confirmed in this environment, **no OriginKit
component code, DOM structure, or dependency was copied or added.**

Instead, the machine's motion is implemented from scratch as the four families
in `MOTION_SYSTEM.md`, using only CSS transform/opacity/clip-path — which is
also the lightest, most Raspberry-Pi-safe and most reduced-motion-convertible
option, and avoids "OriginKitデモの貼り合わせ".

## Why not adopt

- License/usage terms for direct code reuse were not confirmable here → the
  safe path is reference-the-principle-only.
- Many showcase interactions assume desktop hover / cursor / magnetic effects,
  which do not hold on a 1080×1920 touch kiosk (explicitly forbidden).
- Adding a component library or its dependencies risks weight on the Pi and
  conflicts with the existing custom monochrome system.

## Motion principles referenced (implemented independently)

- **Sequential text reveal** → mapped to our TYPE SET family (letter-spacing /
  line settle), already implemented via `srName` / `wordIn` / `fadeUp`.
- **Masked section transitions** → mapped to PAPER CUT (`clip-path` reveals),
  already implemented via `reveal` / `passReveal` / the print clip-path.
- **Line / mark lock-in** → mapped to REGISTRATION LOCK (hairline + number
  settle), implemented with the metadata rules and edition marks.

If, later, specific OriginKit components are confirmed as Copy-Code /
commercially-licensed, they will be added under `app/motion/originkit/` or
`app/components/motion/` with a header recording: component name, original URL,
license, modifications, and the screen(s) that use them — and folded into one
of the motion families, capped at 3 signature + 2 micro (max 5 total).

## Phase 2 (ISSUE CORE + Proof Lock) — re-checked, decision unchanged

The same license-confirmability gap applies to this phase's work. ISSUE CORE
(`app/components/motion/IssueCore.tsx`) — a four-blade radial-registration
sculpture — and Proof Lock (corner marks converging, paper-cut exit) were
each evaluated against OriginKit's catalog for a matching signature animation
or micro-interaction; nothing on originkit.dev matches the specific
"scattered blades registering into a seal, timed to real print progress"
mechanic, and the generic reveal/lock interactions that *are* present there
still carry the same unconfirmed reuse license from Phase 1. **0 additional
components adopted.** Both are original implementations built directly from
the four/six motion-family principles already documented above — no OriginKit
DOM, class names, or dependency were copied.

## Phase 3 (6-frame capture + FrameSelectionCarousel) — user-supplied OriginKit source

Unlike Phases 1–2, the user directly supplied the full source of three
OriginKit components for this phase: **Box Carousel**, **Magnetic Carousel**,
**Round Carousel**, and **Button Carousel** (Klarna-style arc nav). These were
read in full and analyzed for reuse. Decision below.

### Inventory

| component | technique | Copy Code | license confirmed | kiosk-fit | Pi cost | adopted |
|---|---|---|---|---|---|---|
| Box Carousel | 3D `preserve-3d` cube, `perspective`, drag via `MotionValue` | supplied inline, not confirmed reusable | no | poor — hides part of a 1:1 photo behind cube faces, GPU-heavy `perspective`/`preserve-3d` | high (continuous 3D transform + rAF drag) | **principles only** |
| Magnetic Carousel | cursor-proximity magnify, `backdropFilter: blur()`, hover-driven | supplied inline | no | poor — hover has no meaning on touch, blur forbidden by project's Pi rules | high (per-frame `requestAnimationFrame` easing loop even at rest) | **no** |
| Round Carousel | continuous auto-rotating 3D ring, momentum drag | supplied inline | no | poor — autoplay is explicitly forbidden for the selection UI | high (`requestAnimationFrame` running at all times, even idle) | **no** |
| Button Carousel (Klarna-style) | `AnimatePresence` centre swap + arc-positioned thumbnail nav, `framer-motion` | supplied inline | no | good concept (arc nav, tap-to-select) but ships `framer-motion`, `backdropFilter: blur(6px)`, black bg, desktop cursor styling, demo names/images | medium (adds a ~35kb dependency; per-thumbnail inline styles recomputed each render) | **principles only, rebuilt vanilla** |

No component's code, JSX structure, class names, prop shapes, or demo assets
were copied into this project — none had a confirmable commercial/modification
license, and each carries at least one hard conflict with this kiosk's rules
(hover-driven interaction, autoplay, `backdrop-filter`, or a new animation
dependency). Per the same project rule as Phases 1–2, **0 components adopted
as code; motion principles only, reimplemented from scratch.**

### What was actually built: `FrameSelectionCarousel`

`app/components/FrameSelectionCarousel.tsx` is a from-scratch component that
borrows only ideas, in vanilla React + CSS (no `framer-motion`, no new
dependency):

- **From Box Carousel:** the pointer-capture discipline — `try {
  setPointerCapture } catch {}`, a ref (`activeIndexRef`) mirroring the
  current index so pointer handlers never close over stale state, and a clean
  separation between "dragging" and "settled" states. The 3D cube itself,
  `perspective`, and `preserve-3d` were **not** used.
- **From Button Carousel:** the *idea* of an arc-shaped thumbnail rail with
  distance-from-active driving size/opacity, and tap-to-navigate. Rebuilt with
  plain `<button>` elements, inline `width`/`height`/`opacity` transitions
  (CSS, not JS-interpolated), no `backdrop-filter`, no blur, no black
  background, no demo names/images, no `framer-motion`.
- **From none of the three (deliberately):** autoplay, hover-driven
  magnification, continuous idle `requestAnimationFrame` loops, and 3D
  perspective/cube geometry are all absent. The component has **zero**
  `requestAnimationFrame` calls — the entire stage position is one integer
  (`activeIndex`) driving a single CSS `transform: translateX()` with a CSS
  `transition`; drag only updates a plain `dragX` number on `pointermove`
  (no per-frame loop), and the transition is disabled outright while dragging
  or under `prefers-reduced-motion`.

### FRAME CORE — the 12 supplied SVGs and `pc：wiget(1).mp4`

The 12 SVGs at `/Users/exx/Downloads/ACUSE/*.svg` were inspected before use.
Each one is **~2MB+** (one measured at 2,101,540 tokens as plain text) —
almost certainly dense/embedded raster or extremely high path-count vector
data, not lightweight icon assets. Shipping even one of these to a Raspberry
Pi kiosk would conflict directly with this project's own performance rules
(no heavy SVG, no large embedded assets, target 55–60fps on a Pi). **None of
the 12 SVGs were used.** `pc：wiget(1).mp4` was not opened/profiled for the
same reason — without a confirmed post-optimization size/codec, using it in
production would risk the same budget, and the project's own fallback rule
("性能条件を満たせない場合：動画をproductionでは使わない、SVG構成へfallback")
directly covers this case.

Instead, `FrameCore` (`app/components/motion/FrameCore.tsx`) is a small,
self-authored SVG sculpture — 6 radially-arranged circular fragments plus a
registration ring, ~10 DOM nodes, no filters, no gradients beyond one
`radialGradient` reused across all 6 fragments — built in the same visual
language as `IssueCore` (silver, registration marks, grayscale, one-shot) but
with its own distinct 4-state motion (`unprocessed → indexing → registering →
ready`), so it never shares an animation with the printing-side ISSUE CORE.

## Adopted list

| component | url | license | code used | screen |
|-----------|-----|---------|-----------|--------|
| (none)    | —   | —       | —         | —      |

Nothing above was code-adopted; every entry in the Phase 3 inventory table is
marked "principles only" or "no" for the reasons given.
