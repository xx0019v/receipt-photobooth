/**
 * Booth backend client (FastAPI on the Pi, `backend/`).
 *
 * In `mock` mode every call degrades gracefully: when the backend is
 * unreachable the kiosk falls back to mock visuals (Portrait placeholders,
 * simulated print) so the UI can be demoed standalone with `npm run dev`.
 *
 * In `hardware` mode it does NOT. A booth that quietly simulates a print when
 * the printer is missing sends the guest away empty-handed while showing them
 * a success screen — the failure has to be loud, on the machine, where staff
 * can see it. `assertHardwareReachable` is that gate.
 */
import type { Scent } from "./edition";
import type { Quote } from "./quotes";
import type { PrintStyle } from "./printStyle";

export const API_BASE =
  process.env.NEXT_PUBLIC_BOOTH_API ?? "http://127.0.0.1:8000";

/**
 * `hardware` on the Pi, `mock` on a laptop. Defaults to `mock` so a developer
 * never needs a printer — but the Pi's systemd unit sets it explicitly, and
 * in `hardware` mode there is no silent fallback path at all.
 */
export const BOOTH_MODE: "hardware" | "mock" =
  process.env.NEXT_PUBLIC_BOOTH_MODE === "hardware" ? "hardware" : "mock";

export const isHardwareMode = BOOTH_MODE === "hardware";

export type BoothSession = { sessionId: string; serial: string };

/** A captured frame: 1-based `n`; `url` is null without a backend. */
export type Frame = { n: number; url: string | null };

export type PrintJob = {
  state:
    | "queued"
    | "validating"
    | "rendering"
    | "rasterizing"
    | "ready_to_print"
    | "printing"
    | "sent"
    | "feeding"
    | "cutting"
    | "done"
    | "error";
  progress: number;
  message: string;
  may_have_printed?: boolean;
};

async function req<T>(path: string, init?: RequestInit, timeoutMs = 4000): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

export async function createSession(): Promise<BoothSession> {
  const body = await req<{ session_id: string; serial: string }>(
    "/api/sessions",
    { method: "POST" },
    1500, // fast probe: also decides live vs. mock mode
  );
  return { sessionId: body.session_id, serial: body.serial };
}

export async function captureFrame(sessionId: string, n: number): Promise<Frame> {
  const body = await req<{ frame_id: string; url: string }>(
    `/api/sessions/${sessionId}/capture`,
    { method: "POST" },
    6000,
  );
  return { n, url: `${API_BASE}${body.url}` };
}

export async function clearCapturedFrames(sessionId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/sessions/${sessionId}/frames`, {
    method: "DELETE",
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) throw new Error(`clear captured frames -> ${res.status}`);
}

/**
 * Kick off the real print; the artefact copy travels with the request.
 * `frameOrder` is the 1-based, print-order subset of this session's captured
 * frames (e.g. [4, 1, 6] out of 6 captured) — omit to print every captured
 * frame in capture order.
 */
export async function startPrint(
  sessionId: string,
  style: PrintStyle,
  scent: Scent,
  quote: Quote,
  frameOrder?: number[],
): Promise<string> {
  const body = await req<{ job_id: string }>(`/api/sessions/${sessionId}/print`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      style,
      scent: {
        code: scent.code,
        name: scent.name,
        mood: scent.mood.en,
        destination: scent.destination.en,
        notes: scent.notes.map((n) => n.en),
      },
      quote: { text: quote.text, variant: quote.variant },
      frames: frameOrder,
    }),
  });
  return body.job_id;
}

export function getPrintJob(jobId: string): Promise<PrintJob> {
  return req<PrintJob>(`/api/print-jobs/${jobId}`);
}

// -- canonical artefact path ---------------------------------------------------

export type BoothHealth = {
  status: string;
  mode: "hardware" | "mock";
  camera: boolean;
  printer: boolean;
  printer_status?: {
    connection_available: boolean;
    device_status: "online" | "unknown" | "offline";
    detail: string;
  };
  drivers: { camera: string; printer: string };
  artifact: {
    width_dots: number;
    tail_feed_dots: number;
    styles: string[];
    dpi: number;
    physical_width_mm: number;
  };
  sharing: { base_url: string };
};

export function getHealth(): Promise<BoothHealth> {
  return req<BoothHealth>("/api/health", undefined, 2000);
}

/**
 * Refuse to continue if this booth claims to be hardware but isn't.
 *
 * Called before the guest is promised a printed artefact. A booth configured
 * for hardware that finds mock drivers — or no backend — must stop here
 * rather than run the pretty simulation to completion.
 */
export async function assertHardwareReachable(): Promise<BoothHealth> {
  const health = await getHealth();
  if (isHardwareMode && health.mode !== "hardware") {
    throw new Error(
      `booth is configured for hardware but the backend reports ${health.mode} ` +
        `drivers (camera=${health.drivers.camera}, printer=${health.drivers.printer})`,
    );
  }
  if (isHardwareMode && !health.printer) {
    throw new Error("printer is not responding");
  }
  return health;
}

export type ArtifactPrintAck = {
  jobId: string;
  artifactSha256: string;
  widthDots: number;
  heightDots: number;
  blackRatio: number;
};

/**
 * Hand the backend the exact pixels the guest approved.
 *
 * `manifest` is the frozen `PrintArtifactSpec`; `sha256` is computed over the
 * same bytes being uploaded, so a truncated transfer is caught rather than
 * printed. `idempotencyKey` makes a retry after a network wobble rejoin the
 * existing job instead of consuming a second length of paper.
 */
export async function printArtifact(
  sessionId: string,
  artifact: Blob,
  manifest: unknown,
  sha256: string,
  idempotencyKey: string,
  retryRequested = false,
): Promise<ArtifactPrintAck> {
  const form = new FormData();
  const manifestEnvelope =
    typeof manifest === "object" && manifest !== null
      ? { ...manifest, artifactHash: sha256, idempotencyKey }
      : manifest;
  form.append("manifest", JSON.stringify(manifestEnvelope));
  form.append("artifact_hash", sha256);
  form.append("idempotency_key", idempotencyKey);
  form.append("retry_requested", retryRequested ? "true" : "false");
  form.append("artifact", artifact, "artifact.png");

  const res = await fetch(`${API_BASE}/api/sessions/${sessionId}/print-artifact`, {
    method: "POST",
    body: form,
    // Generous: a 384×5000 PNG over localhost is fast, but the Pi is not.
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    // The backend's rejections are specific ("unknown style", "hash
    // mismatch"). Surface them verbatim — staff need to know which.
    const detail = await res
      .json()
      .then((b) => (b as { detail?: string }).detail)
      .catch(() => null);
    throw new Error(detail || `print-artifact -> ${res.status}`);
  }
  const body = (await res.json()) as {
    job_id: string;
    artifact_sha256: string;
    width_dots: number;
    height_dots: number;
    black_ratio: number;
  };
  return {
    jobId: body.job_id,
    artifactSha256: body.artifact_sha256,
    widthDots: body.width_dots,
    heightDots: body.height_dots,
    blackRatio: body.black_ratio,
  };
}

export type ThermalPreview = {
  /** Object URL for the 1-bit PNG. Revoke when done. */
  url: string;
  sha256: string;
  widthDots: number;
  heightDots: number;
  contentHeightDots: number;
  tailFeedDots: number;
  blackRatio: number;
  physicalWidthMm: number;
  physicalLengthMm: number;
};

/**
 * Thermalise a raster through the real backend pipeline WITHOUT printing.
 *
 * Powers the Print Artifact Inspector: the 1-bit image it returns is what the
 * print head would actually burn, computed by the same `prepare()` the print
 * path uses — not a client-side guess at dithering.
 */
export async function thermalizePreview(
  style: string,
  artifact: Blob,
): Promise<ThermalPreview> {
  const form = new FormData();
  form.append("style", style);
  form.append("artifact", artifact, "artifact.png");
  const res = await fetch(`${API_BASE}/api/artifact/thermalize`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    const detail = await res
      .json()
      .then((b) => (b as { detail?: string }).detail)
      .catch(() => null);
    throw new Error(detail || `thermalize -> ${res.status}`);
  }
  const blob = await res.blob();
  const h = res.headers;
  return {
    url: URL.createObjectURL(blob),
    sha256: h.get("X-Artifact-Sha256") ?? "",
    widthDots: Number(h.get("X-Width-Dots") ?? 0),
    heightDots: Number(h.get("X-Height-Dots") ?? 0),
    contentHeightDots: Number(h.get("X-Content-Height-Dots") ?? 0),
    tailFeedDots: Number(h.get("X-Tail-Feed-Dots") ?? 0),
    blackRatio: Number(h.get("X-Black-Ratio") ?? 0),
    physicalWidthMm: Number(h.get("X-Physical-Width-Mm") ?? 0),
    physicalLengthMm: Number(h.get("X-Physical-Length-Mm") ?? 0),
  };
}

/** MJPEG live preview — use directly as an `<img src>`. */
export function previewUrl(): string {
  return `${API_BASE}/api/preview.mjpg`;
}

/** Real, scannable QR for the DONE screen / printed stub — same landing page. */
export function qrUrl(serial: string): string {
  return `${API_BASE}/api/qr/${serial}.png`;
}
