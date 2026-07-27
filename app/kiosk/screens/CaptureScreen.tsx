"use client";

import { useEffect, useState } from "react";
import Portrait from "@/app/components/Portrait";
import { type Scent } from "@/app/lib/edition";
import { useLang } from "@/app/lib/i18n";
import { useChromeArtwork } from "@/app/lib/chromeArtwork";

/**
 * Capture — the quietest page in the magazine. Camera frame, Shot n/3, one
 * short instruction, the scent's mark held small in the margin. The
 * countdown does not simply swap numerals: it reads as though the numeral is
 * printed on the reverse of the paper and is showing through — soft, then
 * focused, gone. Capture is a single white flash and a one-shot silver
 * reflection; the strip below settles into a contact sheet, not an app grid.
 */
export default function CaptureScreen({
  total,
  scent,
  onComplete,
}: {
  total: number;
  scent: Scent;
  onComplete: (frames: number[]) => void;
}) {
  const { t, sub } = useLang();
  const [shot, setShot] = useState(0);
  const [count, setCount] = useState(3);
  const [flash, setFlash] = useState(false);
  const [frames, setFrames] = useState<number[]>([]);
  const seal = useChromeArtwork();

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
    <div className="relative flex h-full flex-col overflow-hidden">
      <style>{`
        @keyframes paperShow {
          0%   { opacity: 0;    filter: blur(18px); transform: scale(0.92); clip-path: inset(38% 0 38% 0); }
          38%  { opacity: 0.5;  filter: blur(7px);  transform: scale(0.97); clip-path: inset(14% 0 14% 0); }
          62%  { opacity: 1;    filter: blur(0);     transform: scale(1);    clip-path: inset(0 0 0 0); }
          100% { opacity: 1;    filter: blur(0);     transform: scale(1);    clip-path: inset(0 0 0 0); }
        }
        @keyframes silverPass {
          0%   { transform: translateX(-140%) skewX(-14deg); opacity: 0; }
          40%  { opacity: 0.5; }
          100% { transform: translateX(140%) skewX(-14deg); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .capture-numeral { animation: none !important; opacity: 1 !important; filter: none !important; transform: none !important; clip-path: none !important; }
          .capture-sweep { animation: none !important; opacity: 0 !important; }
        }
      `}</style>

      {/* status bar — the frame count IS the headline: an oversized
          typographic counter, not a quiet label */}
      <div className="flex items-end justify-between px-[80px] pt-[34px]">
        <div className="flex items-baseline gap-[20px]">
          <span
            className="mb-[14px] h-[12px] w-[12px] rounded-full bg-ink"
            style={{ animation: "blink 1s step-end infinite" }}
            aria-hidden="true"
          />
          <span className="font-display text-[96px] font-semibold leading-[0.8] tracking-[-0.03em]">
            {String(shot + 1).padStart(2, "0")}
          </span>
          <span className="font-display text-[40px] italic text-silver-dim">/ {String(total).padStart(2, "0")}</span>
          {sub && (
            <span className="jp-sub mb-[8px] text-[15px] text-silver-dim">
              {sub.capture.frameLabel(
                String(shot + 1).padStart(2, "0"),
                String(total).padStart(2, "0"),
              )}
            </span>
          )}
        </div>

        <div className="mb-[10px] flex items-center gap-[14px]">
          <span className="kicker">{scent.mood.en}</span>
          <img
            src={seal.path}
            alt=""
            aria-hidden="true"
            className="h-[26px] w-[26px] object-contain opacity-40 grayscale"
          />
        </div>
      </div>

      <div className="rule-hair mx-[80px] mt-[16px]" />

      {/* camera viewport — the dominant surface of the screen */}
      <div className="flex flex-1 items-center justify-center px-[70px]">
        <div className="relative h-[1020px] w-[940px] overflow-hidden bg-ink">
          <Portrait seed={shot} className="opacity-95" />

          {/* rule-of-thirds grid — camera, not decoration */}
          <div className="pointer-events-none absolute inset-0">
            <span className="absolute left-1/3 top-0 h-full w-px bg-paper/10" />
            <span className="absolute left-2/3 top-0 h-full w-px bg-paper/10" />
            <span className="absolute left-0 top-1/3 h-px w-full bg-paper/10" />
            <span className="absolute left-0 top-2/3 h-px w-full bg-paper/10" />
          </div>

          {/* crop marks */}
          <Corner className="left-[24px] top-[24px]" />
          <Corner className="right-[24px] top-[24px] rotate-90" />
          <Corner className="bottom-[24px] right-[24px] rotate-180" />
          <Corner className="bottom-[24px] left-[24px] -rotate-90" />

          {/* countdown — reads as if printed through the paper */}
          {count > 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span
                key={`${shot}-${count}`}
                className="capture-numeral font-display font-semibold text-paper"
                style={{
                  fontSize: 440,
                  lineHeight: 1,
                  animation: "paperShow 0.95s cubic-bezier(0.16,1,0.3,1) both",
                  mixBlendMode: "screen",
                }}
              >
                {count}
              </span>
            </div>
          )}

          {/* one short instruction, held after the count settles */}
          {count === 0 && !flash && (
            <div className="pointer-events-none absolute inset-x-0 bottom-[40px] text-center">
              <span className="anim-fade-in flex flex-col items-center gap-[8px]">
                <span className="font-mono text-[22px] uppercase tracking-[0.5em] text-paper">
                  {t.capture.hold}
                </span>
                {sub && (
                  <span className="jp-sub text-[16px] text-paper/70">
                    {sub.capture.hold}
                  </span>
                )}
              </span>
            </div>
          )}

          {/* one-shot silver reflection at the capture instant */}
          {flash && (
            <div
              className="capture-sweep pointer-events-none absolute inset-0 z-[65]"
              style={{
                background:
                  "linear-gradient(100deg, transparent 40%, rgba(255,255,255,0.65) 50%, transparent 60%)",
                animation: "silverPass 0.6s ease-out both",
              }}
              aria-hidden="true"
            />
          )}
        </div>
      </div>

      {/* contact strip — one thin film row of 6, never competing with the
          camera; each registered frame locks in with its crop marks */}
      <div className="px-[80px] pb-[64px] pt-[26px]">
        <div className="flex items-center justify-between border-b border-[color:var(--color-ink)] pb-[8px] font-mono text-[12px] uppercase tracking-[0.32em] text-silver-dim">
          <span>Contact</span>
          <span>{scent.code}</span>
        </div>
        <div className="mt-[14px] flex gap-[14px]">
          {Array.from({ length: total }).map((_, i) => {
            const done = frames.includes(i + 1);
            return (
              <div key={i} className="flex-1">
                <div
                  className={`relative aspect-square overflow-hidden bg-paper-bright ${
                    done ? "anim-quiet-confirm" : ""
                  }`}
                >
                  {done ? (
                    <>
                      <Portrait seed={i} />
                      <RegMark className="left-[5px] top-[5px]" />
                      <RegMark className="bottom-[5px] right-[5px] rotate-180" />
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center border border-dashed border-[color:var(--color-line)]">
                      <span className="font-display text-[40px] italic text-silver/50">{i + 1}</span>
                    </div>
                  )}
                </div>
                <span className="mt-[6px] block text-center font-mono text-[10px] tracking-[0.2em] text-silver-dim">
                  {String(i + 1).padStart(2, "0")} · {done ? "REG" : "OPEN"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* flash */}
      {flash && (
        <div
          className="pointer-events-none absolute inset-0 z-[70] bg-white"
          style={{ animation: "flash 0.5s ease-out both" }}
          aria-hidden="true"
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

/** Small registration crop-mark shown on a locked contact-sheet frame. */
function RegMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`proof-lock-mark pointer-events-none absolute h-[12px] w-[12px] border-l border-t border-[color:var(--color-ink)] ${className}`}
      aria-hidden="true"
    />
  );
}

/** True except on the very last shot, so we don't pause after the final frame. */
function populated(s: number, total: number) {
  return s < total - 1;
}
