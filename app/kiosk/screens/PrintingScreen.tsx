"use client";

import { useEffect, useState } from "react";
import ReceiptStrip from "@/app/components/ReceiptStrip";
import type { Scent } from "@/app/lib/edition";

const DURATION = 5200;

export default function PrintingScreen({
  frames,
  scent,
  serial,
  onDone,
}: {
  frames: number[];
  scent: Scent;
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
    const guard = setTimeout(finish, DURATION + 600);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(guard);
    };
  }, [onDone]);

  return (
    <div className="flex h-full flex-col">
      <div className="px-[80px] pt-[64px]">
        <p className="kicker">Step V — The Print</p>
        <h2 className="mt-[18px] font-display text-[92px] font-semibold leading-[0.9] tracking-[-0.02em]">
          Fixing the <span className="italic">memory…</span>
        </h2>
      </div>

      {/* printer slot + emerging receipt */}
      <div className="relative flex flex-1 flex-col items-center px-[80px] pt-[40px]">
        <div className="relative z-[20] w-[560px]">
          <div className="h-[26px] w-full rounded-t-[6px] bg-ink" />
          <div className="h-[10px] w-full bg-ink-soft shadow-[inset_0_-6px_10px_rgba(0,0,0,0.6)]" />
        </div>

        <div
          className="relative w-[470px] overflow-hidden"
          style={{ height: 1180 }}
        >
          <div
            style={{
              transform: `translateY(${(pct - 1) * 100}%)`,
              transition: "transform 40ms linear",
            }}
          >
            <ReceiptStrip frames={frames} scent={scent} serial={serial} />
          </div>

          {/* thermal scan line + fine noise while printing */}
          {pct < 1 && (
            <>
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-ink/70"
                style={{ animation: "scan 1.1s linear infinite" }}
              />
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-multiply"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, #000 0 1px, transparent 1px 3px)",
                }}
              />
            </>
          )}
        </div>
      </div>

      {/* progress */}
      <div className="px-[80px] pb-[86px] pt-[20px]">
        <div className="flex items-center justify-between font-mono text-[18px] uppercase tracking-[0.3em] text-silver-dim">
          <span>{scent.mood} · thermal print</span>
          <span>{Math.round(pct * 100)}%</span>
        </div>
        <div className="mt-[18px] h-[3px] w-full bg-[color:var(--color-line)]">
          <div className="h-full bg-ink" style={{ width: `${pct * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
