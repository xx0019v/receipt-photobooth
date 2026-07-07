"use client";

import { useEffect, useState } from "react";
import Masthead from "@/app/components/Masthead";
import { editionDate } from "@/app/lib/edition";
import { useLang } from "@/app/lib/i18n";

export default function IdleScreen({ onStart }: { onStart: () => void }) {
  const { t } = useLang();
  const cycle = t.idle.cycle;
  const [word, setWord] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setWord((w) => (w + 1) % cycle.length), 2600);
    return () => clearInterval(id);
  }, [cycle.length]);

  return (
    <button
      onClick={onStart}
      className="absolute inset-0 h-full w-full text-left"
      style={{ cursor: "pointer" }}
    >
      <div className="flex h-full flex-col">
        <Masthead variant="cover" />

        <div className="flex flex-1 flex-col justify-center px-[80px]">
          <p className="kicker anim-fade-up">{t.idle.tagline}</p>

          <h1 className="anim-fade-up delay-1 mt-[34px] font-display font-semibold leading-[0.82] tracking-[-0.02em]">
            <span className="block text-[168px]">THE</span>
            <span className="block text-[168px] italic">Receipt</span>
          </h1>

          <div className="anim-fade-up delay-2 mt-[52px] flex items-center gap-[28px]">
            <span className="rule w-[120px]" />
            <p className="font-display text-[34px] italic leading-[1.3] text-ink-soft">
              <span
                key={`${word}-${t.idle.cycleTail}`}
                className="block"
                style={{ animation: "wordIn 0.7s ease both" }}
              >
                {cycle[word]}
              </span>
              {t.idle.cycleTail}
            </p>
          </div>

          <div className="anim-fade-up delay-3 mt-[58px] grid grid-cols-3 gap-[2px] font-mono text-[15px] uppercase tracking-[0.18em] text-silver-dim">
            <span>{t.idle.steps[0]}</span>
            <span className="text-center">{t.idle.steps[1]}</span>
            <span className="text-right">{t.idle.steps[2]}</span>
          </div>
        </div>

        {/* Marquee band */}
        <div className="overflow-hidden border-y border-[color:var(--color-ink)] py-[26px]">
          <div className="marquee-track">
            {[...t.idle.marquee, ...t.idle.marquee, ...t.idle.marquee, ...t.idle.marquee].map(
              (w, i) => (
                <span key={i} className="mx-[38px] font-display text-[52px] italic">
                  {w}
                  <span className="mx-[38px] not-italic text-silver">✦</span>
                </span>
              ),
            )}
          </div>
        </div>

        {/* Call to action */}
        <div className="px-[80px] pb-[86px] pt-[70px]">
          <div className="anim-breathe flex items-center justify-center gap-[24px] border border-[color:var(--color-ink)] py-[42px]">
            <span className="h-[16px] w-[16px] rounded-full bg-ink" />
            <span className="font-mono text-[28px] uppercase tracking-[0.4em]">
              {t.idle.cta}
            </span>
          </div>
          <div className="mt-[30px] flex justify-between font-mono text-[13px] uppercase tracking-[0.28em] text-silver-dim">
            <span>{t.idle.location}</span>
            <span>{editionDate()}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
