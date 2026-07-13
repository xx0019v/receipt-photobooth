# Claude handoff

## 1. Current flow

`Idle → Scent Identity Reveal → Format Select → Pose → Capture → Review → Printing → Done`

Review and Printing are states inside `PrintingScreen.tsx`; there is no separate
`ReviewScreen.tsx`.

## 2. Scent Identity Reveal state

- `KioskApp.startSession()` calls `initializeSession()` once, outside render.
- `resolveInitialScent()` uses an externally supplied `selectedScent` first.
- Without an external value, the scent is selected once during session start.
- `ScentScreen` only reveals the fixed value and advances after 1600 ms.
- RETAKE clears frames only. NEW SESSION resets state; the next start creates a
  new identity.
- Reveal timer cleanup and a reduced-motion short fade are implemented.

Core file: `app/lib/session.ts`.

## 3. Scent data

The single source is `SCENTS` in `app/lib/edition.ts`:

- NOCTURNE — Iris / Black Amber / Smoke — After Hours — Afterglow
- CLEAN — White Musk / Cotton / Bergamot — Made Bed — Stillness
- WARM — Tobacco / Vanilla / Cedar — Slow Burn — Ember
- COLD — Vetiver / Mineral / Green Fig — Sea Margin — Horizon

## 4. FILM props contract

`FilmArtifactProps` in `app/lib/film.ts` contains:

`frames`, `selectedQuote`, `selectedChromeMotif`, `selectedScent`,
`scentNotes`, `scentMood`, `scentDestination`, `serial`, `issueDate`, `edition`.

`KioskApp` memoizes one object and passes it unchanged to `PrintingScreen` and
`DoneScreen`. Both spread it into `MagazineCover`. Do not regenerate date,
edition, quote, or motif inside the print component.

## 5. Quote variant

Use the pure `getQuoteLayoutVariant()` helper in `app/lib/film.ts`:

- 1–3 words: `short`
- 4–6 words: `medium`
- 7+ words: `long`

`MagazineCover` exposes the result as `data-quote-layout`; final layouts are not
implemented yet.

## 6. Motif persistence

`createSessionIdentity()` selects one registry item per session. The same
`selectedChromeMotif` is passed through `FilmArtifactProps`, used once in FILM,
kept by RETAKE, and recreated only after NEW SESSION. FILM has no QR.

## 7. Protected PASS specification

Do not redesign `ReceiptStrip.tsx`:

- 620 × 1760 paper
- three 352 × 352 square photos in one vertical column
- horizontal airport data below the photos
- QR, barcode, security seal
- fixed serial, issue date, and boarding time
- identical artifact in Review / Printing / Done

## 8. Primary Claude edit targets

- `app/kiosk/screens/ScentScreen.tsx` — final Reveal art direction
- `app/components/MagazineCover.tsx` — final FILM editorial layout
- `app/kiosk/screens/FormatSelectScreen.tsx`
- `app/kiosk/screens/PoseScreen.tsx`
- `app/kiosk/screens/CaptureScreen.tsx`
- `app/kiosk/screens/PrintingScreen.tsx` — Review / Printing presentation
- `app/kiosk/screens/DoneScreen.tsx`
- `app/globals.css` — typography, spacing, and motion polish

## 9. Files to avoid changing

- `app/components/ReceiptStrip.tsx`
- `app/lib/session.ts`
- `app/lib/film.ts`
- `app/lib/edition.ts` scent schema
- `app/lib/chromeAssets.ts` registry/assets
- `app/lib/quotes.ts` quote text
- `app/kiosk/KioskApp.tsx` session transitions
- `app/kiosk/screens/IdleScreen.tsx`

## 10. Build and preview

```sh
rm -rf .next
npm run build
npm run start
```

Production preview: `http://localhost:3080` at a 1080 × 1920 viewport.

## 11. Known tasks left for Claude

- Final Scent Reveal composition, typography, asset interpretation, and motion.
- Final three quote-layout variants for FILM.
- Final motif placement and FILM metadata hierarchy.
- Final Review / Printing / Done staging without changing artifact props.
- Existing accessibility polish: complete reduced-motion coverage and explicit
  focus-visible treatment for non-Idle controls.
