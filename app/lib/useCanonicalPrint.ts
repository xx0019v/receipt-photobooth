"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  assertHardwareReachable,
  getPrintJob,
  isHardwareMode,
  printArtifact,
  type ArtifactPrintAck,
} from "./api";
import { type PrintArtifactSpec } from "./printArtifact";
import { rasterizeSpec, type RasterResult } from "./printRaster";

/**
 * Drives one real print: rasterise the mounted artefact, upload it, follow the
 * job to done or error.
 *
 * The ritual on screen is not the source of truth here — the printer is. The
 * progress this returns comes from the backend's own banded raster callback,
 * so the paper on screen moves because paper is moving in the machine.
 *
 * A retry after a printer error re-sends the IDENTICAL bytes: same spec, same
 * raster, same hash, same idempotency key. The guest approved one edition, and
 * a second attempt must not quietly become a different one.
 */

export type CanonicalPrintPhase =
  | "idle"
  | "rasterising"
  | "uploading"
  | "printing"
  | "done"
  | "error";

export type CanonicalPrintState = {
  phase: CanonicalPrintPhase;
  /** 0..1 from the backend once printing; 0 before that. */
  progress: number;
  error: string | null;
  ack: ArtifactPrintAck | null;
  /** Kept for the Staff Mode inspector — never shown to a guest. */
  raster: RasterResult | null;
};

const IDLE: CanonicalPrintState = {
  phase: "idle",
  progress: 0,
  error: null,
  ack: null,
  raster: null,
};

export function useCanonicalPrint(session: {
  sessionId: string;
  spec: PrintArtifactSpec;
  printerWidthDots: number;
  retryRequested?: boolean;
} | null) {
  const [state, setState] = useState<CanonicalPrintState>(IDLE);
  const jobId = useRef<string | null>(null);
  // Cached raster + key so a retry cannot produce a different artefact.
  const cachedRaster = useRef<RasterResult | null>(null);
  const idempotencyKey = useRef<string | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const start = useCallback(
    async () => {
      if (!session) return;
      const { sessionId, spec, printerWidthDots, retryRequested = false } = session;

      jobId.current = null;
      setState({ ...IDLE, raster: cachedRaster.current, phase: "rasterising" });

      try {
        // In hardware mode, find out NOW that there is no printer — before the
        // guest watches a four-second ritual that ends in nothing.
        if (isHardwareMode) await assertHardwareReachable();

        const raster =
          cachedRaster.current ?? (await rasterizeSpec(spec, printerWidthDots));
        cachedRaster.current = raster;
        idempotencyKey.current ??= `${spec.serial}:${raster.sha256.slice(0, 16)}`;
        if (!alive.current) return;

        setState((s) => ({ ...s, phase: "uploading", raster }));
        const ack = await printArtifact(
          sessionId,
          raster.blob,
          spec,
          raster.sha256,
          idempotencyKey.current,
          retryRequested,
        );
        if (!alive.current) return;

        jobId.current = ack.jobId;
        setState((s) => ({ ...s, phase: "printing", ack, raster }));
      } catch (err) {
        if (!alive.current) return;
        setState((s) => ({
          ...s,
          phase: "error",
          error: err instanceof Error ? err.message : String(err),
        }));
      }
    },
    [session],
  );

  // Follow the job. Polling rather than a socket: one kiosk, one printer, and
  // a poll survives the backend restarting under it.
  useEffect(() => {
    if (state.phase !== "printing" || !jobId.current) return;
    const id = jobId.current;
    let cancelled = false;

    const poll = async () => {
      try {
        const job = await getPrintJob(id);
        if (cancelled || !alive.current) return;
        if (job.state === "done") {
          setState((s) => ({ ...s, phase: "done", progress: 1 }));
          return;
        }
        if (job.state === "error") {
          setState((s) => ({
            ...s,
            phase: "error",
            error: job.message || "print failed",
          }));
          return;
        }
        setState((s) => ({ ...s, progress: job.progress }));
      } catch {
        // A dropped poll is not a failed print — the paper is still moving.
        // Keep polling; a genuinely dead backend surfaces via the job timeout
        // in the caller rather than by one refused request.
      }
      if (!cancelled) timer = setTimeout(poll, 250);
    };

    let timer = setTimeout(poll, 120);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [state.phase]);

  /** Retry the SAME artefact after a printer error (paper jam, out of paper).
   *  cachedRaster is deliberately kept: identical bytes, identical hash. */
  const retry = useCallback(() => start(), [start]);

  /** New edition — drop the cached artefact so the next one is rebuilt. */
  const reset = useCallback(() => {
    cachedRaster.current = null;
    idempotencyKey.current = null;
    jobId.current = null;
    setState(IDLE);
  }, []);

  return { ...state, start, retry, reset };
}
