/**
 * Booth backend client (FastAPI on the Pi, `backend/`).
 *
 * Every call degrades gracefully: if the backend is unreachable the kiosk
 * falls back to the original mock visuals, so the UI can always be demoed
 * standalone (`npm run dev` with no backend).
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_BOOTH_API ?? "http://127.0.0.1:8000";

export type BoothSession = { sessionId: string; serial: string };

/** A captured frame: `url` is null when running without a backend. */
export type Frame = { seed: number; url: string | null };

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

/** Fast probe used at session start to decide live vs. mock mode. */
export async function backendAvailable(): Promise<boolean> {
  try {
    const h = await req<{ status: string }>("/api/health", undefined, 1500);
    return h.status === "ok";
  } catch {
    return false;
  }
}

export async function createSession(): Promise<BoothSession> {
  const body = await req<{ session_id: string; serial: string }>(
    "/api/sessions",
    { method: "POST" },
  );
  return { sessionId: body.session_id, serial: body.serial };
}

export async function captureFrame(
  sessionId: string,
  seed: number,
): Promise<Frame> {
  const body = await req<{ frame_id: string; url: string }>(
    `/api/sessions/${sessionId}/capture`,
    { method: "POST" },
    6000,
  );
  return { seed, url: `${API_BASE}${body.url}` };
}

export async function startPrint(sessionId: string): Promise<string> {
  const body = await req<{ job_id: string }>(
    `/api/sessions/${sessionId}/print`,
    { method: "POST" },
  );
  return body.job_id;
}

export function getPrintJob(jobId: string): Promise<PrintJob> {
  return req<PrintJob>(`/api/print-jobs/${jobId}`);
}

/** MJPEG live preview — use directly as an `<img src>`. */
export function previewUrl(): string {
  return `${API_BASE}/api/preview.mjpg`;
}
