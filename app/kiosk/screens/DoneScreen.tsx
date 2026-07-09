"use client";

import { useEffect, useState } from "react";
import Masthead from "@/app/components/Masthead";
import Qr from "@/app/components/Qr";
import { type Scent } from "@/app/lib/edition";
import { type Quote } from "@/app/lib/quotes";
import { useLang } from "@/app/lib/i18n";
import { usePrintStyle } from "@/app/lib/printStyle";

const AUTO_RETURN = 12_000;

export default function DoneScreen({
  scent,
  serial,
  quote,
  onReset,
}: {
  scent: Scent;
  serial: string;
  quote: Quote;
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

          <h2 className="anim-fade-up delay-1 mt-[32px] font-display font-semibold leading-[0.86] tracking-[-0.02em]">
            <span className="block text-[112px]">{t.done.title[0]}</span>
            <span className="block text-[112px] italic">{t.done.title[1]}</span>
          </h2>
          {sub && (
            <p className="jp-sub anim-fade-up delay-1 mt-[20px] text-[24px] text-silver-dim">
              {sub.done.title[0]}
              {sub.done.title[1]}
            </p>
          )}

          <p className="anim-fade-up delay-2 mt-[46px] max-w-[660px] text-[27px] font-light leading-[1.52] text-ink-soft">
            {t.done.body}
          </p>
          {sub && (
            <p className="jp-sub anim-fade-up delay-2 mt-[14px] text-[20px] text-silver-dim">
              {sub.done.body}
            </p>
          )}

          {/* Quiet collection cue — draws the eye down, toward the printed
              piece still resting in the slot beneath the screen. Decorative
              only; the instruction itself lives in t.done.body above. */}
          <div
            aria-hidden="true"
            className="anim-fade-up delay-3 mt-[40px] flex flex-col items-center gap-[10px] text-silver-dim"
          >
            <span className="h-[30px] w-px bg-[color:var(--color-line)]" />
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

          <div className="anim-fade-up delay-4 mt-[30px] flex flex-col items-center">
            <div className="anim-ambient border border-[color:var(--color-ink)] p-[22px]">
              <Qr seed={hashSeed(serial)} />
            </div>
            <p className="mt-[20px] font-mono text-[18px] uppercase tracking-[0.3em] text-silver-dim">
              {serial}
            </p>
          </div>

          {isCover && (
            <p className="anim-fade-up delay-5 mt-[44px] font-display text-[40px] italic leading-tight text-ink">
              “{quote.text}”
            </p>
          )}

          <p className="anim-fade-up delay-5 mt-[24px] font-display text-[30px] italic text-ink">
            {t.done.closing}
          </p>
          {sub && (
            <p className="jp-sub anim-fade-up delay-5 mt-[10px] text-[19px] text-silver-dim">
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

function hashSeed(s: string): number {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0x7fffffff;
  return h || 7;
}
