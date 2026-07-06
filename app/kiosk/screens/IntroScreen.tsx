"use client";

import Masthead from "@/app/components/Masthead";
import { TOTAL_SHOTS } from "@/app/lib/edition";

const STEPS = [
  {
    n: "I",
    t: "Compose",
    d: "Stand within the frame. Chin up, shoulders square — this is a cover shoot.",
  },
  {
    n: "II",
    t: "Hold",
    d: `A three-count, then the flash. We capture ${TOTAL_SHOTS} frames back to back.`,
  },
  {
    n: "III",
    t: "Collect",
    d: "Your strip prints on a receipt in seconds. Tear along the line and keep it.",
  },
];

export default function IntroScreen({ onBegin }: { onBegin: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <Masthead />

      <div className="flex flex-1 flex-col px-[80px] pt-[70px]">
        <p className="kicker anim-fade-up">The Method</p>
        <h2 className="anim-fade-up delay-1 mt-[22px] font-display text-[104px] font-semibold leading-[0.9] tracking-[-0.02em]">
          How it
          <br />
          <span className="italic">works.</span>
        </h2>

        <div className="mt-[80px] flex flex-col">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className={`anim-fade-up flex gap-[44px] border-t border-[color:var(--color-line)] py-[46px] delay-${i + 2}`}
            >
              <span className="font-display text-[64px] italic leading-none text-silver">
                {s.n}
              </span>
              <div className="flex-1">
                <h3 className="font-display text-[46px] leading-none">{s.t}</h3>
                <p className="mt-[18px] max-w-[640px] text-[26px] leading-[1.45] text-ink-soft">
                  {s.d}
                </p>
              </div>
            </div>
          ))}
          <div className="border-t border-[color:var(--color-line)]" />
        </div>
      </div>

      <div className="px-[80px] pb-[86px] pt-[40px]">
        <button
          onClick={onBegin}
          className="press anim-fade-up delay-5 flex w-full items-center justify-between bg-ink px-[56px] py-[46px] text-paper"
          style={{ cursor: "none" }}
        >
          <span className="font-mono text-[28px] uppercase tracking-[0.44em]">
            I&apos;m ready
          </span>
          <span className="font-display text-[46px]">→</span>
        </button>
      </div>
    </div>
  );
}
