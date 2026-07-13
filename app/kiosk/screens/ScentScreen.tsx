"use client";

import { useEffect, useRef, useState } from "react";
import Masthead from "@/app/components/Masthead";
import { SCENTS, type Scent } from "@/app/lib/edition";
import { useLang } from "@/app/lib/i18n";
import { passSecurityAsset } from "@/app/lib/chromeAssets";

export default function ScentScreen({
  onSelect,
}: {
  onSelect: (s: Scent) => void;
}) {
  const { t, sub } = useLang();
  const [picked, setPicked] = useState<string | null>(null);
  const selectionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (selectionTimer.current) clearTimeout(selectionTimer.current);
  }, []);

  const choose = (s: Scent) => {
    if (picked) return;
    setPicked(s.id);
    selectionTimer.current = setTimeout(() => onSelect(s), 420);
  };

  return (
    <div className="flex h-full flex-col">
      <Masthead />

      <div className="px-[80px] pt-[60px]">
        <p className="kicker anim-fade-up">{t.scent.step}</p>
        <h2 className="anim-fade-up delay-1 mt-[22px] font-display text-[92px] font-semibold leading-[0.86] tracking-[-0.025em]">
          {t.scent.title[0]}
          <br />
          <span className="italic">{t.scent.title[1]}</span>
        </h2>
        <p className="anim-fade-up delay-2 mt-[22px] max-w-[850px] text-[23px] leading-[1.5] text-silver-dim">
          {t.scent.sub}
          {sub && <span className="jp-sub mt-[9px] block text-[17px]">{sub.scent.sub}</span>}
        </p>
      </div>

      <div
        className={`flex flex-1 flex-col justify-center gap-[18px] px-[80px] py-[36px] ${
          picked ? "cards-picked" : ""
        }`}
      >
        {SCENTS.map((s, i) => {
          const isSel = picked === s.id;
          const symbol = passSecurityAsset(s.id);
          return (
            <button
              key={s.id}
              onClick={() => choose(s)}
              className={`scent-choice card anim-fade-up delay-${i + 2} relative grid min-h-[154px] grid-cols-[112px_1fr_250px] items-center gap-[30px] border border-[color:var(--color-ink)] px-[38px] py-[26px] text-left ${
                isSel ? "is-selected" : "bg-paper-bright"
              }`}
              style={{ cursor: "pointer" }}
              aria-pressed={isSel}
            >
              <div className="relative flex flex-col items-center justify-center gap-[8px]">
                <img
                  src={symbol.path}
                  width={56}
                  height={56}
                  alt=""
                  aria-hidden="true"
                  className={`h-[62px] w-[62px] object-contain opacity-75 grayscale contrast-125 ${
                    isSel ? "motion-sheen" : ""
                  }`}
                />
                <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-silver-dim">
                  {t.scent.securityMark} {s.index}
                </span>
              </div>
              <div className="relative z-[1] flex-1">
                <div className="flex items-baseline justify-between gap-[12px]">
                  <h3 className="font-display text-[44px] font-semibold uppercase leading-[0.92] tracking-[-0.015em]">
                    {s.name}
                  </h3>
                  <span className="font-mono text-[16px] uppercase tracking-[0.24em] text-silver-dim">
                    {s.code}
                  </span>
                </div>
                <p className="mt-[11px] font-mono text-[12px] uppercase tracking-[0.18em] text-silver-dim">
                  {s.notes.map((n) => n.en).join("  ·  ")}
                </p>
                <p className="mt-[7px] font-display text-[20px] italic leading-none">
                  {s.mood.en}{sub ? ` / ${s.mood.jp}` : ""}
                </p>
              </div>
              <div className="relative z-[1] flex min-h-[92px] flex-col justify-center border-l border-[color:var(--color-line)] pl-[28px]">
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-silver-dim">
                  {t.scent.destination}
                </span>
                <span className="mt-[7px] font-display text-[32px] font-semibold uppercase leading-[.9] tracking-[-.02em]">
                  {s.destination.en}
                </span>
                {sub && <span className="jp-sub mt-[6px] text-[12px] text-silver-dim">{s.destination.jp}</span>}
                <span
                  key={isSel ? "sel" : "arrow"}
                  className="absolute bottom-[2px] right-0 font-display text-[24px] leading-none"
                  style={isSel ? { animation: "wordIn 0.35s ease both" } : undefined}
                >
                  {isSel ? "✓" : "→"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
