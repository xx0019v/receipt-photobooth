# Premium Product Design Skill — Audit

## Source

- Repository: `git@github.com:xx0019v/premium-product-design.git`
- HEAD read: `3e88c0394ac60f7880a4896b8f2265aee6b6f86d`
- Fetched to (read-only reference clone): `/Users/exx/premium-product-design`
- Pre-existing local copy also present at `/Users/exx/.codex/skills/premium-product-design` (same HEAD, left untouched — likely owned by another tool).

## Files read (in full)

- `SKILL.md` (107 lines) — the orchestrating workflow + completion gate.
- `references/ux-system.md` — outcome model, flow spec, IA order, state matrix, mobile-first interaction.
- `references/visual-direction.md` — concept sentence, typography, color/material, layout rhythm, imagery, **§6 anti-template critique**, responsive art direction.
- `references/motion-system.md` — motion decision test, timing, performance, scroll-linked, reduced-motion, motion QA.
- `references/implementation-system.md` — preflight, component/data boundaries, responsive CSS, React/interaction, data confidence, performance budget, test sequence.
- `references/accessibility-and-qa.md`, `references/spatial-3d-system.md`, `references/store-assets.md` — noted; spatial-3d and store-assets are out of scope for this kiosk (no 3D route, no app-store listing).
- `agents/openai.yaml` — Codex agent manifest (not a Claude skill entrypoint; informational only).

## Entry point

`SKILL.md` is the orchestrator. Its "Required workflow" is: establish brief → audit incumbent truth → shape one concept → implement complete state model → validate in real interface → critique & iterate. Reference files are pulled in per stage.

## Principles adopted for receipt-photobooth

**Visual direction**
- **One concept sentence** tying material/process to layout+type+interaction behavior (visual-direction §1). We commit to one below (see `PREMIUM_DESIGN_DIRECTION.md`).
- **Hierarchy before decoration** via optical scale/weight/tracking; restrained repeated type roles, not one-off sizes (§2).
- **Anti-template critique (§6)** as a hard gate: reject repeated card/bento grids, excessive rounded rectangles/pills, decorative metrics, uniform reveal animation, headings broken into too many lines, effects that obscure the primary action.
- **Layout rhythm (§4):** asymmetry to direct attention; alternate section density; one strong composition per section over nested cards.

**UX**
- **IA order (ux §3):** identity/current-state → primary action → decision info → secondary → operational detail. Applied per screen so the eye starts on the right object.
- **State matrix (§4):** loading/empty/error/disabled/success/partial/unverified all get explicit, honest treatment — already largely present (Error Recovery, Proof Lock, Registering) and to be visually unified.
- **Touch (§5):** ≥44px targets (kiosk uses ≥88px), no hover-for-meaning, no accidental horizontal scroll.

**Motion**
- **Motion decision test (§1):** animate only for feedback / spatial continuity / attention / causality / restrained delight — else omit. Maps onto the kiosk's existing named families (TYPE SET, REGISTRATION LOCK, PAPER CUT, FRAME CORE, ISSUE CORE, PAPER FEED, COLLECT SETTLE).
- **Performance (§3):** transform/opacity only, per-frame values via refs not React state, stop offscreen work, no permanent `will-change` — already the kiosk's rule.
- **Reduced motion (§5):** remove travel/parallax, keep state changes as short opacity, show final state — already implemented; to be preserved through the redesign.

**Implementation**
- **Preflight (§1)** and **test sequence (§7):** typecheck → production build → production-like preview at real viewport, evidence not assumption. Already the working loop here.
- **Component boundaries (§2):** server-by-default, client only for interaction; hot animation values outside render state; separate primitives/domain/composition.

## Principles NOT applied (and why)

- **spatial-3d-system.md** — the kiosk deliberately bans WebGL/3D cube/ring on Raspberry-Pi grounds. Not applicable.
- **store-assets.md** — no App Store / Play listing. Not applicable.
- **Maps/geolocation (ux §6)** — no map surface. Not applicable.
- **"Real product imagery" (visual-direction §5)** — the camera feed is still a synthetic `Portrait` placeholder (real camera is PR #2's backend). We treat portraits as art-directed placeholders and label that uncertainty; we do not fabricate that a real photo exists.

## Conflicts with existing spec (resolved in favor of the kiosk)

- Skill assumes desktop+mobile responsive. This is a **fixed 1080×1920 kiosk** scaled by `Stage`. We hold to the single portrait viewport as the "narrow layout" and skip multi-breakpoint art direction.
- Skill's "keep URL-addressable state for deep links" — a kiosk has one route; not applicable. Session state stays in `KioskApp`.

## Adoption priority

1. Anti-template §6 gate applied per screen (the owner's core complaint).
2. One concept sentence + IA reordering so each screen has a distinct composition, not a shared title→content→buttons stack.
3. Typography as structure (optical scale, asymmetric baselines, cropped/vertical labels) rather than decoration.
4. Motion/perf/reduced-motion held as completion criteria (already strong; must not regress).
