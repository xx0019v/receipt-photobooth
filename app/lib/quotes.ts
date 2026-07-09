/**
 * Quote bank for the COVER artefact only — a Korean-photobooth "quote card".
 * The English lines are lifted from the reference prints; each carries a
 * typographic `variant` so the card is beautiful whichever line is drawn.
 * PASS never uses these.
 */
export type QuoteVariant = "serif" | "serif-italic" | "sans" | "sans-caps";

export type Quote = {
  text: string;
  variant: QuoteVariant;
};

export const QUOTES: Quote[] = [
  { text: "Your only limit is you", variant: "serif" },
  { text: "Prove them wrong.", variant: "sans" },
  { text: "you can.", variant: "serif-italic" },
  { text: "SUCCESS", variant: "sans-caps" },
  { text: "trust the process.", variant: "serif-italic" },
  { text: "forever", variant: "serif-italic" },
  { text: "Born to win.", variant: "sans" },
  { text: "one day at a time.", variant: "serif" },
  { text: "This is art.", variant: "serif-italic" },
];

/** Pick one quote at random — call ONCE per session, then persist it. */
export function pickQuote(): Quote {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}
