"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BoardingPass, { BOARDING_W, BOARDING_H, BOARDING_SCREEN_W, PASS_SLOT_W } from "@/app/components/BoardingPass";
import MagazineCover from "@/app/components/MagazineCover";
import IssueCore, { type IssueCoreState } from "@/app/components/motion/IssueCore";
import Portrait from "@/app/components/Portrait";
import { editionForScent, type Scent } from "@/app/lib/edition";
import { type FilmArtifactProps } from "@/app/lib/film";
import { useLang } from "@/app/lib/i18n";
import { usePrintStyle } from "@/app/lib/printStyle";
import { type ErrorKind } from "@/app/lib/errors";

const COVER_DURATION = 3900;
const PASS_DURATION = 4100;
const REDUCED_MOTION_DURATION = 120;

// Proof Lock + ISSUE CORE ritual timings (ms). Full-motion vs reduced-motion
// pairs — reduced motion shortens each step, it never skips a state.
const PROOF_LOCK_MS = { full: 620, reduced: 220 };
const CALIBRATE_MS = { full: 300, reduced: 140 };
const REGISTER_MS = { full: 360, reduced: 140 };
const RELEASE_MS = { full: 260, reduced: 140 };

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

// Printing state machine — one-directional, shared by PASS and FILM.
// review -> proofLock -> preparing -> registered -> issuing -> completing -> ready
type Stage =
  | "review"
  | "proofLock"
  | "preparing"
  | "registered"
  | "issuing"
  | "completing"
  | "ready";

const ISSUE_CORE_STATE: Partial<Record<Stage, IssueCoreState>> = {
  preparing: "calibrate",
  registered: "register",
  issuing: "issue",
  completing: "release",
};

export default function PrintingScreen({
  frames,
  scent,
  serial,
  issuedDate,
  issuedTime,
  filmProps,
  onRetake,
  onClaim,
  onPrintError,
  simulateFailure = null,
}: {
  frames: number[];
  scent: Scent;
  serial: string;
  issuedDate: string;
  issuedTime: string;
  filmProps: FilmArtifactProps;
  onRetake: () => void;
  onClaim: () => void;
  onPrintError?: (kind: ErrorKind) => void;
  /** Staff Mode / QA only — forces the issuing phase to fail partway through. */
  simulateFailure?: ErrorKind | null;
}) {
  const { t, sub } = useLang();
  const { style } = usePrintStyle();
  const [stage, setStage] = useState<Stage>("review");
  const [pct, setPct] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const isCover = style === "cover";
  const printStarted = stage !== "review" && stage !== "proofLock";
  const done = stage === "ready";
  const duration = reducedMotion
    ? REDUCED_MOTION_DURATION
    : isCover
      ? COVER_DURATION
      : PASS_DURATION;
  const ms = reducedMotion ? "reduced" : "full";
  // PASS is now a horizontal boarding ticket, shown wide on screen.
  const passWinW = BOARDING_SCREEN_W;
  const passScale = passWinW / BOARDING_W;
  const coverScale = 1200 / 1280;
  const slitW = isCover ? 680 : passWinW + 40;
  const winW = isCover ? 600 : passWinW;
  const winH = isCover ? 1200 : Math.round(BOARDING_H * passScale);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(media.matches);
    updatePreference();
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);
  useEffect(() => clearTimers, [clearTimers]);

  // Proof Lock -> Preparing -> Registered handoff. Two-tap-proof: once
  // stage leaves "review" the print button no longer exists, so a second
  // tap cannot start a second job.
  const startPrintRitual = useCallback(() => {
    if (stage !== "review") return;
    setStage("proofLock");
    const t1 = setTimeout(() => setStage("preparing"), PROOF_LOCK_MS[ms]);
    timers.current.push(t1);
  }, [stage, ms]);

  useEffect(() => {
    if (stage === "preparing") {
      const t1 = setTimeout(() => setStage("registered"), CALIBRATE_MS[ms]);
      timers.current.push(t1);
      return () => clearTimeout(t1);
    }
    if (stage === "registered") {
      const t1 = setTimeout(() => {
        setPct(0);
        setStage("issuing");
      }, REGISTER_MS[ms]);
      timers.current.push(t1);
      return () => clearTimeout(t1);
    }
    if (stage === "completing") {
      const t1 = setTimeout(() => setStage("ready"), RELEASE_MS[ms]);
      timers.current.push(t1);
      return () => clearTimeout(t1);
    }
  }, [stage, ms]);

  // ISSUING — paper feed progress, synced 1:1 with ISSUE CORE's phase.
  // The fail trigger (Staff Mode / QA only) is scheduled on its own timer
  // rather than decided inside the rAF tick: browsers throttle or suspend
  // requestAnimationFrame for a backgrounded/inactive tab, and a
  // correctness-critical event like "the print failed" must not depend on
  // paint frames actually being delivered. rAF here only drives the visual
  // feed animation.
  useEffect(() => {
    if (stage !== "issuing") return;

    const start = performance.now();
    let raf = 0;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      setPct(1);
      setStage("completing");
    };
    const fail = () => {
      if (finished) return;
      finished = true;
      onPrintError?.(simulateFailure ?? "print-failed");
    };
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setPct(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else finish();
    };
    raf = requestAnimationFrame(tick);
    const guard = setTimeout(finish, duration + 700);
    const failTimer = simulateFailure
      ? setTimeout(fail, duration * (0.35 + Math.random() * 0.2))
      : null;
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(guard);
      if (failTimer) clearTimeout(failTimer);
    };
  }, [duration, stage, simulateFailure, onPrintError]);

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

  const issueCoreState = ISSUE_CORE_STATE[stage];
  // FILM's slit sits at the top; PASS's slot sits at the right edge — the
  // core stays anchored to whichever printer mouth is physically in frame,
  // never overlapping paper, photos, QR, or stub.
  // Instrument scale (190–270px band): the core reads as the machine's
  // registration organ above the printer mouth, not a corner loader. PASS:
  // centred over the right-edge slot, clear of the paper path. FILM: centred
  // over the top slit.
  const issueCore = issueCoreState && (
    <div
      className={isCover ? "absolute left-1/2 top-[4px] z-[30] -translate-x-1/2" : "absolute right-[16px] top-[calc(50%-470px)] z-[30]"}
    >
      <IssueCore state={issueCoreState} progress={pct} size={isCover ? 200 : 240} />
    </div>
  );

  return (
    <div className="relative flex h-full flex-col">
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
      {/* compact header — the artefact below is the hero, so the title sets
          on one line and gives its vertical space back to the paper */}
      <div className="px-[80px] pt-[42px]">
        <p className="kicker">{kicker}</p>
        <h2 className="mt-[12px] font-display text-[72px] font-semibold leading-[0.9] tracking-[-0.02em]">
          {title[0]} <span className="italic">{title[1]}</span>
        </h2>
        {subLine && (
          <p className="jp-sub mt-[8px] text-[19px] text-silver-dim">{subLine}</p>
        )}
      </div>

      {!printStarted ? (
        /* PROOF — the composed artefact is deliberately NOT shown yet. Before
           the guest commits, they confirm WHAT is being issued (their three
           frames, in order, and the serial that will carry them) — not how it
           is laid out. The edition itself is revealed as it is printed, so the
           design arrives as the machine issues it rather than as a preview. */
        <SealedProof
          frames={frames}
          serial={serial}
          issuedDate={issuedDate}
          issuedTime={issuedTime}
          formatName={isCover ? "Photo Film" : "Boarding Pass"}
          formatSize={isCover ? "640 × 1280" : "620 × 2100"}
          edition={editionForScent(scent)}
          locking={stage === "proofLock"}
          sub={sub}
        />
      ) : isCover ? (
        /* FILM — feeds from a top slit, top-down reveal (unchanged) */
        <div className="relative flex flex-1 flex-col items-center justify-start px-[40px] pt-[230px]">
          {issueCore}
          <div className="relative z-[20]" style={{ width: slitW }}>
            <div className="h-[22px] w-full rounded-t-[6px] bg-ink" />
            <div className="h-[9px] w-full bg-ink-soft shadow-[inset_0_-6px_10px_rgba(0,0,0,0.6)]" />
          </div>
          <div className="relative overflow-hidden rounded-[2px] border border-[color:var(--color-line)] bg-paper-bright" style={{ width: winW, height: winH }}>
            <div
              className={done ? "anim-quiet-confirm" : !printStarted ? "anim-fade-up" : "print-tremor"}
              style={{
                clipPath: printStarted ? `inset(0 0 ${(1 - ease) * 100}% 0)` : undefined,
                filter: printStarted
                  ? `drop-shadow(0 ${16 * ease}px ${30 * ease}px rgba(0,0,0,${0.2 * ease}))`
                  : "drop-shadow(0 20px 44px rgba(0,0,0,0.16))",
              }}
            >
              <div
                style={{
                  width: 640,
                  height: 1280,
                  transform: `scale(${coverScale})`,
                  transformOrigin: "top left",
                }}
              >
                <MagazineCover {...filmProps} />
              </div>
            </div>
            {!printStarted && !done && (
              <div className="pointer-events-none absolute inset-0 border border-[color:var(--color-line)] opacity-70" />
            )}
            {stage === "issuing" && (
              <>
                <div className="printing-scan pointer-events-none absolute inset-x-0 top-0 h-px bg-ink/35" />
                <div className="print-noise pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-multiply" />
              </>
            )}
          </div>
        </div>
      ) : (
        /* PASS printing / done — a vertical printer slot at the screen's right
           edge; the ticket feeds out of it toward the left. */
        <div className="relative flex-1">
          {issueCore}
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2"
            style={{ width: winW + PASS_SLOT_W - 28, height: winH + 44 }}
          >
            {/* the ticket window, sitting to the left of the slot */}
            <div
              className={`absolute left-0 top-1/2 -translate-y-1/2 overflow-hidden rounded-l-[2px] border border-[color:var(--color-line)] bg-paper-bright ${done ? "anim-quiet-confirm" : "print-tremor"}`}
              style={{
                width: winW,
                height: winH,
                clipPath: reducedMotion ? undefined : `inset(0 0 0 ${(1 - ease) * 100}%)`,
                filter: `drop-shadow(-14px 0 30px rgba(0,0,0,${0.16 * ease}))`,
              }}
            >
              <div style={{ width: BOARDING_W, height: BOARDING_H, transform: `scale(${passScale})`, transformOrigin: "top left" }}>
                <BoardingPass frames={frames} scent={scent} serial={serial} date={issuedDate} time={issuedTime} />
              </div>
              {!done && (
                <div className="print-noise pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-multiply" />
              )}
            </div>
            {/* right-edge printer slot — quiet, machined, minimal */}
            <div
              className="absolute right-0 top-1/2 z-[10] -translate-y-1/2 rounded-[8px] bg-ink shadow-[0_20px_40px_-26px_rgba(0,0,0,0.5)]"
              style={{ width: PASS_SLOT_W, height: winH + 44 }}
            >
              <div className="absolute left-1/2 top-1/2 h-[calc(100%-26px)] w-[9px] -translate-x-1/2 -translate-y-1/2 rounded-[3px] bg-[#050505] shadow-[inset_0_0_6px_rgba(0,0,0,0.9)]" />
            </div>
          </div>
        </div>
      )}

      <div className="px-[80px] pb-[80px] pt-[10px]">
        {stage === "review" ? (
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
              onClick={startPrintRitual}
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
        ) : stage === "proofLock" ? (
          <div className="anim-fade-up flex min-h-[90px] flex-col items-center justify-center gap-[6px] border border-[color:var(--color-ink)] px-[24px] py-[20px]">
            <span className="font-mono text-[18px] uppercase tracking-[0.32em]">
              {edition_label(serial)} · {issuedDate} {issuedTime}
            </span>
            <span className="font-mono text-[13px] uppercase tracking-[0.4em] text-silver-dim">
              READY TO ISSUE
            </span>
          </div>
        ) : stage !== "ready" ? (
          <>
            <div className="flex items-center justify-between font-mono text-[18px] uppercase tracking-[0.3em] text-silver-dim">
              <span>
                {scent.mood.en} · {isCover ? "printing film" : t.print.progress}
              </span>
              <span className="text-ink-soft">
                {stage === "preparing" || stage === "registered" ? "Registering" : feedStage(pct)}
              </span>
            </div>
            <div className="mt-[16px] h-px w-full bg-[color:var(--color-line-soft)]">
              <div
                className="h-full bg-[color:var(--color-line)]"
                style={{
                  width: `${stage === "issuing" ? pct * 100 : stage === "completing" ? 100 : 0}%`,
                  transition: "width 80ms linear",
                }}
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

function edition_label(serial: string) {
  return `SERIAL ${serial}`;
}

/**
 * SEALED PROOF — the pre-print confirmation. Shows what will be issued (the
 * three chosen frames, in print order, and the serial that carries them)
 * without revealing the composed artefact. The layout stays sealed until the
 * guest presses the issue control.
 */
function SealedProof({
  frames,
  serial,
  issuedDate,
  issuedTime,
  formatName,
  formatSize,
  edition,
  locking,
  sub,
}: {
  frames: number[];
  serial: string;
  issuedDate: string;
  issuedTime: string;
  formatName: string;
  formatSize: string;
  edition: { no: string; code: string };
  locking: boolean;
  sub: unknown;
}) {
  return (
    <div className="relative flex flex-1 items-center justify-center px-[70px]">
      <div
        className={`relative w-full border bg-paper-bright px-[64px] py-[58px] ${
          locking ? "border-[color:var(--color-ink)]" : "border-[color:var(--color-line)]"
        }`}
      >
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[15px] uppercase tracking-[0.32em] text-silver-dim">
            {locking ? "Registering" : "Ready to issue"}
          </span>
          <span className="font-mono text-[15px] uppercase tracking-[0.26em] text-silver-dim">
            {formatName} · {formatSize}
          </span>
        </div>

        {/* the three chosen frames, in print order — content, not layout */}
        <div className="mt-[42px] flex gap-[26px]">
          {[0, 1, 2].map((i) => {
            const id = frames[i];
            return (
              <div key={i} className="flex-1">
                <div className="relative aspect-square overflow-hidden border border-[color:var(--color-line)] bg-paper-bright">
                  {id !== undefined && <Portrait seed={id} />}
                  <ProofLockMark className="left-[8px] top-[8px]" />
                  <ProofLockMark className="bottom-[8px] right-[8px] rotate-180" />
                </div>
                <span className="mt-[12px] block font-mono text-[13px] uppercase tracking-[0.26em] text-silver-dim">
                  Print {String(i + 1).padStart(2, "0")}
                </span>
              </div>
            );
          })}
        </div>

        {/* the machine ledger */}
        <dl className="mt-[52px] grid grid-cols-[auto_1fr_auto_1fr] gap-x-[26px] gap-y-[14px] border-t border-[color:var(--color-line)] pt-[30px] font-mono text-[16px] uppercase tracking-[0.22em]">
          <dt className="text-silver-dim">Serial</dt>
          <dd className="tabular-nums">{serial}</dd>
          <dt className="text-silver-dim">Edition</dt>
          <dd>
            {edition.no} · {edition.code}
          </dd>
          <dt className="text-silver-dim">Issue</dt>
          <dd className="tabular-nums">
            {issuedDate} {issuedTime}
          </dd>
          <dt className="text-silver-dim">Frames</dt>
          <dd className="tabular-nums">{frames.length} / 3</dd>
        </dl>

        <p className="mt-[34px] font-display text-[26px] italic text-ink-soft">
          The edition is composed as it is issued.
        </p>
        {sub ? (
          <p className="jp-sub mt-[8px] text-[16px] text-silver-dim">
            仕上がりは発行と同時に印字されます
          </p>
        ) : null}

        {locking && (
          <>
            <ProofLockMark className="left-[18px] top-[18px]" />
            <ProofLockMark className="right-[18px] top-[18px] rotate-90" />
            <ProofLockMark className="bottom-[18px] right-[18px] rotate-180" />
            <ProofLockMark className="bottom-[18px] left-[18px] -rotate-90" />
          </>
        )}
      </div>
    </div>
  );
}

function ProofLockMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`proof-lock-mark pointer-events-none absolute h-[28px] w-[28px] border-l-2 border-t-2 border-[color:var(--color-ink)] ${className}`}
      aria-hidden="true"
    />
  );
}
