"use client";

import { useEffect, useState } from "react";
import Masthead from "@/app/components/Masthead";
import ReceiptStrip, { PASS_HEIGHT, PASS_WIDTH } from "@/app/components/ReceiptStrip";
import MagazineCover from "@/app/components/MagazineCover";
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
          <div className="flex flex-1 flex-col items-center px-[80px] pt-[66px] text-center">
            <p className="kicker anim-fade-up">BOARDING COMPLETE · {scent.code}</p>
            <h2 className="anim-fade-up delay-1 mt-[20px] font-display text-[88px] font-semibold leading-[.9] tracking-[-.025em]">
              Your pass is <span className="italic">ready.</span>
            </h2>
            {sub && (
              <p className="jp-sub anim-fade-up delay-1 mt-[14px] text-[20px] text-silver-dim">
                発券が完了しました
              </p>
            )}

            <div className="anim-fade-up delay-2 mt-[40px]">
              <div className="mx-auto h-[12px] w-[420px] rounded-t-[4px] bg-ink" />
              <div className="relative mx-auto h-[581px] w-[360px] overflow-hidden shadow-[0_30px_60px_-34px_rgba(0,0,0,.72)]">
                <div
                  className="origin-top-left"
                  style={{
                    width: PASS_WIDTH,
                    height: PASS_HEIGHT,
                    marginLeft: 78,
                    transform: "scale(.33)",
                  }}
                >
                  <ReceiptStrip
                    frames={frames}
                    scent={scent}
                    serial={serial}
                    date={issuedDate}
                    time={issuedTime}
                  />
                </div>
              </div>
            </div>

            <div className="anim-fade-up delay-3 mt-[34px] flex flex-col items-center">
              <p className="font-mono text-[17px] uppercase tracking-[.3em]">COLLECT YOUR PASS BELOW</p>
              {sub && <p className="jp-sub mt-[9px] text-[16px] text-silver-dim">下からお受け取りください</p>}
              <span className="mt-[16px] h-[28px] w-px bg-[color:var(--color-line)]" />
              <svg className="mt-[8px] text-silver-dim" width="15" height="9" viewBox="0 0 15 9" fill="none" aria-hidden="true">
                <path d="M1 1L7.5 7.5L14 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
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

        <div className="flex flex-1 flex-col items-center justify-center px-[80px] text-center">
          <p className="kicker anim-fade-up">
            {scent.mood.en} — {scent.name} · {scent.code}
          </p>

          <h2 className="anim-fade-up delay-1 mt-[24px] font-display font-semibold leading-[0.86] tracking-[-0.02em]">
            <span className="block text-[88px]">Your film</span>
            <span className="block text-[88px] italic">is ready.</span>
          </h2>
          {sub && (
            <p className="jp-sub anim-fade-up delay-1 mt-[14px] text-[19px] text-silver-dim">
              フィルムの準備ができました
            </p>
          )}

          {/* The artefact — same paper, same photos, same serial — is the
              hero of this screen; it follows the title directly rather than
              sitting beneath a block of copy. */}
          <div className="anim-fade-up delay-2 mt-[34px] flex flex-col items-center">
            <div className="h-[10px] w-[380px] rounded-t-[4px] bg-ink" />
            <div className="h-[614px] w-[307px] overflow-hidden shadow-[0_28px_54px_-34px_rgba(0,0,0,.48)]">
              <div className="origin-top-left scale-[.48]">
                <MagazineCover {...filmProps} />
              </div>
            </div>
          </div>

          {/* Quiet collection cue — draws the eye down, toward the printed
              piece still resting in the slot beneath the screen. */}
          <div
            aria-hidden="true"
            className="anim-fade-up delay-3 mt-[26px] flex flex-col items-center gap-[10px] text-silver-dim"
          >
            <span className="h-[26px] w-px bg-[color:var(--color-line)]" />
            <svg width="15" height="9" viewBox="0 0 15 9" fill="none">
              <path
                d="M1 1L7.5 7.5L14 1"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <p className="anim-fade-up delay-4 mt-[20px] max-w-[620px] text-[20px] font-light leading-[1.5] text-ink-soft">
            {t.done.body}
          </p>
          {sub && (
            <p className="jp-sub anim-fade-up delay-4 mt-[8px] text-[16px] text-silver-dim">
              {sub.done.body}
            </p>
          )}

          <p className="anim-fade-up delay-5 mt-[18px] font-display text-[26px] italic text-ink">
            {t.done.closing}
          </p>
          {sub && (
            <p className="jp-sub anim-fade-up delay-5 mt-[8px] text-[17px] text-silver-dim">
              {sub.done.closing}
            </p>
          )}
        </div>

        <div className="anim-fade-up delay-6 px-[80px] pb-[86px]">
          <div className="relative h-px overflow-hidden bg-[color:var(--color-line-soft)]">
            <div
              className="absolute inset-y-0 left-0 bg-[color:var(--color-ink)] transition-[width] duration-1000 ease-linear"
              style={{ width: `${returnPct}%` }}
            />
          </div>
          <div className="mt-[28px] flex items-center justify-between font-mono text-[18px] uppercase tracking-[0.3em]">
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
