"use client";

import { useState } from "react";
import Masthead from "@/app/components/Masthead";
import { SCENTS, type Scent } from "@/app/lib/edition";

export default function ScentScreen({
  onSelect,
}: {
  onSelect: (s: Scent) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);

  const choose = (s: Scent) => {
    if (picked) return;
    setPicked(s.id);
    // let the selection register visually before advancing
    setTimeout(() => onSelect(s), 420);
  };

  return (
    <div className="flex h-full flex-col">
      <Masthead />

      <div className="px-[80px] pt-[60px]">
        <p className="kicker anim-fade-up">Step I · The Mood</p>
        <h2 className="anim-fade-up delay-1 mt-[22px] font-display text-[92px] font-semibold leading-[0.86] tracking-[-0.025em]">
          How do you want
          <br />
          to be <span className="italic">remembered?</span>
        </h2>
        <p className="anim-fade-up delay-2 mt-[22px] text-[25px] leading-[1.4] text-silver-dim">
          Choose a scent. It is pressed into your receipt.
        </p>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-[18px] px-[80px] py-[36px]">
        {SCENTS.map((s, i) => {
          const isSel = picked === s.id;
          return (
            <button
              key={s.id}
              onClick={() => choose(s)}
              className={`card anim-fade-up delay-${i + 2} relative flex items-center gap-[44px] border border-[color:var(--color-ink)] px-[48px] py-[38px] text-left ${
                isSel ? "is-selected" : "bg-paper-bright"
              }`}
              style={{ cursor: "none" }}
            >
              <span className="card-ghost">{s.index}</span>
              <span className="card-index font-mono text-[22px] tracking-[0.22em] text-silver-dim">
                {s.index}
              </span>
              <span
                className={`h-[64px] w-px ${isSel ? "bg-paper/30" : "bg-[color:var(--color-line)]"}`}
              />
              <div className="relative z-[1] flex-1">
                <h3 className="font-display text-[60px] leading-[0.92]">
                  {s.mood}
                </h3>
                <p className="card-notes mt-[12px] font-mono text-[18px] uppercase tracking-[0.26em] text-silver-dim">
                  {s.notes.join("  ·  ")}
                </p>
              </div>
              <div className="relative z-[1] flex flex-col items-end gap-[16px]">
                <p className="font-display text-[26px] italic leading-none">
                  {s.name}
                </p>
                <span className="font-display text-[38px] leading-none">
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
