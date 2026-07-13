"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ChromeAsset } from "./chromeAssets";

const ChromeArtworkContext = createContext<ChromeAsset | null>(null);

export function ChromeArtworkProvider({ motif, children }: { motif: ChromeAsset; children: ReactNode }) {
  return <ChromeArtworkContext.Provider value={motif}>{children}</ChromeArtworkContext.Provider>;
}

export function useChromeArtwork(): ChromeAsset {
  const motif = useContext(ChromeArtworkContext);
  if (!motif) throw new Error("useChromeArtwork must be used within ChromeArtworkProvider");
  return motif;
}
