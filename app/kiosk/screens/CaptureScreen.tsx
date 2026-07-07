"use client";

import { useEffect, useState } from "react";
import Portrait from "@/app/components/Portrait";
import type { Scent } from "@/app/lib/edition";

export default function CaptureScreen({
  total,
  scent,
  onComplete,
}: {
  total: number;
  scent: Scent;
  onComplete: (frames: number[]) => void;
}) {
  const [shot, setShot] = useState(0);
  const [count, setCount] = useState(3);
  const [flash, setFlash] = useState(false);
  const [frames, setFrames] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

    (async () => {
      const captured: number[] = [];
      for (let s = 0; s < total; s++) {
        if (cancelled) return;
        setShot(s);
        for (let c = 3; c >= 1; c--) {
          setCount(c);
          await wait(950);
          if (cancelled) return;
        }
        setCount(0);
        setFlash(true);
        await wait(130);
        captured.push(s + 1);
        setFrames([...captured]);
        await wait(230);
        setFlash(false);
        await wait(populated(s, total) ? 720 : 0);
      }
      if (cancelled) return;
      await wait(420);
      onComplete(captured);
    })();

    return () => {
      cancelled = true;
    };
  }, [total, onComplete]);

  return (
    <div className="flex h-full flex-col">
      {/* status bar */}
      <div className="flex items-center justify-between px-[80px] pt-[64px]">
        <div className="flex items-center gap-[16px]">
          <span
            className="h-[16px] w-[16px] rounded-full bg-ink"
            style={{ animation: "blink 1s step-end infinite" }}
          />
          <span className="font-mono text-[20px] uppercase tracking-[0.4em]">
            Recording · {scent.mood}
          </span>
        </div>
        <span className="font-mono text-[20px] uppercase tracking-[0.4em] text-silver-dim">
          Frame {String(shot + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </div>

      <div className="rule-hair mx-[80px] mt-[22px]" />

      {/* camera viewport */}
      <div className="flex flex-1 items-center justify-center px-[80px]">
        <div className="relative h-[1040px] w-[920px] overflow-hidden bg-ink">
          <Portrait seed={shot} className="opacity-95" />

          {/* crop marks */}
          <Corner className="left-[24px] top-[24px]" />
          <Corner className="right-[24px] top-[24px] rotate-90" />
          <Corner className="bottom-[24px] right-[24px] rotate-180" />
          <Corner className="bottom-[24px] left-[24px] -rotate-90" />

          {/* countdown */}
          {count > 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span
                key={`${shot}-${count}`}
                className="font-display font-semibold text-paper"
                style={{
                  fontSize: 420,
                  lineHeight: 1,
                  animation: "countPop 0.95s ease-out both",
                  textShadow: "0 20px 80px rgba(0,0,0,0.5)",
                }}
              >
                {count}
              </span>
            </div>
          )}

          {count === 0 && !flash && (
            <div className="pointer-events-none absolute inset-x-0 bottom-[40px] text-center">
              <span className="anim-fade-in font-mono text-[24px] uppercase tracking-[0.5em] text-paper">
                Hold
              </span>
            </div>
          )}
        </div>
      </div>

      {/* thumbnails */}
      <div className="px-[80px] pb-[80px] pt-[40px]">
        <div className="grid grid-cols-3 gap-[24px]">
          {Array.from({ length: total }).map((_, i) => {
            const done = frames.includes(i + 1);
            return (
              <div
                key={i}
                className="relative aspect-[3/4] overflow-hidden border border-[color:var(--color-ink)]"
              >
                {done ? (
                  <Portrait seed={i} />
                ) : (
                  <div className="flex h-full items-center justify-center bg-paper-bright">
                    <span className="font-display text-[80px] italic text-silver">
                      {i + 1}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* flash overlay */}
      {flash && (
        <div
          className="pointer-events-none absolute inset-0 z-[70] bg-white"
          style={{ animation: "flash 0.5s ease-out both" }}
        />
      )}
    </div>
  );
}

function Corner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`pointer-events-none absolute h-[40px] w-[40px] border-l-2 border-t-2 border-paper ${className}`}
    />
  );
}

/** True except on the very last shot, so we don't pause after the final frame. */
function populated(s: number, total: number) {
  return s < total - 1;
}
