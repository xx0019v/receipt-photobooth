"use client";

import { useEffect, useState } from "react";
import ReceiptStrip from "@/app/components/ReceiptStrip";
import MagazineCover from "@/app/components/MagazineCover";
import { type Scent } from "@/app/lib/edition";
import { useLang } from "@/app/lib/i18n";
import { usePrintStyle } from "@/app/lib/printStyle";

const DURATION = 3400;

export default function PrintingScreen({
  frames,
  scent,
  serial,
  onRetake,
  onClaim,
}: {
  frames: number[];
  scent: Scent;
  serial: string;
  onRetake: () => void;
  onClaim: () => void;
}) {
  const { t, sub } = useLang();
  const { style } = usePrintStyle();
  const [pct, setPct] = useState(0);
  const [done, setDone] = useState(false);

  const isCover = style === "cover";
  const slitW = isCover ? 680 : 1040;
  const winW = isCover ? 640 : 1000;
  const winH = isCover ? 924 : 460;

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      setPct(1);
      setDone(true);
    };
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION);
      setPct(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else finish();
    };
    raf = requestAnimationFrame(tick);
    const guard = setTimeout(finish, DURATION + 700);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(guard);
    };
  }, []);

  const ease = 1 - Math.pow(1 - pct, 3);

  return (
    <div className="flex h-full flex-col">
      <div className="px-[80px] pt-[64px]">
        <p className="kicker">{done ? t.review.step : t.print.step}</p>
        <h2 className="mt-[16px] font-display text-[82px] font-semibold leading-[0.9] tracking-[-0.02em]">
          {done ? (
            <>
              {t.review.title[0]} <span className="italic">{t.review.title[1]}</span>
            </>
          ) : (
            <>
              {t.print.title[0]} <span className="italic">{t.print.title[1]}</span>
            </>
          )}
        </h2>
        {sub && (
          <p className="jp-sub mt-[12px] text-[21px] text-silver-dim">
            {done ? `${scent.mood.en} — ${scent.name}` : sub.print.title}
          </p>
        )}
      </div>

      {/* printer slit + ejecting ticket */}
      <div className="flex flex-1 flex-col items-center justify-center px-[40px]">
        {/* the machine slit */}
        <div className="relative z-[20]" style={{ width: slitW }}>
          <div className="h-[22px] w-full rounded-t-[6px] bg-ink" />
          <div className="h-[9px] w-full bg-ink-soft shadow-[inset_0_-6px_10px_rgba(0,0,0,0.6)]" />
        </div>

        {/* reveal window — the artefact slides down out of the slit */}
        <div
          className="relative overflow-hidden"
          style={{ width: winW, height: winH }}
        >
          <div
            style={{
              transform: `translateY(${(ease - 1) * 100}%)`,
              filter: `drop-shadow(0 ${16 * ease}px ${30 * ease}px rgba(0,0,0,${0.26 * ease}))`,
            }}
          >
            {isCover ? (
              <MagazineCover frames={frames} scent={scent} serial={serial} />
            ) : (
              <ReceiptStrip frames={frames} scent={scent} serial={serial} />
            )}
          </div>

          {!done && (
            <>
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-ink/70"
                style={{ animation: "scan 1s linear infinite" }}
              />
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-multiply"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, #000 0 1px, transparent 1px 3px)",
                }}
              />
            </>
          )}
        </div>
      </div>

      {/* footer: progress while printing, actions once ejected */}
      <div className="px-[80px] pb-[80px] pt-[10px]">
        {!done ? (
          <>
            <div className="flex items-center justify-between font-mono text-[18px] uppercase tracking-[0.3em] text-silver-dim">
              <span>
                {scent.mood.en} · {t.print.progress}
              </span>
              <span>{Math.round(pct * 100)}%</span>
            </div>
            <div className="mt-[16px] h-[3px] w-full bg-[color:var(--color-line)]">
              <div className="h-full bg-ink" style={{ width: `${pct * 100}%` }} />
            </div>
          </>
        ) : (
          <div className="anim-fade-up grid grid-cols-[1fr_1.6fr] gap-[24px]">
            <button
              onClick={onRetake}
              className="press flex flex-col items-center justify-center gap-[5px] border border-[color:var(--color-ink)] py-[36px]"
              style={{ cursor: "pointer" }}
            >
              <span className="font-mono text-[22px] uppercase tracking-[0.3em]">
                {t.review.retake}
              </span>
              {sub && (
                <span className="jp-sub text-[15px] text-silver-dim">{sub.review.retake}</span>
              )}
            </button>
            <button
              onClick={onClaim}
              className="card press flex items-center justify-center gap-[22px] bg-ink py-[36px] text-paper"
              style={{ cursor: "pointer" }}
            >
              <span className="flex flex-col items-center gap-[5px]">
                <span className="font-mono text-[22px] uppercase tracking-[0.3em]">
                  {t.idle.cta}
                </span>
                {sub && (
                  <span className="jp-sub text-[15px] text-paper/55">{sub.idle.cta}</span>
                )}
              </span>
              <span className="font-display text-[38px]">→</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
