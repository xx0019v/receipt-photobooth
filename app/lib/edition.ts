/** Edition metadata + scent system for THE RECEIPT. */
import type { L, Lang } from "./i18n";

/** Number of frames captured per session. */
export const TOTAL_SHOTS = 3;

export const BRAND = "THE RECEIPT";
export const DOMAIN = "the-receipt.studio";

export type Scent = {
  id: string;
  index: string;
  /** flight number on the boarding pass, e.g. SCENT-001 */
  code: string;
  /** fragrance codename, shared across languages */
  name: string;
  mood: L;
  /** boarding-pass destination */
  destination: L;
  notes: [L, L, L];
  phrase: L;
};

const N = (en: string, jp: string): L => ({ en, jp });

/** The scent wardrobe — quiet, Byredo / Le Labo / Aesop register. */
export const SCENTS: Scent[] = [
  {
    id: "nocturne",
    index: "01",
    code: "SM-001",
    name: "NOCTURNE",
    mood: N("After Hours", "夜更け"),
    destination: N("AFTERGLOW", "余韻"),
    notes: [N("Iris", "アイリス"), N("Black Amber", "ブラックアンバー"), N("Smoke", "スモーク")],
    phrase: N("For the hour that belongs to no one.", "誰のものでもない時間へ。"),
  },
  {
    id: "clean",
    index: "02",
    code: "SM-002",
    name: "CLEAN",
    mood: N("Made Bed", "整った静けさ"),
    destination: N("STILLNESS", "静けさ"),
    notes: [N("White Musk", "ホワイトムスク"), N("Cotton", "コットン"), N("Bergamot", "ベルガモット")],
    phrase: N("The calm of something freshly folded.", "たたみたての、静けさ。"),
  },
  {
    id: "warm",
    index: "03",
    code: "SM-003",
    name: "WARM",
    mood: N("Slow Burn", "静かな熱"),
    destination: N("EMBER", "残り火"),
    notes: [N("Tobacco", "タバコ"), N("Vanilla", "バニラ"), N("Cedar", "シダー")],
    phrase: N("Warmth that keeps its secrets.", "秘密を抱いた、温もり。"),
  },
  {
    id: "cold",
    index: "04",
    code: "SM-004",
    name: "COLD",
    mood: N("Sea Margin", "海際"),
    destination: N("HORIZON", "水平線"),
    notes: [N("Vetiver", "ベチバー"), N("Mineral", "ミネラル"), N("Green Fig", "グリーンフィグ")],
    phrase: N("Air at the edge of the water.", "水際の、空気。"),
  },
];

export function scentById(id: string): Scent {
  return SCENTS.find((s) => s.id === id) ?? SCENTS[0];
}

/**
 * EDITION ADAPTER — the customer-facing identity of a session. The kiosk no
 * longer speaks of scent / fragrance / notes; a guest selects a limited
 * EDITION. Internally each edition still maps to a legacy `scent` so the
 * printed artefact fields and the backend renderer contract stay intact.
 * This is a display adapter only — no scent field is renamed or removed.
 */
export type Edition = {
  no: string; // "01".."04"
  code: string; // RAW / STILL / BOLD / AFTERIMAGE
  character: L; // one short editorial line
  scentId: string; // legacy link, never shown to the guest
};

export const EDITIONS: Edition[] = [
  { no: "01", code: "RAW", character: N("First light, unedited.", "手を加えない、最初の光。"), scentId: "cold" },
  { no: "02", code: "STILL", character: N("Held, composed, exact.", "静かに、整った一枚。"), scentId: "clean" },
  { no: "03", code: "BOLD", character: N("High contrast. Nothing hidden.", "強い明暗、隠さない。"), scentId: "warm" },
  { no: "04", code: "AFTERIMAGE", character: N("The trace a moment leaves.", "瞬間が残す、残像。"), scentId: "nocturne" },
];

export function editionForScent(scent: Scent): Edition {
  return EDITIONS.find((e) => e.scentId === scent.id) ?? EDITIONS[0];
}

export function scentForEdition(edition: Edition): Scent {
  return scentById(edition.scentId);
}

/** Pull the language value from a localized string. */
export function loc(v: L, lang: Lang): string {
  return v[lang];
}

export function editionDate(d = new Date()): string {
  return d
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();
}

export function editionTime(d = new Date()): string {
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

/** A pseudo issue number that reads like a magazine volume. */
export function issueNo(d = new Date()): string {
  const start = new Date(d.getFullYear(), 0, 0);
  const day = Math.floor((d.getTime() - start.getTime()) / 86_400_000);
  return `No. ${String(day).padStart(3, "0")}`;
}

/** A ticket / serial number for a printed session. */
export function serialNo(): string {
  const n = Math.floor(Math.random() * 9000 + 1000);
  const y = new Date().getFullYear();
  return `${y}-${n}`;
}
