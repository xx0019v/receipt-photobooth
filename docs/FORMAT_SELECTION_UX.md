# Format Selection UX

Reference for the current kiosk flow and the Format Select ritual. Implementer-ready, terse.

## Flow

```
Idle → Scent → Format → Pose → Capture → Printing(eject → RETAKE/CLAIM) → Done
```

State machine: `app/kiosk/KioskApp.tsx`, `type Phase = "idle" | "scent" | "format" | "pose" | "capture" | "printing" | "done"`.

- `chooseScent(s)` — sets `scent`, phase → `format`.
- `FormatSelectScreen onContinue` — phase → `pose`.
- `PoseScreen onBegin` — phase → `capture`.
- `finishCapture(captured)` — sets `frames` + `serial`, phase → `printing`.
- `PrintingScreen onRetake` — clears frames, phase → `pose`.
- `PrintingScreen onClaim` — phase → `done`.
- `DoneScreen onReset` — phase → `idle`.
- Idle-timeout: `scent` / `format` / `pose` auto-reset to `idle` after 60s of inactivity.

## The Format Select ritual

`app/kiosk/screens/FormatSelectScreen.tsx`, phase `"format"`, shown once per session right after Scent, before Pose.

The guest is choosing **how** the memory is kept, not filling out a settings form — treat it as a decision with weight, not a toggle:

- Two large, full-width, editorial choice cards (not compact "options"), each with a hand-drawn glyph schematic of the artefact shape, a name, and a one-line tag (EN + `.jp-sub` JP).
- Selecting a card calls `setStyle("pass" | "cover")` from `usePrintStyle` — the card visually flips to `bg-ink` / `text-paper` (`is-selected` state), so the choice reads as committed, not just highlighted.
- Footer shows `Selected: <name>` plus a `Continue` CTA that calls `onContinue`.
- No "template" language, no small card-grid/settings-UI framing. This is a ritual beat, same weight as Scent selection.

## How format persists — `usePrintStyle`

`app/lib/printStyle.ts`. React context, default `"pass"`, persisted to `localStorage["tr-print-style"]`.

```ts
export type PrintStyle = "pass" | "cover";
```

- `PrintStyleProvider` wraps the whole app inside `LangProvider` in `KioskApp.tsx` — one provider instance per kiosk session, survives phase changes.
- `FormatSelectScreen` writes via `setStyle(...)` on card tap.
- `PrintingScreen` reads `style` to choose eject geometry (`slitW/winW/winH`: cover 680/640/924, pass 1040/1000/580) and which artefact component to render.
- Because it's `localStorage`-backed, the last-chosen format also survives a page reload — acceptable for a kiosk (single physical device, no multi-guest concurrency), but means a hard refresh mid-flow does **not** reset the format to default. Worth knowing when debugging "why did it start on cover."

## PASS vs COVER

| | PASS ("Scent Boarding Pass") | COVER ("The Film Cover") |
|---|---|---|
| Orientation | Landscape | Portrait |
| Artefact component | `ReceiptStrip` | `MagazineCover` |
| Photo treatment | 3 large frames side by side, hero band | Quiet film-strip, no QR |
| Eject window | 1040 × 580 (slit 1000) | 640 × 924 (slit 680) |
| Copy register | "A ticket to afterglow." | "Your memory, edited." |

Both are printed on the same thermal black/grey stock — the difference is composition and orientation, not material.

## QA checklist

- [ ] EN copy reads correctly end-to-end (Idle → Done)
- [ ] JP `.jp-sub` lines present and balanced everywhere `sub` is non-null (toggle language mid-session too)
- [ ] PASS flow: Format → pick Scent Boarding Pass → Continue → Pose → Capture → Printing shows landscape eject → RETAKE returns to Pose with frames cleared → CLAIM → Done
- [ ] COVER flow: same, but Format → pick The Film Cover → Printing shows portrait eject, no QR on the artefact itself (Done screen QR is separate, always present)
- [ ] `npm run build` passes
- [ ] Browser console clean (no warnings/errors) through a full PASS run and a full COVER run
- [ ] 1080×1920 portrait, touch targets ≥ ~72px on Scent, Format, Pose, and Printing RETAKE/CLAIM buttons
- [ ] Format choice persists across `localStorage` reload (expected) — confirm this is intentional, not a bug, before "fixing" it
- [ ] No colour anywhere on paper or screen — thermal black/grey only
- [ ] Idle timeout (60s) fires correctly from `scent`, `format`, and `pose` phases and returns to Idle
