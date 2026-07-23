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
  face: asset("face", "chrome-face.svg", "Chrome Face", "ritual", "Idle background trace", false, true, false, false),
  lips: asset("lips", "chrome-lips.svg", "Dripping Silver Lips", "ritual", "Idle fallback and touch response", false, true, false, false),
  stars: asset("stars", "chrome-stars.svg", "Chrome Stars", "celestial", "Scent symbol or PASS security seal", true, true, true, true),
  crescent: asset("crescent", "chrome-crescent-star.svg", "Crescent Star", "celestial", "Scent symbol or PASS security seal", true, true, true, true),
  orbit: asset("orbit", "chrome-orbit-star.svg", "Orbit Star", "celestial", "Scent symbol or PASS security seal", true, true, true, true),
  paw: asset("paw", "chrome-paw.svg", "Chrome Paw", "object", "Playful COVER motif", true, false, false, true),
  legs: asset("legs", "fashion-legs.svg", "Fashion Legs", "fashion", "Fashion-led COVER motif", true, false, false, true),
  balloonDog: asset("balloon-dog", "chrome-balloon-dog.svg", "Chrome Balloon Dog", "object", "Sculptural COVER motif", true, false, false, true),
  cherries: asset("cherries", "monochrome-cherries.svg", "Monochrome Cherries", "object", "Graphic COVER motif", true, false, false, true),
  ribbon: asset("ribbon", "chrome-ribbon.svg", "Chrome Ribbon", "fashion", "Fashion-led COVER motif and format preview", true, true, false, true),
  bust: asset("bust", "chrome-bust.svg", "Chrome Bust", "fashion", "Editorial COVER motif", true, true, false, true),
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
