/** Shared "edition" metadata + scent system for THE RECEIPT. */

/** Number of frames captured per session. */
export const TOTAL_SHOTS = 3;

export const BRAND = "THE RECEIPT";
export const SUB_BRAND = "SCENT MEMORY";
export const TAGLINE = "A SCENT YOU CAN KEEP";
export const CTA_LINE = "CLAIM YOUR SCENT MEMORY";
export const LOCATION = "BESIDE THE SCENT MACHINE";
export const DOMAIN = "the-receipt.studio";
export const CLOSING = "This moment was printed.";

export type Scent = {
  /** stable id */
  id: string;
  /** editorial index, e.g. 01 */
  index: string;
  /** the mood word the guest chooses */
  mood: string;
  /** the fragrance name */
  name: string;
  /** three olfactory notes */
  notes: [string, string, string];
  /** one short editorial line printed on the receipt */
  phrase: string;
};

/** The scent wardrobe — quiet, Byredo / Le Labo / Aesop register. */
export const SCENTS: Scent[] = [
  {
    id: "nocturne",
    index: "01",
    mood: "Nocturne",
    name: "AFTER HOURS",
    notes: ["Iris", "Black Amber", "Smoke"],
    phrase: "For the hour that belongs to no one.",
  },
  {
    id: "linen",
    index: "02",
    mood: "Clean",
    name: "MADE BED",
    notes: ["White Musk", "Cotton", "Bergamot"],
    phrase: "The calm of something freshly folded.",
  },
  {
    id: "ember",
    index: "03",
    mood: "Warm",
    name: "SLOW BURN",
    notes: ["Tobacco", "Vanilla", "Cedar"],
    phrase: "Warmth that keeps its secrets.",
  },
  {
    id: "margin",
    index: "04",
    mood: "Cold",
    name: "SEA MARGIN",
    notes: ["Vetiver", "Mineral", "Green Fig"],
    phrase: "Air at the edge of the water.",
  },
];

export function scentById(id: string): Scent {
  return SCENTS.find((s) => s.id === id) ?? SCENTS[0];
}

export function editionDate(d = new Date()): string {
  return d
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
    .toUpperCase();
}

export function editionTime(d = new Date()): string {
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
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
