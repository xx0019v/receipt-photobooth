"use client";

import { useEffect, useState } from "react";
import Masthead from "@/app/components/Masthead";
import BoardingPass, { BOARDING_W, BOARDING_H, BOARDING_SCREEN_W, PASS_SLOT_W } from "@/app/components/BoardingPass";
import MagazineCover from "@/app/components/MagazineCover";

const PASS_DONE_H = Math.round((BOARDING_H * BOARDING_SCREEN_W) / BOARDING_W);

import { type Scent } from "@/app/lib/edition";
import { type FilmArtifactProps } from "@/app/lib/film";
import { useLang } from "@/app/lib/i18n";
import { usePrintStyle } from "@/app/lib/printStyle";

const AUTO_RETURN = 12_000;

export default function DoneScreen({
  frames,
  scent,
  serial,
  issuedDate,
  issuedTime,
  filmProps,
  onReset,
}: {
  frames: number[];
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

  if (!isCover) {
    return (
      <button
        onClick={onReset}
        aria-label={t.done.next}
        className="absolute inset-0 h-full w-full text-left"
        style={{ cursor: "pointer" }}
      >
        <div className="flex h-full flex-col">
          <Masthead />
          <div className="flex flex-1 flex-col px-[80px] pt-[66px]">
            <div className="text-center">
              <p className="kicker anim-fade-up">BOARDING COMPLETE · {scent.code}</p>
              <h2 className="anim-fade-up delay-1 mt-[20px] font-display text-[88px] font-semibold leading-[.9] tracking-[-.025em]">
                Your pass is <span className="italic">ready.</span>
              </h2>
              {sub && (
                <p className="jp-sub anim-fade-up delay-1 mt-[14px] text-[20px] text-silver-dim">
                  発券が完了しました
                </p>
              )}
            </div>

            {/* the finished ticket, resting in the right-edge printer slot */}
            <div className="anim-fade-up delay-2 relative mt-[50px] flex-1">
              <div
                className="absolute right-[-80px] top-1/2 -translate-y-1/2"
                style={{ width: BOARDING_SCREEN_W + PASS_SLOT_W - 28, height: PASS_DONE_H + 44 }}
              >
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 overflow-hidden rounded-l-[2px] border border-[color:var(--color-line)] bg-paper-bright shadow-[-18px_0_44px_-30px_rgba(0,0,0,.5)]"
                  style={{ width: BOARDING_SCREEN_W, height: PASS_DONE_H }}
                >
                  <div
                    style={{
                      width: BOARDING_W,
                      height: BOARDING_H,
                      transform: `scale(${BOARDING_SCREEN_W / BOARDING_W})`,
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
                </div>
                <div
                  className="absolute right-0 top-1/2 z-[10] -translate-y-1/2 rounded-[8px] bg-ink shadow-[0_20px_40px_-26px_rgba(0,0,0,0.5)]"
                  style={{ width: PASS_SLOT_W, height: PASS_DONE_H + 44 }}
                >
                  <div className="absolute left-1/2 top-1/2 h-[calc(100%-26px)] w-[9px] -translate-x-1/2 -translate-y-1/2 rounded-[3px] bg-[#050505] shadow-[inset_0_0_6px_rgba(0,0,0,0.9)]" />
                </div>
              </div>

              {/* collection direction as a full instruction rail, not a
                  footnote — the guest's next physical action is the second
                  hero of this screen */}
              <div className="anim-fade-up delay-3 absolute bottom-[340px] left-0 right-0 flex min-h-[88px] items-center justify-between border-t border-[color:var(--color-ink)] pt-[20px]">
                <span className="flex flex-col gap-[4px]">
                  <span className="font-mono text-[26px] uppercase tracking-[.32em]">Collect from the right</span>
                  {sub && <span className="jp-sub text-[17px] text-silver-dim">右側からお受け取りください</span>}
                </span>
                <svg className="text-ink" width="46" height="30" viewBox="0 0 16 12" fill="none" aria-hidden="true">
                  <path d="M1 6H14M9 1l5 5-5 5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>

          <div className="anim-fade-up delay-4 px-[80px] pb-[86px]">
            <div className="relative h-px overflow-hidden bg-[color:var(--color-line-soft)]">
              <div className="absolute inset-y-0 left-0 bg-ink transition-[width] duration-1000 ease-linear" style={{ width: `${returnPct}%` }} />
            </div>
            <div className="mt-[26px] flex items-center justify-between font-mono text-[16px] uppercase tracking-[.25em]">
              <span className="text-silver-dim">{t.done.next}</span>
              <span className="tabular-nums">{t.done.countdown(left)}</span>
            </div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onReset}
      aria-label={t.done.next}
      className="absolute inset-0 h-full w-full text-left"
      style={{ cursor: "pointer" }}
    >
      <div className="flex h-full flex-col">
        <Masthead />

        <div className="flex flex-1 flex-col items-center px-[80px] pt-[32px] text-center">
          <p className="kicker anim-fade-up">
            {scent.mood.en} — {scent.name} · {scent.code}
          </p>

          <h2 className="anim-fade-up delay-1 mt-[12px] font-display text-[72px] font-semibold leading-[0.92] tracking-[-0.02em]">
            Your film <span className="italic">is ready.</span>
          </h2>
          {sub && (
            <p className="jp-sub anim-fade-up delay-1 mt-[8px] text-[18px] text-silver-dim">
              フィルムの準備ができました
            </p>
          )}

          {/* The artefact — same paper, same photos, same serial — is the
              hero of this screen; it follows the title directly rather than
              sitting beneath a block of copy. */}
          <div className="anim-fade-up delay-2 mt-[22px] flex flex-col items-center">
            <div className="h-[10px] w-[620px] rounded-t-[4px] bg-ink" />
            <div className="h-[1088px] w-[544px] overflow-hidden shadow-[0_28px_54px_-34px_rgba(0,0,0,.48)]">
              <div className="origin-top-left scale-[.85]">
                <MagazineCover {...filmProps} />
              </div>
            </div>
          </div>

          <div className="anim-fade-up delay-3 mt-[20px] flex min-h-[88px] w-full items-center justify-between border-t border-[color:var(--color-ink)] pt-[16px] text-left">
            <span className="flex flex-col gap-[4px]">
              <span className="font-mono text-[23px] uppercase tracking-[.3em]">Collect below</span>
              {sub && <span className="jp-sub text-[16px] text-silver-dim">下の受取口からお受け取りください</span>}
            </span>
            <svg className="text-ink" width="38" height="24" viewBox="0 0 15 9" fill="none" aria-hidden="true">
              <path d="M1 1L7.5 7.5L14 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div className="anim-fade-up delay-4 px-[80px] pb-[48px]">
          <div className="relative h-px overflow-hidden bg-[color:var(--color-line-soft)]">
            <div
              className="absolute inset-y-0 left-0 bg-[color:var(--color-ink)] transition-[width] duration-1000 ease-linear"
              style={{ width: `${returnPct}%` }}
            />
          </div>
          <div className="mt-[20px] flex items-center justify-between font-mono text-[16px] uppercase tracking-[0.28em]">
            <span className="text-silver-dim">
              {t.done.next}
              {sub && (
                <span className="jp-sub ml-[14px] normal-case text-[15px]">
                  {sub.done.next}
                </span>
              )}
            </span>
            <span className="tabular-nums text-ink-soft">{t.done.countdown(left)}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
