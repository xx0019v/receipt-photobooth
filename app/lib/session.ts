import { CHROME_ASSETS, COVER_MOTIF_ASSETS, type ChromeAsset } from "./chromeAssets";
import { SCENTS, type Scent } from "./edition";
import { QUOTES, type Quote } from "./quotes";

/**
 * Each scent owns a small set of silver motifs; one is chosen per session and
 * then used everywhere (Reveal, Format, Pose, Capture, PASS, FILM, Review,
 * Printing, Done) so a session never mixes marks.
 */
const SCENT_MOTIFS: Record<string, readonly ChromeAsset[]> = {
  nocturne: [CHROME_ASSETS.stars, CHROME_ASSETS.moons],
  clean: [CHROME_ASSETS.crescent, CHROME_ASSETS.orbit],
  warm: [CHROME_ASSETS.ribbon, CHROME_ASSETS.cherries],
  cold: [CHROME_ASSETS.moons, CHROME_ASSETS.bust],
};

export type SelectedScentInput = Scent | string | null | undefined;

export type SessionIdentity = {
  selectedScent: Scent;
  selectedQuote: Quote;
  selectedChromeMotif: ChromeAsset;
};

export type SessionInitialization = {
  identity: SessionIdentity;
  frames: number[];
  serial: string;
  issueDate: string;
  issueTime: string;
  edition: string;
};

function pickOne<T>(items: readonly T[], random: () => number): T {
  const index = Math.min(items.length - 1, Math.floor(random() * items.length));
  return items[Math.max(0, index)];
}

/** Resolve an externally supplied scent first; otherwise decide once per session. */
export function resolveInitialScent(
  selectedScent?: SelectedScentInput,
  random: () => number = Math.random,
): Scent {
  if (selectedScent && typeof selectedScent !== "string") return selectedScent;

  if (typeof selectedScent === "string") {
    const normalized = selectedScent.trim().toLowerCase();
    const resolved = SCENTS.find(
      (scent) =>
        scent.id.toLowerCase() === normalized ||
        scent.name.toLowerCase() === normalized,
    );
    if (resolved) return resolved;
  }

  return pickOne(SCENTS, random);
}

/** Create the identity values that must remain fixed through a session. */
export function createSessionIdentity(
  selectedScent?: SelectedScentInput,
  random: () => number = Math.random,
): SessionIdentity {
  const scent = resolveInitialScent(selectedScent, random);
  const motifs = SCENT_MOTIFS[scent.id] ?? COVER_MOTIF_ASSETS;
  return {
    selectedScent: scent,
    selectedQuote: pickOne(QUOTES, random),
    selectedChromeMotif: pickOne(motifs, random),
  };
}

/** Initialize transient and fixed session state without running during render. */
export function initializeSession(
  selectedScent?: SelectedScentInput,
  random: () => number = Math.random,
): SessionInitialization {
  return {
    identity: createSessionIdentity(selectedScent, random),
    frames: [],
    serial: "0000-0000",
    issueDate: "",
    issueTime: "",
    edition: "",
  };
}
