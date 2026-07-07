# receipt-photobooth — working rules

## Always-on design discipline (apply without being asked)
Before finishing ANY UI / design / frontend / animation work in this repo,
automatically apply every installed design skill — do not wait to be told:

- `ui-ux-pro-max` — design thinking, visual hierarchy, interaction patterns
- `design-system` / `frontend-design` — tokens, structure, production-ready UI
- `web-design-guidelines` — always-on quality check (spacing, type, hierarchy)
- `taste` — aesthetic opinion, anti-"AI-looking" output (when installed)
- Emil Kowalski `motion` — motion / animation feel (when installed)
- `impeccable` / `/polish` — tighten every loose detail before shipping (when installed)

Use them as the standard pass on every change: plan with them, build, then run
the review/polish skills before calling the work done. Verify in the browser
preview (portrait 1080×1920) and keep `npm run build` green.

Skills live in `~/.claude/skills/` (user-global) and/or `.claude/skills/`.
If a named skill above isn't installed yet, proceed with the ones that are and
note the gap — never fake a skill that isn't present.

## Product constraints (do not regress)
- Vertical kiosk, portrait 1080×1920, Chromium kiosk on Raspberry Pi.
- Printed artefact prints on a THERMAL receipt printer → strict black-on-paper
  (white / black / grey only, no colour, no gradients) on anything "printed".
- Bilingual luxury mode: English is the hero (~70%); Japanese is a small, light
  support line only (~30%) — never a big JP heading, never long JP text.
- Commits: author `xx0019v <xx0019v@gmail.com>`, no AI attribution.
