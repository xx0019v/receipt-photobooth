"use client";

import Masthead from "@/app/components/Masthead";
import Portrait from "@/app/components/Portrait";
import { CAPTURE_TOTAL, type Scent } from "@/app/lib/edition";
import { useLang } from "@/app/lib/i18n";
import { useChromeArtwork } from "@/app/lib/chromeArtwork";

/**
 * POSE — not a tutorial page: the framing stage. The viewfinder dominates,
 * the session's frame count is set as an oversized numeral inside the
 * machine's margin, and a single instruction line replaces explanatory copy.
 * START CAPTURE is a fixed, full-width rail at the bottom.
 */
export default function PoseScreen({
  scent,
  previewSrc,
  onBegin,
}: {
  scent: Scent;
  /** Live MJPEG from the booth camera. Undefined falls back to the placeholder. */
  previewSrc?: string;
  onBegin: () => void;
}) {
  const { t, sub } = useLang();
  const symbol = useChromeArtwork();

  return (
    <div className="flex h-full flex-col">
      <Masthead />

      {/* header row — step + the session's frame count as the typographic hero */}
      <div className="flex items-end justify-between px-[80px] pt-[30px]">
        <div>
          <p className="kicker anim-fade-up">{t.pose.step}</p>
          <h2 className="anim-fade-up delay-1 mt-[10px] font-display text-[64px] font-semibold leading-[0.9] tracking-[-0.02em]">
            {t.pose.title}
          </h2>
          {sub && (
            <p className="jp-sub anim-fade-up delay-2 mt-[8px] text-[18px] text-silver-dim">{sub.pose.title}</p>
          )}
        </div>
        <div className="anim-fade-up delay-1 flex items-baseline gap-[14px]">
          <span className="font-display font-semibold leading-[0.8] tracking-[-0.04em]" style={{ fontSize: 150 }}>
            {CAPTURE_TOTAL}
          </span>
          <span className="mb-[10px] font-mono text-[16px] uppercase leading-[1.7] tracking-[0.3em] text-silver-dim">
            {t.pose.frames}
            <br />
            {scent.mood.en}
          </span>
        </div>
      </div>

      {/* viewfinder — the screen's dominant surface */}
      <div className="flex flex-1 items-center justify-center px-[60px] py-[20px]">
        <div className="anim-fade-up delay-2 relative h-full max-h-[1080px] w-full overflow-hidden bg-ink">
          {/* The guest frames themselves here, so the live feed is carried at
              full strength; the placeholder stays held back because it is
              scenery, not a viewfinder. */}
          {previewSrc ? (
            <img
              src={previewSrc}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover opacity-95 grayscale"
            />
          ) : (
            <div className="absolute inset-0 opacity-[0.5]">
              <Portrait seed={1} />
            </div>
          )}
          <div className={`absolute inset-0 ${previewSrc ? "bg-ink/20" : "bg-ink/35"}`} />

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
            <span>
              {scent.index} · {scent.name}
            </span>
          </div>

          {/* one instruction line, inside the frame where the guest looks */}
          <div className="absolute inset-x-0 bottom-[42px] flex items-center justify-center gap-[26px] font-mono text-[19px] uppercase tracking-[0.22em] text-paper/85">
            {t.pose.cues.map((c, i) => (
              <span key={c} className="flex items-center gap-[26px]">
                {c}
                {i < t.pose.cues.length - 1 && <span className="text-paper/40">·</span>}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* fixed action rail */}
      <div className="px-[80px] pb-[80px] pt-[6px]">
        <button
          onClick={onBegin}
          className="card press flex min-h-[120px] w-full items-center justify-between bg-ink px-[62px] text-paper"
          style={{ cursor: "pointer" }}
        >
          <span className="flex flex-col gap-[6px]">
            <span className="font-mono text-[26px] uppercase tracking-[0.4em]">{t.pose.start}</span>
            {sub && <span className="jp-sub text-[17px] text-paper/60">{sub.pose.start}</span>}
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
