"use client";

import { useEffect, useState } from "react";
import Masthead from "@/app/components/Masthead";
import Qr from "@/app/components/Qr";
import { CLOSING, type Scent } from "@/app/lib/edition";

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
  const [left, setLeft] = useState(Math.round(AUTO_RETURN / 1000));

  useEffect(() => {
    const t = setTimeout(onReset, AUTO_RETURN);
    const i = setInterval(() => setLeft((n) => Math.max(0, n - 1)), 1000);
    return () => {
      clearTimeout(t);
      clearInterval(i);
    };
  }, [onReset]);

  return (
    <button
      onClick={onReset}
      className="absolute inset-0 h-full w-full text-left"
      style={{ cursor: "none" }}
    >
      <div className="flex h-full flex-col">
        <Masthead />

        <div className="flex flex-1 flex-col items-center justify-center px-[80px] text-center">
          <p className="kicker anim-fade-up">{scent.mood} — {scent.name}</p>

          <h2 className="anim-fade-up delay-1 mt-[28px] font-display font-semibold leading-[0.84] tracking-[-0.02em]">
            <span className="block text-[112px]">Claim your</span>
            <span className="block text-[112px] italic">scent memory.</span>
          </h2>

          <p className="anim-fade-up delay-2 mt-[38px] max-w-[720px] text-[29px] leading-[1.4] text-ink-soft">
            Tear along the dotted line beneath the slot. Scan the code to keep a
            digital copy of this moment.
          </p>

          <div className="anim-fade-up delay-3 mt-[64px] flex flex-col items-center">
            <div className="border border-[color:var(--color-ink)] p-[22px]">
              <Qr seed={hashSeed(serial)} />
            </div>
            <p className="mt-[20px] font-mono text-[18px] uppercase tracking-[0.3em] text-silver-dim">
              {serial}
            </p>
          </div>

          <p className="anim-fade-up delay-4 mt-[46px] font-display text-[30px] italic text-ink">
            {CLOSING}
          </p>
        </div>

        <div className="px-[80px] pb-[86px]">
          <div className="rule-hair" />
          <div className="mt-[28px] flex items-center justify-between font-mono text-[18px] uppercase tracking-[0.3em]">
            <span className="text-silver-dim">Tap anywhere for next guest</span>
            <span>New edition in {left}s</span>
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
