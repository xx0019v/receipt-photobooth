# Chrome Asset Integration

The canonical registry is `app/lib/chromeAssets.ts`. Components consume registry paths; source filenames are never embedded in component code.

| Asset | Primary use | PASS | COVER | Print |
|---|---|---:|---:|---:|
| Chrome Face | Idle background trace | No | No | Screen only |
| Dripping Silver Lips | Idle fallback / touch response | No | No | Screen only |
| Chrome Stars | Scent symbol / security seal | Yes | Optional | Grayscale safe |
| Crescent Star | Scent symbol / security seal | Yes | Optional | Grayscale safe |
| Orbit Star | Scent symbol / security seal | Yes | Optional | Grayscale safe |
| Chrome Paw | Collectible motif | No | Yes | Grayscale safe |
| Fashion Legs | Fashion motif | No | Yes | Grayscale safe |
| Chrome Balloon Dog | Sculptural motif | No | Yes | Grayscale safe |
| Monochrome Cherries | Graphic motif | No | Yes | Grayscale safe |
| Chrome Ribbon | Fashion motif / format preview | No | Yes | Grayscale safe |
| Chrome Bust | Editorial motif | No | Yes | Grayscale safe |
| Chrome Moons | Scent symbol / security seal | Yes | Optional | Grayscale safe |
| Silver Lips Motion | Idle hero loop | No | No | Screen only |

Rules:

- Use no more than one motif per printed artefact and two brand assets per screen.
- PASS maps the four scent IDs to Stars, Crescent, Orbit, or Moons as a faint security seal.
- COVER draws exactly one motif from Paw, Legs, Balloon Dog, Cherries, Ribbon, or Bust.
- COVER contains no QR. PASS retains the existing QR and barcode policy.
- Quote and COVER motif are selected once at session start, stored in `KioskApp`, and retained through retake, review, printing, and done.
- A new session resets frames, serial, scent, format, quote, and motif.
