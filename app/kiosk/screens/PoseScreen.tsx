"use client";

import Masthead from "@/app/components/Masthead";
import { TOTAL_SHOTS, type Scent } from "@/app/lib/edition";

const CUES = ["Chin up.", "Shoulders square.", "Eyes to the lens."];

export default function PoseScreen({
  scent,
  onBegin,
}: {
  scent: Scent;
  onBegin: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <Masthead />

      <div className="px-[80px] pt-[64px]">
        <p className="kicker anim-fade-up">Step II — The Pose</p>
        <h2 className="anim-fade-up delay-1 mt-[20px] font-display text-[96px] font-semibold leading-[0.88] tracking-[-0.02em]">
          Compose <span className="italic">yourself.</span>
        </h2>
      </div>

      {/* framing guide */}
      <div className="flex flex-1 items-center justify-center px-[80px] py-[30px]">
        <div className="relative h-full w-full max-h-[900px]">
          <Corner className="left-0 top-0" />
          <Corner className="right-0 top-0 rotate-90" />
          <Corner className="bottom-0 right-0 rotate-180" />
          <Corner className="bottom-0 left-0 -rotate-90" />

          <div className="flex h-full flex-col items-center justify-center gap-[38px]">
            {CUES.map((c, i) => (
              <p
                key={c}
                className={`anim-fade-up delay-${i + 2} font-display text-[58px] italic text-ink`}
              >
                {c}
              </p>
            ))}
            <p className="anim-fade-up delay-5 mt-[10px] font-mono text-[20px] uppercase tracking-[0.4em] text-silver-dim">
              {TOTAL_SHOTS} frames · one strip
            </p>
          </div>
        </div>
      </div>

      {/* selected scent + begin */}
      <div className="px-[80px] pb-[86px] pt-[20px]">
        <div className="mb-[26px] flex items-center justify-between border-t border-[color:var(--color-line)] pt-[26px] font-mono text-[19px] uppercase tracking-[0.24em]">
          <span className="text-silver-dim">Your scent</span>
          <span>
            {scent.index} · {scent.mood} — {scent.name}
          </span>
        </div>
        <button
          onClick={onBegin}
          className="press flex w-full items-center justify-between bg-ink px-[56px] py-[46px] text-paper"
          style={{ cursor: "none" }}
        >
          <span className="font-mono text-[28px] uppercase tracking-[0.44em]">
            Start the shoot
          </span>
          <span className="font-display text-[46px]">→</span>
        </button>
      </div>
    </div>
  );
}

function Corner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`pointer-events-none absolute h-[46px] w-[46px] border-l border-t border-[color:var(--color-ink)] ${className}`}
    />
  );
}
