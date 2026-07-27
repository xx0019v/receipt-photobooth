import type { ChromeAsset } from "./chromeAssets";
import type { Scent } from "./edition";
import type { Quote } from "./quotes";

export type QuoteLayoutVariant = "short" | "medium" | "long";

export type FilmArtifactProps = {
  frames: number[];
  frameSources?: Record<number, string>;
  selectedQuote: Quote;
  selectedChromeMotif: ChromeAsset;
  selectedScent: Scent;
  scentNotes: [string, string, string];
  scentMood: string;
  scentDestination: string;
  serial: string;
  issueDate: string;
  edition: string;
};

/** Pure word-count classification for Claude's future FILM layouts. */
export function getQuoteLayoutVariant(
  quote: Pick<Quote, "text"> | string,
): QuoteLayoutVariant {
  const text = typeof quote === "string" ? quote : quote.text;
  const wordCount = text.trim().split(/\s+/u).filter(Boolean).length;

  if (wordCount <= 3) return "short";
  if (wordCount <= 6) return "medium";
  return "long";
}

export function createFilmArtifactProps({
  frames,
  frameSources,
  selectedQuote,
  selectedChromeMotif,
  selectedScent,
  serial,
  issueDate,
  edition,
}: Omit<FilmArtifactProps, "scentNotes" | "scentMood" | "scentDestination">): FilmArtifactProps {
  return {
    frames,
    frameSources,
    selectedQuote,
    selectedChromeMotif,
    selectedScent,
    scentNotes: selectedScent.notes.map((note) => note.en) as [string, string, string],
    scentMood: selectedScent.mood.en,
    scentDestination: selectedScent.destination.en,
    serial,
    issueDate,
    edition,
  };
}
