import { COVER_MOTIF_ASSETS, type ChromeAsset } from "./chromeAssets";
import { SCENTS, type Scent } from "./edition";
import { QUOTES, type Quote } from "./quotes";

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
  return {
    selectedScent: resolveInitialScent(selectedScent, random),
    selectedQuote: pickOne(QUOTES, random),
    selectedChromeMotif: pickOne(COVER_MOTIF_ASSETS, random),
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
