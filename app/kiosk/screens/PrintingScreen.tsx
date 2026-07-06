"use client";

import { useEffect, useRef, useState } from "react";
import ReceiptStrip from "@/app/components/ReceiptStrip";
import {
  BoothSession,
  Frame,
  getPrintJob,
  startPrint,
} from "@/app/lib/api";

/** Mock print duration when no backend is connected. */
const MOCK_DURATION = 5200;
const POLL_MS = 400;
/** How long the error notice stays up before returning to the flow. */
const ERROR_DWELL = 6000;

export default function PrintingScreen({
  frames,
  serial,
  session,
  onDone,
}: {
  frames: Frame[];
  serial: string;
  session: BoothSession | null;
  onDone: () => void;
}) {
  const [pct, setPct] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const doneRef = useRef(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setPct(1);
    onDone();
  };

  // Real print: submit the job, then track actual printer progress.
  useEffect(() => {
    if (!session) return;
    let stopped = false;
    let poll: ReturnType<typeof setInterval> | null = null;

    const fail = (message: string) => {
      if (stopped) return;
      setError(message);
      setTimeout(finish, ERROR_DWELL);
    };

    (async () => {
      try {
        const jobId = await startPrint(session.sessionId);
        poll = setInterval(async () => {
          if (stopped) return;
          try {
            const job = await getPrintJob(jobId);
            if (job.state === "queued") setPct(0.02);
            else if (job.state === "rendering") setPct(0.06);
            else if (job.state === "printing")
              setPct(0.08 + job.progress * 0.92);
            else if (job.state === "done") {
              if (poll) clearInterval(poll);
              finish();
            } else if (job.state === "error") {
              if (poll) clearInterval(poll);
              fail(job.message || "printer error");
            }
          } catch {
            /* transient poll failure — keep trying */
          }
        }, POLL_MS);
      } catch {
        fail("print request failed");
      }
    })();

    return () => {
      stopped = true;
      if (poll) clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Mock print: the original fixed-duration animation.
  useEffect(() => {
    if (session) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / MOCK_DURATION);
      setPct(p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // Guaranteed advance even if rAF is throttled (e.g. background tab).
    const guard = setTimeout(finish, MOCK_DURATION + 600);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(guard);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  return (
    <div className="flex h-full flex-col">
      <div className="px-[80px] pt-[64px]">
        <p className="kicker">Now Printing</p>
        <h2 className="mt-[18px] font-display text-[92px] font-semibold leading-[0.9] tracking-[-0.02em]">
          {error ? (
            <>
              Paper <span className="italic">trouble.</span>
            </>
          ) : (
            <>
              Hold <span className="italic">still…</span>
            </>
          )}
        </h2>
        {error && (
          <p className="mt-[16px] text-[26px] text-ink-soft">
            The printer needs attention — please ask the staff.
          </p>
        )}
      </div>

      {/* printer slot + emerging receipt */}
      <div className="relative flex flex-1 flex-col items-center px-[80px] pt-[40px]">
        {/* the printer head / slot */}
        <div className="relative z-[20] w-[560px]">
          <div className="h-[26px] w-full rounded-t-[6px] bg-ink" />
          <div className="h-[10px] w-full bg-ink-soft shadow-[inset_0_-6px_10px_rgba(0,0,0,0.6)]" />
          {/* moving print head glow */}
          <div
            className="absolute left-0 top-[26px] h-[3px] bg-paper/80"
            style={{
              width: "100%",
              opacity: pct < 1 && !error ? 0.9 : 0,
              transform: `translateY(${2 + (pct % 0.12) * 20}px)`,
            }}
          />
        </div>

        {/* receipt reveal window */}
        <div className="relative w-[470px] overflow-hidden" style={{ height: 1180 }}>
          <div
            style={{
              transform: `translateY(${(pct - 1) * 100}%)`,
              transition: "transform 40ms linear",
            }}
          >
            <ReceiptStrip frames={frames} serial={serial} />
          </div>
        </div>
      </div>

      {/* progress */}
      <div className="px-[80px] pb-[86px] pt-[20px]">
        <div className="flex items-center justify-between font-mono text-[18px] uppercase tracking-[0.3em] text-silver-dim">
          <span>{error ? "Print interrupted" : "Thermal print"}</span>
          <span>{error ? "—" : `${Math.round(pct * 100)}%`}</span>
        </div>
        <div className="mt-[18px] h-[3px] w-full bg-[color:var(--color-line)]">
          <div className="h-full bg-ink" style={{ width: `${pct * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
