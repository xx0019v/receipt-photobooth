/**
 * The print artefact as native SVG — the ONE place a printable raster is drawn.
 *
 * Why native SVG and not a DOM screenshot: drawing an HTML `<foreignObject>`
 * to a canvas taints it (unconditionally in some Chromium/Electron builds),
 * and the brief forbids html2canvas-style capture for exactly the reasons it
 * lists — CSS transform drift, font races, devicePixelRatio, clip-path. A
 * hand-built SVG rasterises identically on every browser and on the Pi.
 *
 * How parity is kept without a second "design": every value comes from the one
 * frozen `PrintArtifactSpec`, and the geometry comes from the same constants
 * the React components export (`BOARDING_*`, `ARTWORK`). The layout below is a
 * faithful thermal translation of `BoardingPass` / `MagazineCover` — same
 * regions, same photo order, same metadata, same proportions — rendered in the
 * monochrome the head can actually burn. The brief permits exactly these
 * translation differences (grayscale, threshold, min line width) and forbids
 * the ones that would change the artefact (layout, copy, order, ratio).
 */
import {
  BOARDING_W,
  BOARDING_H,
  BOARDING_MAIN_W,
  BOARDING_INFO_W,
  BOARDING_STUB_W,
  BOARDING_PHOTO_SIZE,
  BOARDING_PHOTO_GAP,
  PASS_TYPE,
} from "@/app/components/BoardingPass";
import { BRAND } from "@/app/lib/edition";
import type { PrintArtifactSpec } from "@/app/lib/printArtifact";

const INK = "#000";
const PAPER = "#fff";
const DIM = "#000";

/** Photos for the print. When real camera frames exist they arrive as data
 *  URIs keyed by 1-based frame number; otherwise a thermal placeholder is
 *  drawn so the layout is exact even before the camera is wired. */
export type PhotoSources = Record<number, string>;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function text(
  x: number,
  y: number,
  s: string,
  opts: {
    size: number;
    family?: "display" | "mono";
    weight?: number;
    anchor?: "start" | "middle" | "end";
    tracking?: number;
    fill?: string;
    upper?: boolean;
  },
): string {
  const family =
    opts.family === "display"
      ? "'Bodoni Moda','Didot',Georgia,serif"
      : "'Space Mono','DejaVu Sans Mono',monospace";
  const t = opts.upper ? s.toUpperCase() : s;
  return (
    `<text x="${x}" y="${y}" font-family="${family}" font-size="${opts.size}" ` +
    `font-weight="${opts.weight ?? 400}" text-anchor="${opts.anchor ?? "start"}" ` +
    `letter-spacing="${opts.tracking ?? 0}" fill="${opts.fill ?? INK}">${esc(t)}</text>`
  );
}

function label(x: number, y: number, s: string, anchor: "start" | "end" = "start"): string {
  return text(x, y, s, {
    size: PASS_TYPE.label,
    family: "mono",
    tracking: 1.8,
    fill: DIM,
    anchor,
    upper: true,
  });
}

/** A thermal photo cell: the real frame if we have it, else a registration
 *  placeholder that keeps the exact box and print order. */
function photoCell(
  x: number,
  y: number,
  size: number,
  frameNo: number,
  photos: PhotoSources,
): string {
  const src = photos[frameNo];
  if (src) {
    // clipPath keeps the crop identical to the screen (object-fit: cover).
    const id = `pc${x}_${y}`;
    return (
      `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${size}" height="${size}"/></clipPath>` +
      `<image x="${x}" y="${y}" width="${size}" height="${size}" clip-path="url(#${id})" ` +
      `preserveAspectRatio="xMidYMid slice" href="${src}"/>` +
      `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="none" stroke="${INK}" stroke-width="1"/>`
    );
  }
  // Placeholder: pale field + centred frame index + crop ticks. Deliberately
  // light so the head does not lay down a solid slab where a face will go.
  const cx = x + size / 2;
  const cy = y + size / 2;
  return (
    `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="#e9e9e9" stroke="${INK}" stroke-width="1"/>` +
    text(cx, cy + 26, String(frameNo).padStart(2, "0"), {
      size: 74,
      family: "display",
      fill: "#bdbdbd",
      anchor: "middle",
    }) +
    text(cx, y + size - 16, "FRAME", { size: 11, family: "mono", tracking: 3, fill: "#9a9a9a", anchor: "middle" })
  );
}

function barcode(x: number, y: number, w: number, h: number, pattern: string): string {
  const widths = pattern.split("").map((c) => Number(c) * 1.3);
  const total = widths.reduce((a, b) => a + b + 2, 0);
  const scale = w / total;
  let cursor = x;
  let out = "";
  widths.forEach((bw, i) => {
    const barW = bw * scale;
    if (i % 2 === 0) out += `<rect x="${cursor}" y="${y}" width="${barW}" height="${h}" fill="${INK}"/>`;
    cursor += barW + 2 * scale;
  });
  return out;
}

function dashedCut(cx: number, top: number, bottom: number): string {
  return (
    `<line x1="${cx}" y1="${top}" x2="${cx}" y2="${bottom}" stroke="${INK}" stroke-width="1.4" stroke-dasharray="5 5"/>` +
    `<circle cx="${cx}" cy="${top}" r="6" fill="${PAPER}" stroke="${INK}" stroke-width="1"/>` +
    `<circle cx="${cx}" cy="${bottom}" r="6" fill="${PAPER}" stroke="${INK}" stroke-width="1"/>`
  );
}

function edition_(spec: PrintArtifactSpec): { no: string; code: string } {
  // Edition code carried on the spec's motif/scent is resolved upstream; the
  // spec already froze `edition` as a display string ("No. 042"). The PASS
  // wants the short code too, derived from the scent id the same way the
  // component does.
  const map: Record<string, { no: string; code: string }> = {
    cold: { no: "01", code: "RAW" },
    clean: { no: "02", code: "STILL" },
    warm: { no: "03", code: "BOLD" },
    nocturne: { no: "04", code: "AFTERIMAGE" },
  };
  return map[spec.scent.id] ?? { no: "01", code: "RAW" };
}

/**
 * PASS — authored landscape (2100×620), rotated 90° ONCE into the 620×2100
 * print canvas. The rotation lives here, in the SVG; the backend never rotates.
 */
export function passSvg(
  spec: PrintArtifactSpec,
  opts: { photos?: PhotoSources; qrDataUri?: string; fontCss?: string; motifSvg?: string } = {},
): string {
  const photos = opts.photos ?? {};
  const order = spec.selectedFrameOrder.length
    ? spec.selectedFrameOrder
    : [1, 2, 3];
  const ed = edition_(spec);
  const seat = `${String(order.length).padStart(2, "0")}A`;
  const passNo = `TR-${spec.serial.replace(/\D/gu, "").slice(-6).padStart(6, "0")}`;

  const W = BOARDING_W;
  const H = BOARDING_H;
  const parts: string[] = [];

  // --- Main region: masthead, headline, photo strip ---
  const mainX = 54 + 40;
  parts.push(text(mainX, 46, BRAND, { size: PASS_TYPE.masthead, family: "mono", tracking: 3, upper: true }));
  parts.push(text(54 + BOARDING_MAIN_W - 40, 46, "Boarding Pass", { size: PASS_TYPE.masthead, family: "mono", tracking: 3, fill: DIM, anchor: "end", upper: true }));
  parts.push(`<line x1="${mainX}" y1="60" x2="${54 + BOARDING_MAIN_W - 40}" y2="60" stroke="${INK}" stroke-width="1"/>`);
  parts.push(text(mainX, 118, "Memories, bottled.", { size: 54, family: "display", weight: 600, upper: true }));
  parts.push(text(mainX, 146, "A journey in frames. A memory that stays with you.", {
    size: PASS_TYPE.supporting,
    family: "mono",
    tracking: 2,
    fill: DIM,
    upper: true,
  }));

  // photo strip (print order)
  const stripY = 166;
  order.slice(0, 3).forEach((frameNo, i) => {
    const px = mainX + i * (BOARDING_PHOTO_SIZE + BOARDING_PHOTO_GAP);
    parts.push(photoCell(px, stripY, BOARDING_PHOTO_SIZE, frameNo, photos));
  });
  const mainR = 54 + BOARDING_MAIN_W - 40;
  const captionY = H - 26;
  const captionCx = (mainX + mainR) / 2;
  parts.push(`<line x1="${mainX}" y1="${captionY - 5}" x2="${captionCx - 245}" y2="${captionY - 5}" stroke="${INK}" stroke-width="1"/>`);
  parts.push(text(captionCx - 10, captionY, "Captured today, remembered always.", {
    size: PASS_TYPE.caption,
    family: "mono",
    tracking: 2.2,
    fill: DIM,
    anchor: "middle",
    upper: true,
  }));
  parts.push(text(captionCx + 230, captionY, "✦", {
    size: PASS_TYPE.caption,
    family: "display",
    fill: DIM,
    anchor: "middle",
  }));
  parts.push(`<line x1="${captionCx + 250}" y1="${captionY - 5}" x2="${mainR}" y2="${captionY - 5}" stroke="${INK}" stroke-width="1"/>`);

  // security seal (motif) — top-right of main
  const sealCx = 54 + BOARDING_MAIN_W - 84;
  const sealCy = 96;
  if (opts.motifSvg) {
    parts.push(
      `<clipPath id="seal"><circle cx="${sealCx}" cy="${sealCy}" r="42"/></clipPath>` +
        `<g clip-path="url(#seal)" transform="translate(${sealCx - 42},${sealCy - 42})"><svg width="84" height="84" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">${opts.motifSvg}</svg></g>` +
        `<circle cx="${sealCx}" cy="${sealCy}" r="42" fill="none" stroke="${INK}" stroke-width="1"/>`,
    );
  } else {
    parts.push(`<circle cx="${sealCx}" cy="${sealCy}" r="42" fill="none" stroke="${INK}" stroke-width="1"/>`);
  }

  // --- Perforation 1 ---
  const cut1 = 54 + BOARDING_MAIN_W + 20;
  parts.push(dashedCut(cut1, 22, H - 22));

  // --- Information region ---
  const infoX = 54 + BOARDING_MAIN_W + 40 + 30;
  const infoR = infoX + BOARDING_INFO_W - 60;
  parts.push(label(infoX, 52, "Passenger"));
  parts.push(text(infoX, 84, "Guest", { size: 26, family: "display", upper: true }));
  parts.push(label(infoR, 52, "Class", "end"));
  parts.push(text(infoR, 84, "Archive", { size: 18, family: "mono", tracking: 1, anchor: "end", upper: true }));
  parts.push(`<line x1="${infoX}" y1="116" x2="${infoR}" y2="116" stroke="${INK}" stroke-width="1"/>`);

  parts.push(label(infoX, 150, "From"));
  parts.push(text(infoX, 192, "Now", { size: 38, family: "display", upper: true }));
  parts.push(label(infoR, 150, "To", "end"));
  parts.push(text(infoR, 192, "Forever", { size: 38, family: "display", anchor: "end", upper: true }));
  parts.push(label(infoX, 232, "Route"));
  parts.push(text(infoX, 258, "Memory → Archive", { size: 20, family: "mono", tracking: 1.2, upper: true }));
  parts.push(`<line x1="${infoX}" y1="288" x2="${infoR}" y2="288" stroke="${INK}" stroke-width="1"/>`);

  const gridY = 316;
  parts.push(label(infoX, gridY, "Flight"));
  parts.push(text(infoX, gridY + 26, spec.scent.code, { size: 20, family: "mono", tracking: 0.8, upper: true }));
  parts.push(label(infoX + 130, gridY, "Gate"));
  parts.push(text(infoX + 130, gridY + 26, "MEMORY", { size: 20, family: "mono", tracking: 0.8, upper: true }));
  parts.push(label(infoR, gridY, "Seat", "end"));
  parts.push(text(infoR, gridY + 26, seat, { size: 20, family: "mono", tracking: 0.8, anchor: "end", upper: true }));
  parts.push(label(infoX, gridY + 74, "Boarding"));
  parts.push(text(infoX, gridY + 100, spec.issueTime, { size: 18, family: "mono", tracking: 0.6 }));
  parts.push(label(infoR, gridY + 74, "Date", "end"));
  parts.push(text(infoR, gridY + 100, spec.issueDate, { size: 18, family: "mono", tracking: 0.6, anchor: "end" }));

  parts.push(`<line x1="${infoX}" y1="${H - 96}" x2="${infoR}" y2="${H - 96}" stroke="${INK}" stroke-width="1"/>`);
  parts.push(label(infoX, H - 66, "Edition"));
  parts.push(text(infoX, H - 40, `${ed.no} · ${ed.code}`, { size: 22, family: "display", upper: true }));
  parts.push(label(infoR, H - 66, "Serial", "end"));
  parts.push(text(infoR, H - 40, spec.serial, { size: 18, family: "mono", tracking: 0.4, anchor: "end" }));

  // --- Perforation 2 ---
  const cut2 = 54 + BOARDING_MAIN_W + 40 + BOARDING_INFO_W + 40 + 20;
  parts.push(dashedCut(cut2, 22, H - 22));

  // --- Stub region ---
  const stubX = 54 + BOARDING_MAIN_W + 40 + BOARDING_INFO_W + 40 + 40 + 24;
  const stubR = stubX + BOARDING_STUB_W - 48;
  parts.push(label(stubX, 46, "Pass No."));
  parts.push(text(stubX, 70, passNo, { size: 21, family: "mono", tracking: 0.4, upper: true }));
  parts.push(label(stubX, 104, "Serial"));
  parts.push(text(stubX, 128, spec.serial, { size: PASS_TYPE.stubSmall, family: "mono", tracking: 0.4 }));
  parts.push(`<line x1="${stubX}" y1="150" x2="${stubR}" y2="150" stroke="${INK}" stroke-width="1"/>`);
  parts.push(label(stubX, 174, "From"));
  parts.push(text(stubX, 198, "Now", { size: 19, family: "display", upper: true }));
  parts.push(label(stubR, 174, "To", "end"));
  parts.push(text(stubR, 198, "Forever", { size: 19, family: "display", anchor: "end", upper: true }));
  parts.push(label(stubX, 238, "Flight"));
  parts.push(text(stubX, 262, spec.scent.code, { size: PASS_TYPE.stubSmall, family: "mono", tracking: 0.4, upper: true }));
  parts.push(label(stubR, 238, "Seat", "end"));
  parts.push(text(stubR, 262, seat, { size: PASS_TYPE.stubSmall, family: "mono", tracking: 0.4, anchor: "end", upper: true }));
  parts.push(label(stubX, 302, "Date"));
  parts.push(text(stubX, 326, spec.issueDate, { size: PASS_TYPE.stubTiny, family: "mono", tracking: 0.3 }));
  parts.push(label(stubR, 302, "Time", "end"));
  parts.push(text(stubR, 326, spec.issueTime, { size: PASS_TYPE.stubTiny, family: "mono", tracking: 0.3, anchor: "end" }));

  // barcode + QR at the stub foot (nearest the printer slot)
  parts.push(barcode(stubX, H - 150, BOARDING_STUB_W - 48, 42, "413132214231341221432312143132421334"));
  parts.push(text(stubX, H - 92, `Ed. ${ed.no}`, { size: PASS_TYPE.stubTiny, family: "mono", tracking: 1.2, fill: DIM, upper: true }));
  if (opts.qrDataUri) {
    const qrS = 78;
    parts.push(`<rect x="${stubR - qrS - 10}" y="${H - 88 - qrS}" width="${qrS + 10}" height="${qrS + 10}" fill="none" stroke="${INK}" stroke-width="1.4"/>`);
    parts.push(`<image x="${stubR - qrS - 5}" y="${H - 83 - qrS}" width="${qrS}" height="${qrS}" image-rendering="pixelated" href="${opts.qrDataUri}"/>`);
  }

  // edge marks
  parts.push(
    `<g transform="translate(30 ${H / 2}) rotate(-90)">` +
      text(0, 0, `${BRAND} - Boarding Pass`, { size: PASS_TYPE.edge, family: "mono", tracking: 2, fill: DIM, anchor: "middle", upper: true }) +
    `</g>`,
  );
  parts.push(
    `<g transform="translate(${W - 30} ${H / 2}) rotate(90)">` +
      text(0, 0, "One of the archive. Made to last.", { size: PASS_TYPE.edge, family: "mono", tracking: 2, fill: DIM, anchor: "middle", upper: true }) +
    `</g>`,
  );

  const body =
    `<rect width="${W}" height="${H}" fill="${PAPER}"/>` +
    // rotate edge-mark text back to vertical
    `<g>${parts.join("")}</g>`;

  // Rotate the whole landscape ticket into the portrait print canvas (once).
  return wrapSvg(
    BOARDING_H,
    BOARDING_W,
    `<g transform="translate(${BOARDING_H},0) rotate(90)">${body}</g>`,
    opts.fontCss,
  );
}

/** FILM — native 640×1280 portrait, no rotation. */
export function filmSvg(
  spec: PrintArtifactSpec,
  opts: { photos?: PhotoSources; fontCss?: string; motifSvg?: string } = {},
): string {
  const photos = opts.photos ?? {};
  const order = spec.selectedFrameOrder.length ? spec.selectedFrameOrder : [1, 2, 3];
  const ed = edition_(spec);
  const W = spec.artwork.width;
  const H = spec.artwork.height;
  const parts: string[] = [];

  // masthead
  parts.push(text(W / 2, 104, "FILM", { size: 74, family: "display", anchor: "middle", tracking: 10, upper: true }));
  parts.push(text(W / 2, 132, "Edition · Print", { size: 13, family: "mono", tracking: 6.5, fill: DIM, anchor: "middle", upper: true }));

  // photo column (print order) + motif + vertical quote
  const colX = 46;
  const photoSize = 288;
  order.slice(0, 3).forEach((frameNo, i) => {
    parts.push(photoCell(colX, 176 + i * (photoSize + 14), photoSize, frameNo, photos));
  });

  const marginX = colX + photoSize;
  const motifCx = W - 46 - 37;
  if (opts.motifSvg) {
    parts.push(
      `<clipPath id="fmotif"><circle cx="${motifCx}" cy="223" r="37"/></clipPath>` +
        `<g clip-path="url(#fmotif)" transform="translate(${motifCx - 37},186)"><svg width="74" height="74" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">${opts.motifSvg}</svg></g>` +
        `<circle cx="${motifCx}" cy="223" r="37" fill="none" stroke="${INK}" stroke-width="1"/>`,
    );
  }
  // vertical quote down the right margin (short/medium only)
  const words = spec.quote?.text.split(/\s+/u).length ?? 0;
  if (spec.quote && words <= 6) {
    const qx = marginX + (W - 46 - marginX) / 2 + 8;
    const qsize = words <= 3 ? 54 : 38;
    parts.push(
      `<g transform="translate(${qx},780) rotate(-90)">` +
        text(0, 0, spec.quote.text.replace(/\.$/, ""), { size: qsize, family: "display", anchor: "middle", tracking: 3, upper: true }) +
        `</g>`,
    );
  }

  // footer: notes/character, metadata, statement, barcode
  const fy = H - 200;
  parts.push(text(colX, fy, `${ed.code} — ${spec.scent.character}`, { size: 10, family: "mono", tracking: 3, fill: DIM, upper: true }));
  parts.push(`<line x1="${colX}" y1="${fy + 16}" x2="${W - 46}" y2="${fy + 16}" stroke="${INK}" stroke-width="1"/>`);

  const metaLabels = ["Issued", "Run", "Serial", "Edition"];
  const run = (() => {
    const d = spec.serial.replace(/\D/gu, "");
    return d ? `${String((parseInt(d.slice(-4), 10) % 100) + 1).padStart(2, "0")} / 100` : "01 / 100";
  })();
  const metaValues = [spec.issueDate || "—", run, spec.serial, ed.code];
  const colW = (W - 46 - colX) / 4;
  metaLabels.forEach((l, i) => {
    const mx = colX + i * colW;
    parts.push(text(mx, fy + 44, l, { size: 9, family: "mono", tracking: 3.2, fill: DIM, upper: true }));
    parts.push(text(mx, fy + 66, metaValues[i], { size: 13, family: "mono", tracking: 0.8, upper: true }));
  });

  const statement = words > 6 && spec.quote ? spec.quote.text : "Captured, composed, issued.";
  parts.push(text(W / 2, fy + 104, statement, { size: 11, family: "mono", tracking: 3.4, anchor: "middle", upper: true }));

  parts.push(text(colX, fy + 150, "FILM", { size: 22, family: "display", tracking: 3, upper: true }));
  parts.push(barcode(W / 2 - 60, fy + 128, 120, 34, "413132214231341221433142"));
  parts.push(text(W - 46, fy + 144, spec.edition || "—", { size: 10, family: "mono", tracking: 2, fill: DIM, anchor: "end" }));

  const body = `<rect width="${W}" height="${H}" fill="${PAPER}"/>${parts.join("")}`;
  return wrapSvg(W, H, body, opts.fontCss);
}

function wrapSvg(width: number, height: number, inner: string, fontCss?: string): string {
  const style = fontCss ? `<style>${fontCss}</style>` : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">${style}${inner}</svg>`
  );
}

export function buildArtifactSvg(
  spec: PrintArtifactSpec,
  opts: { photos?: PhotoSources; qrDataUri?: string; fontCss?: string; motifSvg?: string } = {},
): string {
  return spec.style === "cover" ? filmSvg(spec, opts) : passSvg(spec, opts);
}
