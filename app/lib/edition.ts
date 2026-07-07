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
    name: "AFTER HOURS",
    mood: N("Nocturne", "夜想"),
    destination: N("AFTERGLOW", "余韻"),
    notes: [N("Iris", "アイリス"), N("Black Amber", "ブラックアンバー"), N("Smoke", "スモーク")],
    phrase: N("For the hour that belongs to no one.", "誰のものでもない時間へ。"),
  },
  {
    id: "linen",
    index: "02",
    code: "SM-002",
    name: "MADE BED",
    mood: N("Clean", "清廉"),
    destination: N("STILLNESS", "静けさ"),
    notes: [N("White Musk", "ホワイトムスク"), N("Cotton", "コットン"), N("Bergamot", "ベルガモット")],
    phrase: N("The calm of something freshly folded.", "たたみたての、静けさ。"),
  },
  {
    id: "ember",
    index: "03",
    code: "SM-003",
    name: "SLOW BURN",
    mood: N("Warm", "温もり"),
    destination: N("DUSK", "夕暮れ"),
    notes: [N("Tobacco", "タバコ"), N("Vanilla", "バニラ"), N("Cedar", "シダー")],
    phrase: N("Warmth that keeps its secrets.", "秘密を抱いた、温もり。"),
  },
  {
    id: "margin",
    index: "04",
    code: "SM-004",
    name: "SEA MARGIN",
    mood: N("Cold", "涼景"),
    destination: N("THE COAST", "海際"),
    notes: [N("Vetiver", "ベチバー"), N("Mineral", "ミネラル"), N("Green Fig", "グリーンフィグ")],
    phrase: N("Air at the edge of the water.", "水際の、空気。"),
  },
];

export function scentById(id: string): Scent {
  return SCENTS.find((s) => s.id === id) ?? SCENTS[0];
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
