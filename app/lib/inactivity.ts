"use client";

import { useEffect, useRef, useState } from "react";

const WARNING_BEFORE_MS = 15_000;

/**
 * Single shared inactivity manager. `active` gates whether the timer runs at
 * all (Printing and error recovery pass `false` — a print in flight or a
 * guest mid-recovery must never be auto-reset). Any touch on the stage
 * should call `poke()` to push the timeout back out.
 */
export function useInactivity(active: boolean, timeoutMs: number, onTimeout: () => void) {
  const [warning, setWarning] = useState(false);
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = () => {
    if (warnTimer.current) clearTimeout(warnTimer.current);
    if (endTimer.current) clearTimeout(endTimer.current);
    warnTimer.current = null;
    endTimer.current = null;
  };

  const arm = () => {
    clear();
    setWarning(false);
    if (!active) return;
    const warnAt = Math.max(0, timeoutMs - WARNING_BEFORE_MS);
    warnTimer.current = setTimeout(() => setWarning(true), warnAt);
    endTimer.current = setTimeout(onTimeout, timeoutMs);
  };

  useEffect(() => {
    arm();
    return clear;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, timeoutMs]);

  const poke = () => arm();

  return { warning, poke };
}
