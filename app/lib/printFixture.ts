/**
 * A fixed edition, for the Print Artifact Inspector and the golden tests.
 *
 * Every value here is frozen: same frames, same serial, same date, same
 * scent, same quote, same motif. Golden rasters are only meaningful if the
 * inputs never move, and the inspector wants a stable thing to look at.
 */
import { scentById } from "./edition";
import { QUOTES } from "./quotes";
import { CHROME_ASSETS } from "./chromeAssets";
import { createPrintArtifactSpec, type PrintStyleId } from "./printArtifact";
import type { Scent } from "./edition";

export const FIXTURE = {
  serial: "2026-0042",
  issueDate: "24 JUL 2026",
  issueTime: "14:08",
  edition: "No. 042",
  frameOrder: [4, 1, 6] as number[],
  scentId: "nocturne",
  quoteIndex: 0,
  motifId: "crescent" as keyof typeof CHROME_ASSETS,
} as const;

export function fixtureScent(): Scent {
  return scentById(FIXTURE.scentId);
}

export function fixtureSpec(style: PrintStyleId) {
  const scent = fixtureScent();
  return createPrintArtifactSpec({
    style,
    sessionId: "fixture",
    serial: FIXTURE.serial,
    issueDate: FIXTURE.issueDate,
    issueTime: FIXTURE.issueTime,
    edition: FIXTURE.edition,
    selectedFrameIds: FIXTURE.frameOrder.map((n) => `${FIXTURE.serial}-${n}`),
    selectedFrameOrder: FIXTURE.frameOrder,
    scent: {
      id: scent.id,
      code: scent.code,
      name: scent.name,
      mood: scent.mood.en,
      character: scent.phrase.en,
      destination: scent.destination.en,
      notes: scent.notes.map((n) => n.en),
    },
    quote: {
      text: QUOTES[FIXTURE.quoteIndex].text,
      variant: QUOTES[FIXTURE.quoteIndex].variant,
    },
    motif: {
      id: CHROME_ASSETS[FIXTURE.motifId].id,
      asset: CHROME_ASSETS[FIXTURE.motifId].path,
    },
    qrUrl:
      style === "pass"
        ? `https://the-receipt.studio/p/${FIXTURE.serial}`
        : undefined,
    printerWidthDots: 384,
  });
}
