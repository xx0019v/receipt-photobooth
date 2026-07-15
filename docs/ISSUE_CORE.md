# ISSUE CORE — the printing signature object

## Concept

ISSUE CORE is the machine's one piece of kinetic sculpture: four thin metal
blades that register into a seal as a print job progresses. It is not a
spinner, a loading circle, or a decorative chrome object — it is a functional
visualization of the print engine's own state machine. It exists **only**
during Printing; Idle, Edition, Format, Pose, Capture, Review and Done never
render it (Done gets, at most, a sub-500ms closed-seal fade as Printing exits).

## Form principle

One clear rule, not a mix: **four thin curved metal blades, arranged at 0° /
90° / 180° / 270°, that scatter to a mis-registered position and converge into
a closed seal.** No liquid chrome, no particles, no rotating ring, no HUD.

Implementation: `app/components/motion/IssueCore.tsx` — an inline SVG, 4 `<g>`
blade groups + 1 registration cross + 1 one-shot highlight sweep. ~9 DOM
nodes, one `<linearGradient>` for the metal read (contrast + hard highlight +
thin stroke, no blur, no drop-shadow stack).

## States (driven by the Printing state machine, never by an internal timer)

| State | Meaning | Blade motion | Duration | Status text |
|---|---|---|---|---|
| `calibrate` | proof just locked, engine reading the job | scattered 4–9px off-axis, ±3–6° | 220–380ms | CALIBRATING |
| `register` | frame/serial/edition confirmed | blades converge to 0 offset, small (1–2px) overshoot via `--ease-metal` | 280–450ms | REGISTERED |
| `issue` | paper is actually feeding | blades splay a few px + assembly advances up to ~78° — **strictly a function of `progress` (0–1), the real feed fraction**, never real time | matches the feed animation | ISSUING EDITION |
| `release` | paper has fully ejected | blades close to the seal, one final highlight sweep, settle | 180–300ms | READY TO COLLECT |

`progress` in the `issue` state is the same 0–1 value driving the paper-feed
`clip-path` — a single number owned by `PrintingScreen`, so the sculpture and
the paper are always in phase. There is no `setInterval`/`requestAnimationFrame`
loop inside `IssueCore` itself.

## Placement

- **PASS**: right edge, above the printer slot (`right-[64px]`, vertically
  centred on the slot), so it reads as one machine with the slot — never over
  the photos, stub, QR, or the feed path.
- **FILM**: centred above the top slit, in the existing safe margin — never
  over the artwork.
- **Review, Done, Idle, Edition, Format, Pose, Capture**: not rendered.

## Accessibility

`IssueCore` has `role="status" aria-live="polite"` and always renders a text
label (`CALIBRATING` / `REGISTERED` / `ISSUING EDITION` / `READY TO COLLECT`)
so state is available without relying on the shape. Under
`prefers-reduced-motion: reduce`: all blade offsets collapse to the closed,
registered position immediately; the one-shot sweep is suppressed; only
`opacity` cross-fades (100–180ms) between states. The Printing state machine's
timers and transitions are unaffected — only the visual motion is stripped.

## Performance

Pure `transform`/`opacity`/`stroke` on ~9 SVG nodes, one CSS transition per
blade group (no continuous `requestAnimationFrame`, no `filter` animation, no
`backdrop-filter`). Cost is effectively the same as the state text swapping —
safe for the Raspberry Pi budget in `MOTION_SYSTEM.md`. Not verified on actual
Pi hardware in this session (see final report, "Raspberry Pi" caveat).

## OriginKit

No OriginKit code or DOM was used for ISSUE CORE. See `ORIGINKIT_USAGE.md` —
the prior investigation already concluded 0 adoptions for this project; this
phase did not re-open that investigation, since the sculpture's construction
(radial blade registration) has no OriginKit analogue to evaluate.
