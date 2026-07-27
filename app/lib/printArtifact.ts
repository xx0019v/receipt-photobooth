/**
 * Canonical print artifact specification.
 *
 * The screen artefact and the physical print are the SAME artefact. To keep
 * them that way, everything that identifies an edition is frozen ONCE — at
 * Proof Lock — into a `PrintArtifactSpec`, and every downstream consumer
 * (screen render, print raster, backend, retry, share page) reads that spec
 * instead of recomputing anything.
 *
 * Nothing here may call `new Date()` or `Math.random()` during render. The
 * spec is built once by `createPrintArtifactSpec` from values already fixed
 * in the session, and is then immutable for the life of the session — a
 * retry after a printer error MUST reuse the identical spec, or the guest
 * would receive a different edition than the one they approved.
 */

export const PRINT_ARTIFACT_VERSION = "1.0.0";
export const PRINT_RENDERER_VERSION = "native-svg-thermal-1";

/** Artwork geometry per style — the single source of truth for BOTH the
 *  on-screen component and the print raster. If these ever disagree with the
 *  React components, the golden tests fail.
 *
 *  `artwork` is how the piece is composed and read; `canvas` is the shape of
 *  the paper it comes out on. PASS is authored landscape but printed down a
 *  58 mm roll, so it is rotated 90° — ONCE, in the DOM, by
 *  `BoardingPassPrint`. Nothing downstream rotates again: the rasteriser and
 *  the backend both treat `canvas` as already-final. */
export const ARTWORK = {
  pass: {
    width: 2100,
    height: 620,
    orientation: "landscape" as const,
    canvas: { width: 620, height: 2100 },
    rotatedInDom: true,
  },
  cover: {
    width: 640,
    height: 1280,
    orientation: "portrait" as const,
    canvas: { width: 640, height: 1280 },
    rotatedInDom: false,
  },
} as const;

export type PrintStyleId = keyof typeof ARTWORK;

export function isPrintStyle(value: string): value is PrintStyleId {
  return value === "pass" || value === "cover";
}

/** Normalized crop, 0..1 of the source frame. The screen and the print use
 *  the SAME numbers so a face is never re-cropped differently on paper. */
export type FrameCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const DEFAULT_FRAME_CROP: FrameCrop = { x: 0, y: 0, width: 1, height: 1 };

export type PrintArtifactSpec = {
  version: string;
  rendererVersion: string;
  style: PrintStyleId;
  sessionId: string;
  serial: string;
  issueDate: string;
  issueTime: string;
  edition: string;
  /** Chosen frames, already in print order. Index 0 prints first. */
  selectedFrameIds: string[];
  /** 1-based indices into the captured set, in print order. */
  selectedFrameOrder: number[];
  /** Same crop for screen and paper, keyed by frame id. */
  crops: Record<string, FrameCrop>;
  scent: {
    id: string;
    code: string;
    name: string;
    mood: string;
    character: string;
    destination: string;
    notes: string[];
  };
  quote?: { text: string; variant: string };
  motif?: { id: string; asset: string };
  qrUrl?: string;
  printerWidthDots: number;
  ditherMode: "floyd-steinberg";
  artwork: {
    width: number;
    height: number;
    orientation: "portrait" | "landscape";
    canvas: { width: number; height: number };
    rotatedInDom: boolean;
  };
};

/**
 * Freeze the spec. Call this exactly once per issued edition (at Proof Lock)
 * and keep the result in session state — never rebuild it per render.
 */
export function createPrintArtifactSpec(input: {
  style: PrintStyleId;
  sessionId: string;
  serial: string;
  issueDate: string;
  issueTime: string;
  edition: string;
  selectedFrameIds: string[];
  selectedFrameOrder: number[];
  crops?: Record<string, FrameCrop>;
  scent: PrintArtifactSpec["scent"];
  quote?: PrintArtifactSpec["quote"];
  motif?: PrintArtifactSpec["motif"];
  qrUrl?: string;
  printerWidthDots: number;
}): PrintArtifactSpec {
  const artwork = ARTWORK[input.style];
  const crops: Record<string, FrameCrop> = { ...(input.crops ?? {}) };
  for (const id of input.selectedFrameIds) {
    if (!crops[id]) crops[id] = DEFAULT_FRAME_CROP;
  }
  return {
    version: PRINT_ARTIFACT_VERSION,
    rendererVersion: PRINT_RENDERER_VERSION,
    style: input.style,
    sessionId: input.sessionId,
    serial: input.serial,
    issueDate: input.issueDate,
    issueTime: input.issueTime,
    edition: input.edition,
    selectedFrameIds: [...input.selectedFrameIds],
    selectedFrameOrder: [...input.selectedFrameOrder],
    crops,
    scent: { ...input.scent, notes: [...input.scent.notes] },
    quote: input.quote ? { ...input.quote } : undefined,
    motif: input.motif ? { ...input.motif } : undefined,
    qrUrl: input.qrUrl,
    printerWidthDots: input.printerWidthDots,
    ditherMode: "floyd-steinberg",
    artwork: { ...artwork, canvas: { ...artwork.canvas } },
  };
}

/**
 * Physical geometry of the printed artefact.
 *
 * `printerWidthDots` comes from the backend (`/api/health`) — it is NOT
 * hardcoded here, because 58 mm (384 dots) and 80 mm (576 dots) heads are
 * both plausible and rastering at the wrong width silently crops the piece.
 *
 * The print canvas is already paper-shaped (PASS was rotated in the DOM), so
 * this is a pure uniform scale. Nothing here rotates.
 */
export function printGeometry(spec: PrintArtifactSpec, printerWidthDots: number) {
  const { width: cw, height: ch } = spec.artwork.canvas;
  const scale = printerWidthDots / cw;
  const heightDots = Math.round(ch * scale);
  return {
    widthDots: printerWidthDots,
    heightDots,
    scale,
    // 8 dots/mm is the standard thermal head density.
    physicalWidthMm: printerWidthDots / 8,
    physicalLengthMm: Math.round((heightDots / 8) * 10) / 10,
    dpi: 203,
  };
}
