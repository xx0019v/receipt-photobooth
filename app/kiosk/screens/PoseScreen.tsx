"use client";

import Masthead from "@/app/components/Masthead";
import Portrait from "@/app/components/Portrait";
import { TOTAL_SHOTS, type Scent } from "@/app/lib/edition";

const CUES = ["Chin up", "Shoulders square", "Eyes to the lens"];

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

      <div className="px-[80px] pt-[60px]">
        <p className="kicker anim-fade-up">Step II · The Pose</p>
        <h2 className="anim-fade-up delay-1 mt-[22px] font-display text-[92px] font-semibold leading-[0.86] tracking-[-0.025em]">
          Compose <span className="italic">yourself.</span>
        </h2>
      </div>

      {/* viewfinder */}
      <div className="flex flex-1 items-center justify-center px-[80px] py-[30px]">
        <div className="anim-fade-up delay-2 relative h-full max-h-[880px] w-full overflow-hidden bg-ink">
          {/* dim live-preview stand-in */}
          <div className="absolute inset-0 opacity-[0.5]">
            <Portrait seed={1} />
          </div>
          <div className="absolute inset-0 bg-ink/35" />

          {/* rule-of-thirds grid */}
          <Grid />

          {/* corner marks */}
          <Corner className="left-[26px] top-[26px]" />
          <Corner className="right-[26px] top-[26px] rotate-90" />
          <Corner className="bottom-[26px] right-[26px] rotate-180" />
          <Corner className="bottom-[26px] left-[26px] -rotate-90" />

          {/* centre reticle */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="anim-breathe h-[120px] w-[120px] rounded-full border border-paper/50" />
            <span className="absolute left-1/2 top-1/2 h-[22px] w-px -translate-x-1/2 -translate-y-1/2 bg-paper/60" />
            <span className="absolute left-1/2 top-1/2 h-px w-[22px] -translate-x-1/2 -translate-y-1/2 bg-paper/60" />
          </div>

          {/* top status */}
          <div className="absolute inset-x-[34px] top-[30px] flex items-center justify-between font-mono text-[17px] uppercase tracking-[0.36em] text-paper/80">
            <span>Viewfinder</span>
            <span>{scent.mood}</span>
          </div>

          {/* cues */}
          <div className="absolute inset-x-0 bottom-[42px] flex items-center justify-center gap-[26px] font-mono text-[18px] uppercase tracking-[0.28em] text-paper/85">
            {CUES.map((c, i) => (
              <span key={c} className="flex items-center gap-[26px]">
                {c}
                {i < CUES.length - 1 && <span className="text-paper/40">·</span>}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* selected scent + begin */}
      <div className="px-[80px] pb-[84px] pt-[16px]">
        <div className="mb-[24px] flex items-center justify-between border-t border-[color:var(--color-line)] pt-[24px] font-mono text-[18px] uppercase tracking-[0.24em]">
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
          <span className="font-mono text-[27px] uppercase tracking-[0.44em]">
            Start the shoot
          </span>
          <span className="font-mono text-[19px] uppercase tracking-[0.3em] text-paper/60">
            {TOTAL_SHOTS} frames →
          </span>
        </button>
      </div>
    </div>
  );
}

function Grid() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <span className="absolute left-1/3 top-0 h-full w-px bg-paper/12" />
      <span className="absolute left-2/3 top-0 h-full w-px bg-paper/12" />
      <span className="absolute left-0 top-1/3 h-px w-full bg-paper/12" />
      <span className="absolute left-0 top-2/3 h-px w-full bg-paper/12" />
    </div>
  );
}

function Corner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`pointer-events-none absolute h-[42px] w-[42px] border-l-2 border-t-2 border-paper/70 ${className}`}
    />
  );
}
