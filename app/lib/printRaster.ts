/**
 * Rasterise a print artefact to the PNG the printer will burn.
 *
 * The artefact is built as native SVG by `printSvg.ts` — NOT captured from the
 * live DOM. Drawing an HTML `<foreignObject>` to a canvas taints it (proven
 * unconditional in this Electron/Chromium build), and the brief forbids
 * html2canvas-style capture anyway. A native `<svg>` with `<image>` data URIs
 * and `<text>` rasterises cleanly and identically on every browser and on the
 * Pi.
 *
 * Parity is not weakened by this: every value in the SVG comes from the one
 * frozen `PrintArtifactSpec`, and the geometry from the same constants the
 * React components export.
 */
import type { PrintArtifactSpec } from "./printArtifact";
import { printGeometry } from "./printArtifact";
import { buildArtifactSvg, type MotifSvg, type PhotoSources } from "./printSvg";
import { API_BASE, isHardwareMode } from "./api";

/** Same-origin (and CORS-enabled) assets cached as data URIs / markup. */
const dataUriCache = new Map<string, string>();
const textCache = new Map<string, string>();

async function toDataUri(url: string): Promise<string> {
  const cached = dataUriCache.get(url);
  if (cached) return cached;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`asset ${url} -> HTTP ${res.status}`);
  const blob = await res.blob();
  const uri = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`asset ${url} unreadable`));
    reader.readAsDataURL(blob);
  });
  dataUriCache.set(url, uri);
  return uri;
}

async function toText(url: string): Promise<string> {
  const cached = textCache.get(url);
  if (cached) return cached;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`asset ${url} -> HTTP ${res.status}`);
  const body = await res.text();
  textCache.set(url, body);
  return body;
}

/**
 * `@font-face` rules with their woff2 inlined, so the SVG's `<text>` renders in
 * Bodoni / Space Mono rather than a fallback face. next/font self-hosts these
 * same-origin. Fonts do not taint a canvas; a wrong face would just ship the
 * wrong type, so this is done rather than hoped for.
 */
async function inlineFontFaces(): Promise<string> {
  const rules: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let cssRules: CSSRule[];
    try {
      cssRules = Array.from(sheet.cssRules);
    } catch {
      continue;
    }
    for (const rule of cssRules) {
      if (!(rule instanceof CSSFontFaceRule)) continue;
      let text = rule.cssText;
      for (const [full, url] of text.matchAll(/url\(["']?([^"')]+)["']?\)/gu)) {
        if (url.startsWith("data:")) continue;
        try {
          const absolute = new URL(url, document.baseURI);
          if (absolute.origin !== location.origin) continue;
          text = text.replace(full, `url("${await toDataUri(absolute.href)}")`);
        } catch {
          /* leave as-is; the browser cache may still resolve it */
        }
      }
      rules.push(text);
    }
  }
  return rules.join("\n");
}

/** Inner markup of an SVG file (its children), for embedding the motif. */
async function motifInner(assetPath: string): Promise<MotifSvg | undefined> {
  try {
    const markup = await toText(new URL(assetPath, document.baseURI).href);
    const doc = new DOMParser().parseFromString(markup, "image/svg+xml");
    const svg = doc.querySelector("svg");
    if (!svg) return undefined;
    const viewBox = svg.getAttribute("viewBox");
    if (!viewBox) return undefined;
    return { inner: svg.innerHTML, viewBox };
  } catch {
    return undefined;
  }
}

export type RasterResult = {
  blob: Blob;
  sha256: string;
  widthDots: number;
  heightDots: number;
  dataUrl: string;
};

async function sha256Hex(blob: Blob): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Gather the external pieces the SVG embeds: motif markup, real photos (data
 * URIs, fetched cross-origin from the Pi backend — which is why it sends CORS
 * headers), and — for PASS — the real backend QR so screen, paper and share
 * page all point at the same URL.
 */
async function gatherAssets(spec: PrintArtifactSpec): Promise<{
  photos: PhotoSources;
  qrDataUri?: string;
  fontCss: string;
  motifSvg?: MotifSvg;
}> {
  await document.fonts.ready;
  const photos: PhotoSources = {};
  await Promise.all(
    spec.selectedFrameOrder.map(async (n, i) => {
      const id = spec.selectedFrameIds[i];
      // A frame id shaped `{serial}-{n}` resolves to a backend JPEG. Absent
      // that (mock/no camera) the SVG draws a placeholder — the layout is
      // identical either way.
      if (!id) {
        if (isHardwareMode) {
          throw new Error(`missing captured frame id at print position ${i + 1}`);
        }
        return;
      }
      try {
        photos[n] = await toDataUri(`${API_BASE}/api/frames/${id}.jpg`);
      } catch (error) {
        if (isHardwareMode) {
          throw new Error(
            `captured frame ${id} could not be loaded; refusing placeholder print`,
            { cause: error },
          );
        }
      }
    }),
  );

  let qrDataUri: string | undefined;
  if (spec.style === "pass") {
    try {
      qrDataUri = await toDataUri(`${API_BASE}/api/qr/${spec.serial}.png`);
    } catch (error) {
      if (isHardwareMode) {
        throw new Error("PASS QR could not be loaded; refusing incomplete print", {
          cause: error,
        });
      }
    }
  }

  const fontCss = await inlineFontFaces();
  const motifSvg = spec.motif ? await motifInner(spec.motif.asset) : undefined;
  if (isHardwareMode && spec.motif && !motifSvg) {
    throw new Error("edition motif could not be loaded; refusing incomplete print");
  }
  return { photos, qrDataUri, fontCss, motifSvg };
}

/**
 * Rasterise the artefact described by `spec` at the printer's dot width.
 * `printerWidthDots` comes from the backend (`/api/health`), never assumed.
 */
export async function rasterizeSpec(
  spec: PrintArtifactSpec,
  printerWidthDots: number,
): Promise<RasterResult> {
  const geometry = printGeometry(spec, printerWidthDots);
  const assets = await gatherAssets(spec);
  const markup = buildArtifactSvg(spec, assets);

  const svgUrl = URL.createObjectURL(
    new Blob([markup], { type: "image/svg+xml;charset=utf-8" }),
  );
  try {
    const image = new Image();
    image.decoding = "sync";
    image.src = svgUrl;
    await image.decode();

    const canvas = document.createElement("canvas");
    canvas.width = geometry.widthDots;
    canvas.height = geometry.heightDots;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context unavailable");

    // Thermal paper is white; fill first so any gap prints as paper, not black.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("canvas produced no PNG"))),
        "image/png",
      );
    });

    return {
      blob,
      sha256: await sha256Hex(blob),
      widthDots: geometry.widthDots,
      heightDots: geometry.heightDots,
      dataUrl: canvas.toDataURL("image/png"),
    };
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
