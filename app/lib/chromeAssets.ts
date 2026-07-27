export type ChromeAssetCategory = "ritual" | "celestial" | "fashion" | "object" | "motion";

export type ChromeAsset = {
  id: string;
  path: string;
  name: string;
  category: ChromeAssetCategory;
  recommendedUse: string;
  printSafe: boolean;
  usage: { ui: boolean; pass: boolean; cover: boolean };
};

export const CHROME_ASSETS = {
  face: asset("face", "chrome-face.svg", "Chrome Face", "ritual", "RAW edition mark", true, true, true, true),
  lips: asset("lips", "chrome-lips.svg", "Dripping Silver Lips", "ritual", "BOLD edition mark", true, true, true, true),
  stars: asset("stars", "chrome-stars.svg", "Chrome Stars", "celestial", "Scent symbol or PASS security seal", true, true, true, true),
  crescent: asset("crescent", "chrome-crescent-star.svg", "Crescent Star", "celestial", "Scent symbol or PASS security seal", true, true, true, true),
  orbit: asset("orbit", "chrome-orbit-star.svg", "Orbit Star", "celestial", "Scent symbol or PASS security seal", true, true, true, true),
  paw: asset("paw", "chrome-paw.svg", "Chrome Paw", "object", "BOLD edition mark", true, true, true, true),
  legs: asset("legs", "fashion-legs.svg", "Fashion Legs", "fashion", "RAW edition mark", true, true, true, true),
  balloonDog: asset("balloon-dog", "chrome-balloon-dog.svg", "Chrome Balloon Dog", "object", "BOLD edition mark", true, true, true, true),
  cherries: asset("cherries", "monochrome-cherries.svg", "Monochrome Cherries", "object", "AFTERIMAGE edition mark", true, true, true, true),
  ribbon: asset("ribbon", "chrome-ribbon.svg", "Chrome Ribbon", "fashion", "AFTERIMAGE edition mark", true, true, true, true),
  bust: asset("bust", "chrome-bust.svg", "Chrome Bust", "fashion", "RAW edition mark", true, true, true, true),
  moons: asset("moons", "chrome-moons.svg", "Chrome Moons", "celestial", "Scent symbol or PASS security seal", true, true, true, true),
  // Idle hero loop — the ORIGINAL master (2880px/32fps). A kiosk re-encode
  // (silver-lips-kiosk.mp4) exists for a future Pi-performance pass but is
  // NOT used: the owner judged its silver drip/highlight detail visibly
  // degraded from the master, and the Idle hero is a protected element.
  silverLipsMotion: asset("silver-lips-motion", "silver-lips.mp4", "Silver Lips Motion", "motion", "Primary Idle loop", false, true, false, false),
} as const satisfies Record<string, ChromeAsset>;

export const ALL_CHROME_ASSETS = Object.values(CHROME_ASSETS);

export const PASS_SECURITY_ASSETS = [
  CHROME_ASSETS.stars,
  CHROME_ASSETS.crescent,
  CHROME_ASSETS.orbit,
  CHROME_ASSETS.moons,
] as const;

export const COVER_MOTIF_ASSETS = [
  CHROME_ASSETS.paw,
  CHROME_ASSETS.legs,
  CHROME_ASSETS.balloonDog,
  CHROME_ASSETS.cherries,
  CHROME_ASSETS.ribbon,
  CHROME_ASSETS.bust,
] as const;

/**
 * The complete ACUSE collection, art-directed as four three-mark editions.
 *
 * Every source asset is visible in the edition UI and every one can become
 * the one mark frozen into the session and printed on PASS or FILM.
 */
export const EDITION_MOTIF_ASSETS = {
  cold: [CHROME_ASSETS.face, CHROME_ASSETS.legs, CHROME_ASSETS.bust],
  clean: [CHROME_ASSETS.crescent, CHROME_ASSETS.orbit, CHROME_ASSETS.moons],
  warm: [CHROME_ASSETS.lips, CHROME_ASSETS.paw, CHROME_ASSETS.balloonDog],
  nocturne: [CHROME_ASSETS.stars, CHROME_ASSETS.cherries, CHROME_ASSETS.ribbon],
} as const satisfies Record<string, readonly ChromeAsset[]>;

export function editionMotifs(scentId: string): readonly ChromeAsset[] {
  return EDITION_MOTIF_ASSETS[scentId as keyof typeof EDITION_MOTIF_ASSETS] ??
    COVER_MOTIF_ASSETS;
}

export function passSecurityAsset(scentId: string): ChromeAsset {
  const index = ["nocturne", "clean", "warm", "cold"].indexOf(scentId);
  return PASS_SECURITY_ASSETS[index < 0 ? 0 : index];
}

export function pickChromeMotif(): ChromeAsset {
  return COVER_MOTIF_ASSETS[Math.floor(Math.random() * COVER_MOTIF_ASSETS.length)];
}

function asset(
  id: string,
  filename: string,
  name: string,
  category: ChromeAssetCategory,
  recommendedUse: string,
  printSafe: boolean,
  ui: boolean,
  pass: boolean,
  cover: boolean,
): ChromeAsset {
  return {
    id,
    path: `/assets/chrome/${filename}`,
    name,
    category,
    recommendedUse,
    printSafe,
    usage: { ui, pass, cover },
  };
}
