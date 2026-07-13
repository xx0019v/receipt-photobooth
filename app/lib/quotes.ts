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
  alignment: "left" | "center" | "right";
  scale: "compact" | "standard" | "large";
  lineBreak?: string[];
  mood: "resolve" | "confidence" | "patience" | "timeless" | "art";
};

export const QUOTES: Quote[] = [
  { text: "Your only limit is you.", variant: "serif", alignment: "left", scale: "compact", lineBreak: ["Your only", "limit is you."], mood: "resolve" },
  { text: "Prove them wrong.", variant: "sans", alignment: "left", scale: "standard", lineBreak: ["Prove them", "wrong."], mood: "confidence" },
  { text: "You can.", variant: "serif-italic", alignment: "center", scale: "large", mood: "confidence" },
  { text: "Success.", variant: "sans-caps", alignment: "center", scale: "large", mood: "confidence" },
  { text: "Trust the process.", variant: "serif-italic", alignment: "right", scale: "standard", lineBreak: ["Trust the", "process."], mood: "patience" },
  { text: "Forever.", variant: "serif-italic", alignment: "center", scale: "large", mood: "timeless" },
  { text: "Born to win.", variant: "sans", alignment: "left", scale: "standard", mood: "confidence" },
  { text: "One day at a time.", variant: "serif", alignment: "right", scale: "compact", lineBreak: ["One day", "at a time."], mood: "patience" },
  { text: "This is art.", variant: "serif-italic", alignment: "center", scale: "standard", mood: "art" },
];

/** Pick one quote at random — call ONCE per session, then persist it. */
export function pickQuote(): Quote {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}
