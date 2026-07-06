"use client";

import { useEffect, useState } from "react";
import ReceiptStrip from "@/app/components/ReceiptStrip";

const DURATION = 5200;

export default function PrintingScreen({
  frames,
  serial,
  onDone,
}: {
  frames: number[];
  serial: string;
  onDone: () => void;
}) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setPct(1);
      onDone();
    };
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION);
      setPct(p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // Guaranteed advance even if rAF is throttled (e.g. background tab).
    const guard = setTimeout(finish, DURATION + 600);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(guard);
    };
  }, [onDone]);

  return (
    <div className="flex h-full flex-col">
      <div className="px-[80px] pt-[64px]">
        <p className="kicker">Now Printing</p>
        <h2 className="mt-[18px] font-display text-[92px] font-semibold leading-[0.9] tracking-[-0.02em]">
          Hold <span className="italic">still…</span>
        </h2>
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
              opacity: pct < 1 ? 0.9 : 0,
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
          <span>Thermal print</span>
          <span>{Math.round(pct * 100)}%</span>
        </div>
        <div className="mt-[18px] h-[3px] w-full bg-[color:var(--color-line)]">
          <div
            className="h-full bg-ink"
            style={{ width: `${pct * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
