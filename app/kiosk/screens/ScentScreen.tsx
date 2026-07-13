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
        <p className="anim-fade-up delay-2 mt-[22px] text-[25px] leading-[1.4] text-silver-dim">
          {t.scent.sub}
          {sub && <span className="jp-sub ml-[16px] text-[19px]">{sub.scent.sub}</span>}
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
              className={`card anim-fade-up delay-${i + 2} relative flex items-center gap-[36px] border border-[color:var(--color-ink)] px-[44px] py-[34px] text-left ${
                isSel ? "is-selected" : "bg-paper-bright"
              }`}
              style={{ cursor: "pointer" }}
              aria-pressed={isSel}
            >
              <div className="relative flex h-[88px] w-[88px] shrink-0 items-center justify-center border border-[color:var(--color-line)] bg-paper-bright/70">
                <img
                  src={symbol.path}
                  width={56}
                  height={56}
                  alt=""
                  aria-hidden="true"
                  className={`h-[56px] w-[56px] object-contain opacity-80 grayscale contrast-125 ${
                    isSel ? "motion-sheen" : ""
                  }`}
                />
              </div>
              <div className="relative z-[1] flex-1">
                <div className="flex items-baseline justify-between gap-[12px]">
                  <h3 className="font-display text-[48px] leading-[0.92]">
                    {s.mood.en}
                  </h3>
                  <span className="font-mono text-[16px] uppercase tracking-[0.24em] text-silver-dim">
                    {s.index}
                  </span>
                </div>
                <p className="mt-[10px] font-mono text-[15px] uppercase tracking-[0.22em] text-silver-dim">
                  {s.notes.map((n) => n.en).join("  ·  ")}
                </p>
                <p className="mt-[8px] font-display text-[22px] italic leading-none">
                  {s.name}
                </p>
              </div>
              <div className="relative z-[1] flex flex-col items-end gap-[10px]">
                {sub && <span className="jp-sub text-[13px] text-silver-dim">{sub.scent.sub}</span>}
                <span
                  key={isSel ? "sel" : "arrow"}
                  className="font-display text-[30px] leading-none"
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
