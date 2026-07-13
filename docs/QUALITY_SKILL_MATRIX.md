# Quality Skill Matrix

| Skill | Applied decision | Implementation / verification |
|---|---|---|
| frontend-design | The output is treated as a travel document and collectible art object, not a web card. One signature motif per artefact. | PASS hierarchy stays route-first; COVER separates photos, quote, and one motif. Reviewed at 1080×1920. |
| ui-ux-pro-max | Preserve touch targets, format selection before capture, stable state, low-cost rendering, and reduced visual density. | Native buttons remain large; motif and quote are selected once in `KioskApp`; static SVG/CSS only; build and console checked. |
| web-design-guidelines | Semantic controls, visible selection state, meaningful text hierarchy, decorative-image hiding, and no layout shift. | `aria-pressed`, empty-alt decorative assets, fixed image regions, monochrome contrast, and keyboard-capable controls retained. |
| design-taste-frontend | Not installed in this environment. Its requested taste criteria were covered by `frontend-design`: restraint, editorial typography, and subject-specific composition. | No asset collage; one security seal on PASS and one motif on COVER. |
| high-end-visual-design | Not installed in this environment. Its requested premium criteria were covered by deliberate whitespace, hairlines, monochrome density, and controlled motif scale. | Motifs are secondary, grayscale, and isolated from photography/copy. |
| minimalist-ui | Not installed in this environment. Its requested minimal criteria were covered by progressive choice, limited decoration, and removal of redundant controls. | Two pre-capture formats only; no post-capture format switch; one primary Continue action. |

The three unavailable skill packages were not simulated as callable skills; their requested design outcomes were implemented and audited through the available skills above.
