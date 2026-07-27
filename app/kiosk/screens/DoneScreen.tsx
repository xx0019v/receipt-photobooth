"use client";

import { useEffect, useState } from "react";
import BoardingPass, { BOARDING_W, BOARDING_H, BOARDING_SCREEN_W, PASS_SLOT_W } from "@/app/components/BoardingPass";
import MagazineCover from "@/app/components/MagazineCover";

const PASS_DONE_H = Math.round((BOARDING_H * BOARDING_SCREEN_W) / BOARDING_W);

import { type Scent } from "@/app/lib/edition";
import { type FilmArtifactProps } from "@/app/lib/film";
import { useLang } from "@/app/lib/i18n";
import { usePrintStyle } from "@/app/lib/printStyle";

const AUTO_RETURN = 20_000;

/**
 * DONE — the collection moment, composed around the physical hand-off rather
 * than a "success" headline. No Masthead, no centered title, no bottom black
 * CTA rail. The finished artefact bleeds toward its real collection edge
 * (right for PASS, bottom for FILM); the guest's eye is led by an oversized
 * COLLECT anchor and a machine-issued receipt line, not by reassurance copy.
 * The whole stage is the "next guest" control.
 */
export default function DoneScreen({
  frames,
  frameSources,
  scent,
  serial,
  issuedDate,
  issuedTime,
  filmProps,
  onReset,
}: {
  frames: number[];
  frameSources?: Record<number, string>;
  scent: Scent;
  serial: string;
  issuedDate: string;
  issuedTime: string;
  filmProps: FilmArtifactProps;
  onReset: () => void;
}) {
  const { t, sub } = useLang();
  const { style } = usePrintStyle();
  const isCover = style === "cover";
  const totalSeconds = Math.round(AUTO_RETURN / 1000);
  const [left, setLeft] = useState(totalSeconds);

  useEffect(() => {
    const to = setTimeout(onReset, AUTO_RETURN);
    const iv = setInterval(() => setLeft((n) => Math.max(0, n - 1)), 1000);
    return () => {
      clearTimeout(to);
      clearInterval(iv);
    };
  }, [onReset]);

  const returnPct = Math.max(0, Math.min(100, (left / totalSeconds) * 100));

  // Machine receipt data — the same for both formats, set as mono ledger rows.
  const receipt = (
    <dl className="grid grid-cols-[auto_1fr] gap-x-[28px] gap-y-[10px] font-mono text-[16px] uppercase tracking-[0.24em]">
      <dt className="text-silver-dim">Serial</dt>
      <dd className="tabular-nums">{serial}</dd>
      <dt className="text-silver-dim">Edition</dt>
      <dd>{scent.index} · {scent.name}</dd>
      <dt className="text-silver-dim">Issued</dt>
      <dd className="tabular-nums">{issuedDate} · {issuedTime}</dd>
    </dl>
  );

  // Bottom edge: a thin machine status line + auto-return countdown. Not a
  // button — the entire background is the reset target (kiosk convention).
  const statusLine = (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[30]">
      <div className="relative h-[3px] w-full bg-[color:var(--color-line-soft)]">
        <div
          className="absolute inset-0 bg-ink transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            transform: `scaleX(${returnPct / 100})`,
            transformOrigin: "left center",
          }}
        />
      </div>
      <div className="flex items-center justify-between px-[64px] pb-[46px] pt-[22px] font-mono text-[15px] uppercase tracking-[0.3em] text-silver-dim">
        <span>{t.done.next}</span>
        <span className="tabular-nums text-ink">{t.done.countdown(left)}</span>
      </div>
    </div>
  );

  if (!isCover) {
    // PASS — horizontal-band composition. The ticket rests in the right-edge
    // slot; the type stacks in the open upper-left field; COLLECT is the anchor.
    return (
      <button
        type="button"
        onClick={onReset}
        aria-label={t.done.next}
        className="absolute inset-0 h-full w-full overflow-hidden text-left"
        style={{ cursor: "pointer" }}
      >
        {/* running header */}
        <p className="anim-fade-up absolute left-[64px] top-[96px] font-mono text-[15px] uppercase tracking-[0.34em] text-silver-dim">
          The Receipt · Issued · {scent.code}
        </p>

        {/* oversized COLLECT anchor, upper-left, bled */}
        <div className="anim-fade-up delay-1 absolute left-[56px] top-[168px]">
          <h2 className="font-display font-semibold uppercase leading-[0.8] tracking-[-0.04em]" style={{ fontSize: 200 }}>
            Collect
          </h2>
          <div className="mt-[18px] flex items-center gap-[22px]">
            <span className="font-mono text-[24px] uppercase tracking-[0.3em]">From the right</span>
            <svg width="72" height="26" viewBox="0 0 16 12" fill="none" aria-hidden="true">
              <path d="M1 6H14M9 1l5 5-5 5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {sub && <p className="jp-sub mt-[10px] text-[18px] text-silver-dim">右側からお受け取りください</p>}
        </div>

        {/* the finished ticket, resting half-in the right-edge printer slot */}
        <div
          className="anim-fade-up delay-2 absolute right-[-28px] top-[54%]"
          style={{ width: BOARDING_SCREEN_W + PASS_SLOT_W, height: PASS_DONE_H + 44 }}
        >
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 overflow-hidden rounded-l-[2px] border border-[color:var(--color-line)] bg-paper-bright shadow-[-22px_0_50px_-30px_rgba(0,0,0,.5)]"
            style={{ width: BOARDING_SCREEN_W, height: PASS_DONE_H }}
          >
            <div style={{ width: BOARDING_W, height: BOARDING_H, transform: `scale(${BOARDING_SCREEN_W / BOARDING_W})`, transformOrigin: "top left" }}>
              <BoardingPass frames={frames} frameSources={frameSources} scent={scent} serial={serial} date={issuedDate} time={issuedTime} />
            </div>
          </div>
          <div
            className="absolute right-0 top-1/2 z-[10] -translate-y-1/2 rounded-[8px] bg-ink shadow-[0_20px_40px_-26px_rgba(0,0,0,0.5)]"
            style={{ width: PASS_SLOT_W, height: PASS_DONE_H + 44 }}
          >
            <div className="absolute left-1/2 top-1/2 h-[calc(100%-26px)] w-[9px] -translate-x-1/2 -translate-y-1/2 rounded-[3px] bg-[#050505] shadow-[inset_0_0_6px_rgba(0,0,0,0.9)]" />
          </div>
        </div>

        {/* receipt ledger, lower-left, below the ticket band */}
        <div className="anim-fade-up delay-3 absolute bottom-[168px] left-[64px]">{receipt}</div>

        {statusLine}
      </button>
    );
  }

  // FILM — two-column spread. Type ledger on the left; the film stands tall on
  // the right and bleeds off the bottom edge toward the collection slot.
  return (
    <button
      type="button"
      onClick={onReset}
      aria-label={t.done.next}
      className="absolute inset-0 h-full w-full overflow-hidden text-left"
      style={{ cursor: "pointer" }}
    >
      {/* left type column */}
      <div className="absolute bottom-[120px] left-[64px] top-[96px] flex w-[440px] flex-col">
        <p className="anim-fade-up font-mono text-[15px] uppercase tracking-[0.34em] text-silver-dim">
          The Receipt · Issued · {scent.code}
        </p>

        <div className="anim-fade-up delay-1 mt-auto">
          <h2 className="font-display font-semibold uppercase leading-[0.8] tracking-[-0.04em]" style={{ fontSize: 184 }}>
            Collect
          </h2>
          <div className="mt-[16px] flex items-center gap-[20px]">
            <span className="font-mono text-[22px] uppercase tracking-[0.3em]">From below</span>
            <svg width="26" height="64" viewBox="0 0 12 16" fill="none" aria-hidden="true">
              <path d="M6 1V14M1 9l5 5 5-5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {sub && <p className="jp-sub mt-[10px] text-[17px] text-silver-dim">下の受取口からお受け取りください</p>}
          <div className="anim-fade-up delay-3 mt-[48px]">{receipt}</div>
        </div>
      </div>

      {/* the film, standing tall on the right, bleeding off the bottom edge */}
      <div className="anim-fade-up delay-2 absolute right-[70px] top-[150px]">
        <div className="h-[12px] w-[560px] rounded-t-[4px] bg-ink" />
        <div className="h-[1720px] w-[560px] overflow-hidden shadow-[0_-4px_60px_-30px_rgba(0,0,0,.5)]">
          <div className="origin-top-left scale-[.875]">
            <MagazineCover {...filmProps} />
          </div>
        </div>
      </div>

      {statusLine}
    </button>
  );
}
