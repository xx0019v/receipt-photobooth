/** Shared "edition" metadata used across the kiosk, receipt-magazine style. */

/** Number of frames captured per session. */
export const TOTAL_SHOTS = 3;

export const BRAND = "THE RECEIPT";
export const TAGLINE = "AN EDITORIAL PHOTOBOOTH";
export const LOCATION = "NEXT TO THE SCENT MACHINE";

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
