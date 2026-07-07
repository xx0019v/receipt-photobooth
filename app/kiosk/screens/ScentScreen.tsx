"use client";

import Masthead from "@/app/components/Masthead";
import { SCENTS, type Scent } from "@/app/lib/edition";

export default function ScentScreen({
  onSelect,
}: {
  onSelect: (s: Scent) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <Masthead />

      <div className="px-[80px] pt-[64px]">
        <p className="kicker anim-fade-up">Step I — The Mood</p>
        <h2 className="anim-fade-up delay-1 mt-[20px] font-display text-[96px] font-semibold leading-[0.88] tracking-[-0.02em]">
          How do you want
          <br />
          to be <span className="italic">remembered?</span>
        </h2>
        <p className="anim-fade-up delay-2 mt-[20px] text-[26px] text-ink-soft">
          Choose a scent. It prints with your portrait.
        </p>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-[20px] px-[80px] py-[40px]">
        {SCENTS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            className={`card anim-fade-up delay-${i + 2} flex items-center gap-[40px] border border-[color:var(--color-ink)] bg-paper-bright px-[46px] py-[40px] text-left`}
            style={{ cursor: "none" }}
          >
            <span className="font-mono text-[22px] tracking-[0.2em] text-silver-dim">
              {s.index}
            </span>
            <div className="flex-1">
              <h3 className="font-display text-[62px] leading-[0.9]">
                {s.mood}
              </h3>
              <p className="mt-[10px] font-mono text-[19px] uppercase tracking-[0.2em] text-silver-dim">
                {s.notes.join(" · ")}
              </p>
            </div>
            <div className="text-right">
              <p className="font-display text-[26px] italic leading-none">
                {s.name}
              </p>
              <span className="mt-[14px] block font-display text-[40px]">→</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
