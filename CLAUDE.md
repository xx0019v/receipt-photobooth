# receipt-photobooth — working rules

## Always-on design discipline (apply without being asked)
Before finishing ANY UI / design / frontend / animation work in this repo,
automatically apply the installed design skills — do not wait to be told.

**Priority (quality-raising, auto-apply on this luxury monochrome kiosk):**
- `design-taste-frontend` — anti-slop taste; infers direction, tunes
  VARIANCE / MOTION / DENSITY dials, hard em-dash ban, pre-flight check
- `high-end-visual-design` — polished, calm, expensive UI: softer contrast,
  whitespace, premium type, spring motion (matches our aesthetic best)
- `minimalist-ui` — editorial restraint (Notion / Linear register)
- `web-design-guidelines` — always-on review (spacing, type, hierarchy, a11y)
- `ui-ux-pro-max` / `frontend-design` — hierarchy, interaction, structure

Also available when the direction calls for it: `redesign-existing-projects`
(audit-first refactors), `full-output-enforcement` (no truncated output),
`industrial-brutalist-ui`, `image-to-code`, `gpt-taste`. Image-gen skills
(`imagegen-frontend-web/-mobile`, `brandkit`) output reference images only.

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
