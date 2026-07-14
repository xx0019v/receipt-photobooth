"use client";

import { useEffect, useState } from "react";
import BoardingPass, { BOARDING_W, BOARDING_H } from "@/app/components/BoardingPass";
import MagazineCover from "@/app/components/MagazineCover";
import { type Scent } from "@/app/lib/edition";
import { type FilmArtifactProps } from "@/app/lib/film";
import { useLang } from "@/app/lib/i18n";
import { usePrintStyle } from "@/app/lib/printStyle";

const COVER_DURATION = 3900;
const PASS_DURATION = 4100;
const REDUCED_MOTION_DURATION = 120;

// Stepper-motor feed curve: progress (0-1) -> eject fraction (0-1).
// Mirrors the `receiptOut` keyframe in globals.css — brief catches (holds)
// between eased pulls, so the paper reads as mechanically fed rather than
// gliding out in one continuous motion. Each pulse is still eased (never
// linear/jerky), and the final pulls shorten so the artefact settles calmly.
const FEED_STOPS: [progress: number, eject: number][] = [
  [0, 0],
  [0.18, 0.17],
  [0.2, 0.17],
  [0.4, 0.42],
  [0.42, 0.42],
  [0.64, 0.7],
  [0.66, 0.7],
  [0.86, 0.96],
  [1, 1],
];

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

// Quiet cadence label — mirrors the physical feed (no numeric readout, no
// progress-bar percentage; just the ritual's three phases).
function feedStage(p: number) {
  if (p < 0.2) return "Quiet start";
  if (p < 0.86) return "Steady feed";
  return "Slow stop";
}

function mechanicalFeed(progress: number) {
  const p = Math.min(1, Math.max(0, progress));
  for (let i = 0; i < FEED_STOPS.length - 1; i++) {
    const [t0, e0] = FEED_STOPS[i];
    const [t1, e1] = FEED_STOPS[i + 1];
    if (p > t1 && i < FEED_STOPS.length - 2) continue;
    if (t1 === t0) return e0;
    const local = (p - t0) / (t1 - t0);
    return e0 + (e1 - e0) * smoothstep(Math.min(1, Math.max(0, local)));
  }
  return 1;
}

export default function PrintingScreen({
  frames,
  scent,
  serial,
  issuedDate,
  issuedTime,
  filmProps,
  onRetake,
  onClaim,
}: {
  frames: number[];
  scent: Scent;
  serial: string;
  issuedDate: string;
  issuedTime: string;
  filmProps: FilmArtifactProps;
  onRetake: () => void;
  onClaim: () => void;
}) {
  const { t, sub } = useLang();
  const { style } = usePrintStyle();
  const [pct, setPct] = useState(0);
  const [done, setDone] = useState(false);
  const [printStarted, setPrintStarted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const isCover = style === "cover";
  const duration = reducedMotion
    ? REDUCED_MOTION_DURATION
    : isCover
      ? COVER_DURATION
      : PASS_DURATION;
  // PASS is now a horizontal boarding ticket, shown wide on screen.
  const passWinW = 940;
  const passScale = passWinW / BOARDING_W;
  const slitW = isCover ? 680 : passWinW + 40;
  const winW = isCover ? 640 : passWinW;
  const winH = isCover ? 1280 : Math.round(BOARDING_H * passScale);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(media.matches);
    updatePreference();
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (!printStarted) return;

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
      const p = Math.min(1, (now - start) / duration);
      setPct(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else finish();
    };
    raf = requestAnimationFrame(tick);
    const guard = setTimeout(finish, duration + 700);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(guard);
    };
  }, [duration, printStarted]);

  const ease = mechanicalFeed(pct);
  const title = isCover
    ? !printStarted
      ? ["Your film", "at a glance."]
      : done
        ? ["Your film", "is ready."]
        : ["Printing your", "film"]
    : !printStarted
      ? t.review.title
      : done
        ? t.done.title
        : t.print.title;
  const kicker = !printStarted ? t.review.step : t.print.step;
  const subLine = isCover && !printStarted
    ? sub ? "印刷前にフォトフィルムを確認してください" : undefined
    : !printStarted
      ? sub?.review.subTail
      : done
        ? sub?.done.body
        : isCover && sub
          ? "フォトフィルムを印刷しています"
          : sub?.print.title;

  return (
    <div className="flex h-full flex-col">
      {/* Scoped, reduced-motion-aware micro paper tremor — a hair of
          mechanical judder while the artefact is actively feeding. Kept
          local to this screen; globals.css is not touched. */}
      <style>{`
        @keyframes printingTremor {
          0%, 100% { transform: translateX(0); }
          22% { transform: translateX(-.5px); }
          48% { transform: translateX(.4px); }
          75% { transform: translateX(-.3px); }
        }
        .print-tremor { animation: printingTremor .16s steps(2) infinite; }
        .printing-scan { animation: scan 1.1s cubic-bezier(0.4,0,0.2,1) infinite; }
        @media (prefers-reduced-motion: reduce) {
          .print-tremor { animation: none !important; }
          .printing-scan { animation: none !important; opacity: 0; }
        }
      `}</style>
      <div className="px-[80px] pt-[64px]">
        <p className="kicker">{kicker}</p>
        <h2 className="mt-[16px] font-display text-[82px] font-semibold leading-[0.9] tracking-[-0.02em]">
          <span className="block">{title[0]}</span>
          <span className="mt-[6px] block italic">{title[1]}</span>
        </h2>
        {subLine && (
          <p className="jp-sub mt-[12px] text-[21px] text-silver-dim">{subLine}</p>
        )}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-[40px]">
        <div className="relative z-[20]" style={{ width: slitW }}>
          <div className="h-[22px] w-full rounded-t-[6px] bg-ink" />
          <div className="h-[9px] w-full bg-ink-soft shadow-[inset_0_-6px_10px_rgba(0,0,0,0.6)]" />
        </div>

        <div className="relative overflow-hidden rounded-[2px] border border-[color:var(--color-line)] bg-paper-bright" style={{ width: winW, height: winH }}>
          <div
            className={
              done
                ? "anim-quiet-confirm"
                : !printStarted
                  ? "anim-fade-up"
                  : "print-tremor"
            }
            style={{
              clipPath:
                printStarted
                  ? `inset(0 0 ${(1 - ease) * 100}% 0)`
                  : undefined,
              filter: printStarted
                ? `drop-shadow(0 ${16 * ease}px ${30 * ease}px rgba(0,0,0,${0.2 * ease}))`
                : "drop-shadow(0 20px 44px rgba(0,0,0,0.16))",
            }}
          >
            {isCover ? (
              <div style={{ width: 640, transformOrigin: "top center" }}>
                <MagazineCover {...filmProps} />
              </div>
            ) : (
              <div
                style={{
                  width: BOARDING_W,
                  height: BOARDING_H,
                  transform: `scale(${passScale})`,
                  transformOrigin: "top left",
                }}
              >
                <BoardingPass
                  frames={frames}
                  scent={scent}
                  serial={serial}
                  date={issuedDate}
                  time={issuedTime}
                />
              </div>
            )}
          </div>

          {!printStarted && !done && (
            <div className="pointer-events-none absolute inset-0 border border-[color:var(--color-line)] opacity-70" />
          )}

          {printStarted && !done && (
            <>
              <div className="printing-scan pointer-events-none absolute inset-x-0 top-0 h-px bg-ink/35" />
              <div className="print-noise pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-multiply" />
            </>
          )}
        </div>
      </div>

      <div className="px-[80px] pb-[80px] pt-[10px]">
        {!printStarted ? (
          <div className="grid grid-cols-[1fr_1.45fr] gap-[24px]">
            <button
              onClick={onRetake}
              className="press flex min-h-[90px] flex-col items-center justify-center gap-[4px] border border-[color:var(--color-ink)] bg-paper-bright px-[24px] py-[24px]"
              style={{ cursor: "pointer" }}
            >
              <span className="font-mono text-[20px] uppercase tracking-[0.3em]">
                {t.review.retake}
              </span>
              {sub && (
                <span className="jp-sub text-[15px] text-silver-dim">{sub.review.retake}</span>
              )}
            </button>
            <button
              onClick={() => {
                setPct(0);
                setDone(false);
                setPrintStarted(true);
              }}
              className="press flex min-h-[90px] items-center justify-center border border-[color:var(--color-ink)] bg-ink px-[24px] py-[24px] text-paper"
              style={{ cursor: "pointer" }}
            >
              <span className="flex flex-col items-center gap-[4px]">
                <span className="font-mono text-[20px] uppercase tracking-[0.3em]">
                  {isCover ? "Print my film" : t.review.print}
                </span>
                {sub && (
                  <span className="jp-sub text-[15px] text-paper/55">{isCover ? "FILMを発券" : sub.review.print}</span>
                )}
              </span>
            </button>
          </div>
        ) : !done ? (
          <>
            <div className="flex items-center justify-between font-mono text-[18px] uppercase tracking-[0.3em] text-silver-dim">
              <span>
                {scent.mood.en} · {isCover ? "printing film" : t.print.progress}
              </span>
              <span className="text-ink-soft">{feedStage(pct)}</span>
            </div>
            <div className="mt-[16px] h-px w-full bg-[color:var(--color-line-soft)]">
              <div
                className="h-full bg-[color:var(--color-line)]"
                style={{ width: `${pct * 100}%`, transition: "width 80ms linear" }}
              />
            </div>
          </>
        ) : (
          <div className="anim-fade-up delay-2 grid grid-cols-[1fr_1.6fr] gap-[24px]">
            <button
              onClick={onRetake}
              className="press flex min-h-[90px] flex-col items-center justify-center gap-[4px] border border-[color:var(--color-ink)] bg-paper-bright px-[24px] py-[24px]"
              style={{ cursor: "pointer" }}
            >
              <span className="font-mono text-[20px] uppercase tracking-[0.3em]">
                {t.review.retake}
              </span>
              {sub && (
                <span className="jp-sub text-[15px] text-silver-dim">{sub.review.retake}</span>
              )}
            </button>
            <button
              onClick={onClaim}
              className="press flex min-h-[90px] items-center justify-center border border-[color:var(--color-ink)] bg-ink px-[24px] py-[24px] text-paper"
              style={{ cursor: "pointer" }}
            >
              <span className="flex flex-col items-center gap-[4px]">
                <span className="font-mono text-[20px] uppercase tracking-[0.3em]">
                  {t.idle.cta}
                </span>
                {sub && (
                  <span className="jp-sub text-[15px] text-paper/55">{sub.idle.cta}</span>
                )}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
