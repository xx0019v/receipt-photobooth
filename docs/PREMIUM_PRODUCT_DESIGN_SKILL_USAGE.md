# Premium Product Design Skill — Usage

## How it was loaded

- Fetched read-only via `git clone` to `/Users/exx/premium-product-design` (HEAD `3e88c03`), outside the application repo — no bulk copy into `receipt-photobooth`, no new dependency, no edit to the source skill.
- A pre-existing copy at `/Users/exx/.codex/skills/premium-product-design` (same HEAD) was left untouched.
- All of `SKILL.md` + the 5 in-scope references were read into context and applied directly (see `PREMIUM_PRODUCT_DESIGN_SKILL_AUDIT.md`). This is not a token/color reskin — the principles drive screen composition, IA order, typography-as-structure, motion, and QA.

## Version applied

- Skill HEAD: `3e88c03`
- Scope applied: visual-direction, ux-system, motion-system, implementation-system, accessibility-and-qa.
- Scope excluded: spatial-3d-system (kiosk bans 3D/WebGL), store-assets (no store listing), maps (no map surface).

## Relationship to application changes

- Direction chosen: **KINETIC EDITORIAL** primary + registration-rigor accessory (`PREMIUM_DESIGN_DIRECTION.md`).
- Application work happens on branch `ui/premium-product-design` (branched off `main` after PR #7 merged), committed per screen-group, opened as a new PR. `main` is never committed to directly.
- Idle hero video reverted to the original master `silver-lips.mp4` at the owner's call (the kiosk re-encode visibly degraded the silver drip detail); the optimized file is retained but unreferenced for a future approved Pi-performance pass.

## Loop log

See `AUTONOMOUS_DESIGN_LOG.md` (Loop 4+) for per-loop screen targets, before/after, and pass/fail against the anti-template gate.
