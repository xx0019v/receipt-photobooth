"use client";

import { useEffect, useRef, useState } from "react";
import Masthead from "@/app/components/Masthead";
import { SCENTS, type Scent } from "@/app/lib/edition";
import { useLang } from "@/app/lib/i18n";
import { passSecurityAsset } from "@/app/lib/chromeAssets";

/**
 * Scent — an editorial index (a magazine contents page), not four equal cards.
 * Big serif names down a ruled column; the chosen line gains weight, air and a
 * quiet chrome seal that surfaces once. Selection is shown by type / space /
 * reflection — never by colour.
 */
export default function ScentScreen({
  onSelect,
}: {
  onSelect: (s: Scent) => void;
}) {
  const { t, sub } = useLang();
  const [picked, setPicked] = useState<string | null>(null);
  const selectionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (selectionTimer.current) clearTimeout(selectionTimer.current);
    },
    [],
  );

  const choose = (s: Scent) => {
    if (picked) return;
    setPicked(s.id);
    selectionTimer.current = setTimeout(() => onSelect(s), 520);
  };

  return (
    <div className="flex h-full flex-col">
      <Masthead />

      <div className="px-[80px] pt-[56px]">
        <p className="kicker anim-fade-up">{t.scent.step}</p>
        <h2 className="anim-fade-up delay-1 mt-[20px] font-display text-[88px] font-semibold leading-[0.86] tracking-[-0.025em]">
          {t.scent.title[0]}
          <br />
          <span className="italic">{t.scent.title[1]}</span>
        </h2>
        {sub && (
          <p className="jp-sub anim-fade-up delay-2 mt-[16px] text-[20px] text-silver-dim">
            {sub.scent.sub}
          </p>
        )}
      </div>

      {/* the index */}
      <div
        className={`flex flex-1 flex-col justify-center px-[80px] py-[30px] ${
          picked ? "cards-picked" : ""
        }`}
      >
        <div className="flex items-center justify-between border-b border-[color:var(--color-ink)] pb-[12px] font-mono text-[13px] uppercase tracking-[0.32em] text-silver-dim">
          <span>The Wardrobe</span>
          <span>{t.scent.destination}</span>
        </div>

        {SCENTS.map((s) => {
          const isSel = picked === s.id;
          const seal = passSecurityAsset(s.id);
          return (
            <button
              key={s.id}
              onClick={() => choose(s)}
              aria-pressed={isSel}
              className={`scent-row group relative grid w-full grid-cols-[104px_1fr_300px] items-center gap-[28px] overflow-hidden border-b border-[color:var(--color-line)] text-left transition-[padding] duration-500 ${
                isSel ? "is-picked py-[40px]" : "py-[30px]"
              }`}
              style={{ cursor: "pointer" }}
            >
              {/* seal — surfaces only on the chosen line, cropped as a watermark */}
              <img
                src={seal.path}
                alt=""
                aria-hidden="true"
                className={`pointer-events-none absolute -right-[30px] top-1/2 h-[260px] w-[260px] -translate-y-1/2 object-contain grayscale transition-opacity duration-700 ${
                  isSel ? "opacity-[0.07]" : "opacity-0"
                }`}
              />

              {/* index */}
              <span className="relative z-[1] font-mono text-[22px] tracking-[0.1em] text-silver-dim">
                {s.index}
              </span>

              {/* name + notes */}
              <div className="relative z-[1] min-w-0">
                <h3
                  className={`font-display font-semibold uppercase leading-[0.9] tracking-[-0.02em] transition-all duration-500 ${
                    isSel ? "text-[76px]" : "text-[60px]"
                  }`}
                >
                  {s.name}
                </h3>
                <p className="mt-[10px] font-mono text-[12px] uppercase tracking-[0.2em] text-silver-dim">
                  {s.code} &nbsp;·&nbsp; {s.notes.map((n) => n.en).join(" · ")}
                  <span className="ml-[14px] font-display text-[16px] italic normal-case tracking-normal text-ink">
                    {s.mood.en}
                  </span>
                </p>
              </div>

              {/* destination */}
              <div className="relative z-[1] flex items-center justify-end gap-[22px] text-right">
                <div>
                  <p className="font-display text-[30px] font-semibold uppercase leading-[0.9] tracking-[-0.02em]">
                    {s.destination.en}
                  </p>
                  {sub && (
                    <p className="jp-sub mt-[5px] text-[12px] text-silver-dim">
                      {s.destination.jp}
                    </p>
                  )}
                </div>
                <span
                  key={isSel ? "sel" : "arrow"}
                  className="w-[26px] shrink-0 font-display text-[26px] leading-none text-silver-dim"
                  style={isSel ? { animation: "wordIn 0.4s ease both" } : undefined}
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
