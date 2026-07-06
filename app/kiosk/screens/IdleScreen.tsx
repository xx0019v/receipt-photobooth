"use client";

import Masthead from "@/app/components/Masthead";
import { LOCATION, TAGLINE, editionDate } from "@/app/lib/edition";

const MARQUEE = [
  "POSE",
  "PRINT",
  "POCKET",
  "SMILE",
  "STRIKE",
  "COLLECT",
];

export default function IdleScreen({ onStart }: { onStart: () => void }) {
  return (
    <button
      onClick={onStart}
      className="absolute inset-0 h-full w-full text-left"
      style={{ cursor: "none" }}
    >
      <div className="flex h-full flex-col">
        <Masthead variant="cover" />

        {/* Cover title */}
        <div className="flex flex-1 flex-col justify-center px-[80px]">
          <p className="kicker anim-fade-up">{TAGLINE}</p>

          <h1 className="anim-fade-up delay-1 mt-[34px] font-display font-semibold leading-[0.82] tracking-[-0.02em]">
            <span className="block text-[168px]">THE</span>
            <span className="block text-[168px] italic">Receipt</span>
          </h1>

          <div className="anim-fade-up delay-2 mt-[54px] flex items-center gap-[28px]">
            <span className="rule w-[120px]" />
            <p className="font-display text-[34px] italic leading-[1.25] text-ink-soft">
              Your portrait,
              <br />
              printed on a receipt.
            </p>
          </div>

          <div className="anim-fade-up delay-3 mt-[60px] grid grid-cols-3 gap-[2px] font-mono text-[15px] uppercase tracking-[0.18em] text-silver-dim">
            <span>01 — Pose</span>
            <span className="text-center">02 — Snap</span>
            <span className="text-right">03 — Print</span>
          </div>
        </div>

        {/* Marquee band */}
        <div className="overflow-hidden border-y border-[color:var(--color-ink)] py-[26px]">
          <div className="marquee-track">
            {[...MARQUEE, ...MARQUEE, ...MARQUEE, ...MARQUEE].map((w, i) => (
              <span
                key={i}
                className="mx-[38px] font-display text-[52px] italic"
              >
                {w}
                <span className="mx-[38px] not-italic text-silver">✦</span>
              </span>
            ))}
          </div>
        </div>

        {/* Call to action */}
        <div className="px-[80px] pb-[86px] pt-[70px]">
          <div className="anim-breathe flex items-center justify-center gap-[24px] border border-[color:var(--color-ink)] py-[42px]">
            <span className="h-[16px] w-[16px] rounded-full bg-ink" />
            <span className="font-mono text-[30px] uppercase tracking-[0.5em]">
              Tap to begin
            </span>
          </div>
          <div className="mt-[30px] flex justify-between font-mono text-[13px] uppercase tracking-[0.28em] text-silver-dim">
            <span>{LOCATION}</span>
            <span>{editionDate()}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
