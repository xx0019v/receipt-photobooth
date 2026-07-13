# WHITE MEMORY CEREMONY — UI/UX direction

One editorial magazine you leaf through: scent → form → pose → capture →
review → print → collect. Not seven separate app screens. 1080×1920 touch
kiosk, luxury fragrance event.

## Palette (strict)
Pure/soft white · black · charcoal · silver · light gray. **No blue / purple /
cyan / colour accents / SaaS states.** Hierarchy comes from whitespace, type,
photo, silver, line, density, motion, light — never colour.

## Type roles (few, deliberate)
- Display serif (Bodoni) → headings + one emotional italic word
- Grotesk sans (Inter) → operation / buttons
- Mono (Space Mono) → numbers, time, serial, security marks
Never all-caps everywhere, never one font everywhere.

## The 12 chrome assets — reinterpret, never paste
Always via the asset registry. One primary asset per screen (max two).
Forbidden: centered raw SVG, tiny left-of-card icon, asset grids, visible white
rectangle, edges showing, competing with the hero. Use as: bold crop / partial
reveal / `mask-image` / `clip-path` / halftone / registration mark / security
seal / silhouette / watermark / a single one-shot reflection on select.

## Motion (CSS only, Pi-light, reduced-motion aware)
opacity · translate · tiny scale · clip-path · mask · letter-spacing · line
reveal · paper feed · cropped-asset move · one white flash · quiet dissolve.
No bounce / spring / 3D carousel / neon glow / perpetual background motion.

## Per-screen intent
- **Scent** — an editorial index. Big serif names as a vertical contents list
  with hairline rules + numbers; selected row gains weight/space and the scent's
  seal surfaces quietly. Not four equal boxes.
- **Format** — a two-page spread; the two artefacts float, the chosen one faces
  forward, the other recedes to the margin (transform/opacity only).
- **Pose** — a quiet stage; big pose name, ≤2 lines, a chrome silhouette used as
  a framing/guide line, not an icon.
- **Capture** — the quietest. Camera frame, Shot n/3, giant countdown reading
  through the paper, white flash → contact sheet.
- **Review** — an editing room; the artefact is the sole hero, buttons recede.
- **Printing** — the ritual: paper feeds unevenly (quiet → steady → slow stop),
  faint scan, micro-tremor; RETAKE/CLAIM only fade in AFTER the feed.
- **Done** — reuse the exact artefact; "collect the moment" is the action, not a
  text end-card.

## Skill → decision map
Skills in `~/.claude/skills` (13). Applied here:
- **minimalist-ui** → warm-monochrome, flat, no gradients/heavy shadows; hairline
  system, whitespace as structure.
- **high-end-visual-design** → expensive defaults: type scale, spacing rhythm,
  spring-free calm motion; blocks generic-AI looks.
- **design-taste-frontend** → anti-slop; infer direction, VARIANCE/MOTION/DENSITY
  dials kept low-variance/low-density for ceremony; hard em-dash discipline.
- **frontend-design / ui-ux-pro-max** → hierarchy, interaction states, touch
  targets ≥ ~72px, consistent bottom-anchored operations.
- **web-design-guidelines** → the review pass: contrast, focus, aria on decorative
  assets (`aria-hidden`), reduced-motion, no hover-only affordances.
- Others (shadcn-ui, industrial-brutalist-ui, gpt-taste, image-to-code, imagegen-*,
  brandkit) consulted for register; not stylistically imposed (kept quiet/luxury).

## Protected (do not change)
IdleScreen, ReceiptStrip + MagazineCover print specs (PASS 620×1760 / FILM
vertical, 3 squares, quote+motif, QR rules), KioskApp state, chromeAssets.ts,
quotes.ts. Same artefact + serial + issue date across Review/Print/Done; RETAKE
keeps state; NEW SESSION resets; quote/motif never re-render.
