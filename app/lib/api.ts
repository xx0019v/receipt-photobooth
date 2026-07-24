/**
 * Booth backend client (FastAPI on the Pi, `backend/`).
 *
 * Every call degrades gracefully: when the backend is unreachable the kiosk
 * falls back to the mock visuals (Portrait placeholders, simulated print),
 * so the UI can always be demoed standalone with `npm run dev`.
 */
import type { Scent } from "./edition";
import type { Quote } from "./quotes";
import type { PrintStyle } from "./printStyle";

export const API_BASE =
  process.env.NEXT_PUBLIC_BOOTH_API ?? "http://127.0.0.1:8000";

export type BoothSession = { sessionId: string; serial: string };

/** A captured frame: 1-based `n`; `url` is null without a backend. */
export type Frame = { n: number; url: string | null };

export type PrintJob = {
  state: "queued" | "rendering" | "printing" | "done" | "error";
  progress: number;
  message: string;
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

/** MJPEG live preview — use directly as an `<img src>`. */
export function previewUrl(): string {
  return `${API_BASE}/api/preview.mjpg`;
}

/** Real, scannable QR for the DONE screen / printed stub — same landing page. */
export function qrUrl(serial: string): string {
  return `${API_BASE}/api/qr/${serial}.png`;
}
