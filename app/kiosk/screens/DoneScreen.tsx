"use client";

import { useEffect, useState } from "react";
import Masthead from "@/app/components/Masthead";
import Qr from "@/app/components/Qr";
import { loc, type Scent } from "@/app/lib/edition";
import { useLang } from "@/app/lib/i18n";

const AUTO_RETURN = 12_000;

export default function DoneScreen({
  scent,
  serial,
  onReset,
}: {
  scent: Scent;
  serial: string;
  onReset: () => void;
}) {
  const { t, lang } = useLang();
  const [left, setLeft] = useState(Math.round(AUTO_RETURN / 1000));

  useEffect(() => {
    const to = setTimeout(onReset, AUTO_RETURN);
    const iv = setInterval(() => setLeft((n) => Math.max(0, n - 1)), 1000);
    return () => {
      clearTimeout(to);
      clearInterval(iv);
    };
  }, [onReset]);

  return (
    <button
      onClick={onReset}
      className="absolute inset-0 h-full w-full text-left"
      style={{ cursor: "pointer" }}
    >
      <div className="flex h-full flex-col">
        <Masthead />

        <div className="flex flex-1 flex-col items-center justify-center px-[80px] text-center">
          <p className="kicker anim-fade-up">
            {loc(scent.mood, lang)} — {scent.name} · {scent.code}
          </p>

          <h2 className="anim-fade-up delay-1 mt-[28px] font-display font-semibold leading-[0.86] tracking-[-0.02em]">
            <span className="block text-[110px]">{t.done.title[0]}</span>
            <span className={`block text-[110px] ${lang === "en" ? "italic" : ""}`}>
              {t.done.title[1]}
            </span>
          </h2>

          <p className="anim-fade-up delay-2 mt-[38px] max-w-[720px] text-[28px] leading-[1.42] text-ink-soft">
            {t.done.body}
          </p>

          <div className="anim-fade-up delay-3 mt-[60px] flex flex-col items-center">
            <div className="anim-ambient border border-[color:var(--color-ink)] p-[22px]">
              <Qr seed={hashSeed(serial)} />
            </div>
            <p className="mt-[20px] font-mono text-[18px] uppercase tracking-[0.3em] text-silver-dim">
              {serial}
            </p>
          </div>

          <p className="anim-fade-up delay-4 mt-[44px] font-display text-[30px] italic text-ink">
            {t.done.closing}
          </p>
        </div>

        <div className="px-[80px] pb-[86px]">
          <div className="rule-hair" />
          <div className="mt-[28px] flex items-center justify-between font-mono text-[18px] uppercase tracking-[0.3em]">
            <span className="text-silver-dim">{t.done.next}</span>
            <span>{t.done.countdown(left)}</span>
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
