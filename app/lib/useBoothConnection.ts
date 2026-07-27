"use client";

import { useCallback, useState } from "react";
import {
  createSession,
  getHealth,
  isHardwareMode,
  BOOTH_MODE,
  type BoothHealth,
} from "./api";

/**
 * Whether this kiosk is talking to a real booth, and on what terms.
 *
 * The distinction that matters: in `mock` mode a missing backend is fine and
 * the UI simulates a print, but in `hardware` mode it is a hard failure. A Pi
 * that silently falls back to the simulation shows a guest a finished print
 * and hands them nothing — so `hardware` never degrades, it stops.
 */

export type BoothConnection = {
  /** Null when running standalone (no backend, mock mode). */
  sessionId: string | null;
  /** Backend-allocated serial. Null when standalone — the UI generates one. */
  serial: string | null;
  /** Printer head width. Only meaningful with a live backend. */
  printerWidthDots: number | null;
  health: BoothHealth | null;
  /** Set when hardware mode could not reach a working booth. */
  fatal: string | null;
};

const DISCONNECTED: BoothConnection = {
  sessionId: null,
  serial: null,
  printerWidthDots: null,
  health: null,
  fatal: null,
};

export function useBoothConnection() {
  const [connection, setConnection] = useState<BoothConnection>(DISCONNECTED);

  /** Open a booth session. Resolves to the connection actually established. */
  const connect = useCallback(async (): Promise<BoothConnection> => {
    try {
      const health = await getHealth();
      if (isHardwareMode && health.mode !== "hardware") {
        throw new Error(
          `configured for hardware but backend reports ${health.mode} drivers`,
        );
      }
      if (isHardwareMode && !health.camera) {
        throw new Error("camera is not responding");
      }
      if (isHardwareMode && !health.printer) {
        throw new Error(
          health.printer_status?.detail || "printer connection is unavailable",
        );
      }
      const session = await createSession();
      const next: BoothConnection = {
        sessionId: session.sessionId,
        serial: session.serial,
        printerWidthDots: health.artifact.width_dots,
        health,
        fatal: null,
      };
      setConnection(next);
      return next;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (isHardwareMode) {
        // Loud, on the machine, before a guest is promised anything.
        const next = { ...DISCONNECTED, fatal: message };
        setConnection(next);
        return next;
      }
      // Mock mode: a laptop with no backend is the normal case.
      setConnection(DISCONNECTED);
      return DISCONNECTED;
    }
  }, []);

  const disconnect = useCallback(() => setConnection(DISCONNECTED), []);

  return { connection, connect, disconnect, mode: BOOTH_MODE };
}
