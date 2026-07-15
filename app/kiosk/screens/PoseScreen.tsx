"use client";

import Masthead from "@/app/components/Masthead";
import Portrait from "@/app/components/Portrait";
import { CAPTURE_TOTAL, type Scent } from "@/app/lib/edition";
import { useLang } from "@/app/lib/i18n";
import { useChromeArtwork } from "@/app/lib/chromeArtwork";

export default function PoseScreen({
  scent,
  onBegin,
}: {
  scent: Scent;
  onBegin: () => void;
}) {
  const { t, sub } = useLang();
  const symbol = useChromeArtwork();

  return (
    <div className="flex h-full flex-col">
      <Masthead />

      <div className="px-[80px] pt-[60px]">
        <p className="kicker anim-fade-up">{t.pose.step}</p>
        <h2 className="anim-fade-up delay-1 mt-[22px] font-display text-[92px] font-semibold leading-[0.86] tracking-[-0.025em]">
          {t.pose.title}
        </h2>
        {sub && (
          <p className="jp-sub anim-fade-up delay-2 mt-[16px] text-[22px] text-silver-dim">
            {sub.pose.title}
          </p>
        )}
      </div>

      {/* viewfinder */}
      <div className="flex flex-1 items-center justify-center px-[80px] py-[30px]">
        <div className="anim-fade-up delay-2 relative h-full max-h-[880px] w-full overflow-hidden bg-ink">
          <div className="absolute inset-0 opacity-[0.5]">
            <Portrait seed={1} />
          </div>
          <div className="absolute inset-0 bg-ink/35" />

          <Grid />

          <Corner className="left-[26px] top-[26px]" />
          <Corner className="right-[26px] top-[26px] rotate-90" />
          <Corner className="bottom-[26px] right-[26px] rotate-180" />
          <Corner className="bottom-[26px] left-[26px] -rotate-90" />

          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="anim-breathe h-[120px] w-[120px] rounded-full border border-paper/50" />
            <span className="absolute left-1/2 top-1/2 h-[22px] w-px -translate-x-1/2 -translate-y-1/2 bg-paper/60" />
            <span className="absolute left-1/2 top-1/2 h-px w-[22px] -translate-x-1/2 -translate-y-1/2 bg-paper/60" />
          </div>

          {/* chrome seal reinterpreted as a bled corner watermark — a guide
              mark, not a boxed icon */}
          <img
            src={symbol.path}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -right-[70px] -top-[70px] h-[340px] w-[340px] rotate-[8deg] object-contain opacity-[0.07] grayscale mix-blend-overlay"
          />

          <div className="absolute inset-x-[34px] top-[30px] flex items-center justify-between font-mono text-[17px] uppercase tracking-[0.34em] text-paper/80">
            <span>{t.pose.viewfinder}</span>
            <span>{scent.mood.en}</span>
          </div>

          <div className="absolute inset-x-0 bottom-[42px] flex items-center justify-center gap-[26px] font-mono text-[18px] uppercase tracking-[0.22em] text-paper/85">
            {t.pose.cues.map((c, i) => (
              <span key={c} className="flex items-center gap-[26px]">
                {c}
                {i < t.pose.cues.length - 1 && <span className="text-paper/40">·</span>}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* selected scent + begin */}
      <div className="px-[80px] pb-[84px] pt-[16px]">
        <div className="mb-[24px] flex items-center justify-between border-t border-[color:var(--color-line)] pt-[24px] font-mono text-[18px] uppercase tracking-[0.22em]">
          <span className="text-silver-dim">{t.pose.yourScent}</span>
          <span>
            {scent.index} · {scent.mood.en} — {scent.name}
          </span>
        </div>
        <button
          onClick={onBegin}
          className="card press flex w-full items-center justify-between bg-ink px-[56px] py-[42px] text-paper"
          style={{ cursor: "pointer" }}
        >
          <span className="flex flex-col gap-[6px]">
            <span className="font-mono text-[26px] uppercase tracking-[0.4em]">
              {t.pose.start}
            </span>
            {sub && (
              <span className="jp-sub text-[17px] text-paper/55">{sub.pose.start}</span>
            )}
          </span>
          <span className="font-mono text-[19px] uppercase tracking-[0.28em] text-paper/60">
            {CAPTURE_TOTAL} {t.pose.frames} →
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
