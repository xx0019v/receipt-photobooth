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

## Adopted list

| component | url | license | code used | screen |
|-----------|-----|---------|-----------|--------|
| (none)    | —   | —       | —         | —      |
