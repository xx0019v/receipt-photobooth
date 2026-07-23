"use client";

import { useEffect, type PointerEvent as ReactPointerEvent, useRef } from "react";
import Masthead from "@/app/components/Masthead";
import { useLang } from "@/app/lib/i18n";
import { usePrintStyle, type PrintStyle } from "@/app/lib/printStyle";
import { BOARDING_H, BOARDING_W } from "@/app/components/BoardingPass";
import { type Scent } from "@/app/lib/edition";
import { type FilmArtifactProps } from "@/app/lib/film";

/**
 * FORMAT — both choices are visible at once.
 *
 * Showing one artefact at full print scale with the other hidden at the screen
 * edge made the choice hard to read: the guest could not compare, and the
 * finished design arrived before they had decided anything. This is a
 * comparison, so it is drawn as a comparison — two schematics side by side,
 * the wide ticket against the tall film, with the selected one stepping
 * forward. The real artefact is revealed later, at Proof, where it belongs.
 */
const SWIPE_THRESHOLD = 72;

export default function FormatSelectScreen({
  onContinue,
}: {
  scent?: Scent;
  filmProps?: FilmArtifactProps;
  onContinue: () => void;
}) {
  const { t, sub } = useLang();
  const { style, setStyle } = usePrintStyle();
  const swipeStart = useRef<{ pointerId: number; x: number; y: number } | null>(null);

  useEffect(() => {
    setStyle("pass");
  }, [setStyle]);

  const isPass = style === "pass";

  const startSwipe = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    swipeStart.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {}
  };

  const finishSwipe = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = swipeStart.current;
    if (!start || start.pointerId !== event.pointerId) return;
    swipeStart.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {}
    if (event.type === "pointercancel") return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) return;
    setStyle(dx < 0 ? "cover" : "pass");
  };

  return (
    <div className="flex h-full flex-col">
      <Masthead />

      <div className="px-[80px] pt-[44px]">
        <p className="kicker anim-fade-up">{t.format.step}</p>
        <h2 className="anim-fade-up delay-1 mt-[14px] font-display text-[74px] font-semibold leading-[0.88] tracking-[-0.025em]">
          {t.format.title[0]} <span className="italic">{t.format.title[1]}</span>
        </h2>
        {sub && (
          <p className="jp-sub anim-fade-up delay-1 mt-[10px] text-[19px] text-silver-dim">
            {sub.format.title[0]}
            {sub.format.title[1]}
          </p>
        )}
      </div>

      {/* Two formats, side by side — a real comparison, not a reveal */}
      <div
        className="anim-fade-up delay-2 flex flex-1 items-stretch px-[70px] py-[26px]"
        style={{ touchAction: "pan-y" }}
        onPointerDown={startSwipe}
        onPointerUp={finishSwipe}
        onPointerCancel={finishSwipe}
      >
        <FormatChoice
          id="pass"
          active={isPass}
          index="I"
          name={t.format.passName}
          tag={t.format.passTag}
          jp={sub?.format.passTag}
          size="620 × 2100"
          selectedLabel={t.format.selected}
          onPick={() => setStyle("pass")}
          glyph={<PassGlyph />}
        />
        <span aria-hidden="true" className="my-[24px] w-px shrink-0 bg-[color:var(--color-line)]" />
        <FormatChoice
          id="cover"
          active={!isPass}
          index="II"
          name={t.format.coverName}
          tag={t.format.coverTag}
          jp={sub?.format.coverTag}
          size="640 × 1280"
          selectedLabel={t.format.selected}
          onPick={() => setStyle("cover")}
          glyph={<FilmGlyph />}
        />
      </div>

      {/* action rail */}
      <div className="flex items-stretch gap-[24px] px-[80px] pb-[80px] pt-[8px]">
        <div className="flex flex-1 flex-col justify-center border-t border-[color:var(--color-line)] pt-[16px]">
          <span aria-live="polite" className="font-mono text-[15px] uppercase tracking-[0.24em] text-silver-dim">
            {t.format.selected}: <span className="text-ink">{isPass ? t.format.passName : t.format.coverName}</span>
          </span>
          {sub && (
            <span className="jp-sub mt-[4px] text-[14px] text-silver-dim">
              {isPass ? sub.format.passTag : sub.format.coverTag}
            </span>
          )}
        </div>
        <button
          onClick={onContinue}
          className="card press flex min-h-[96px] items-center gap-[22px] bg-ink px-[64px] text-paper"
          style={{ cursor: "pointer" }}
        >
          <span className="flex flex-col items-start gap-[4px]">
            <span className="font-mono text-[22px] uppercase tracking-[0.3em]">{t.format.continue}</span>
            {sub && <span className="jp-sub text-[14px] text-paper/55">{sub.format.continue}</span>}
          </span>
          <span className="font-display text-[38px]">→</span>
        </button>
      </div>
    </div>
  );
}

/** One of the two formats. The unselected side stays fully legible — it is a
 *  comparison, so it must never be dimmed into a decorative sliver. */
function FormatChoice({
  id,
  active,
  index,
  name,
  tag,
  jp,
  size,
  selectedLabel,
  onPick,
  glyph,
}: {
  id: PrintStyle;
  active: boolean;
  index: string;
  name: string;
  tag: string;
  jp?: string;
  size: string;
  selectedLabel: string;
  onPick: () => void;
  glyph: React.ReactNode;
}) {
  return (
    <button
      onClick={onPick}
      aria-pressed={active}
      data-format={id}
      className="press relative flex flex-1 flex-col items-center justify-center gap-[30px] px-[26px] py-[30px] text-center"
      style={{ cursor: "pointer" }}
    >
      <span className="flex items-center gap-[12px] font-mono text-[15px] tracking-[0.26em] text-silver-dim">
        <span>{index}</span>
        <span
          className="text-[12px] uppercase tracking-[0.26em]"
          style={{ color: active ? "var(--color-ink)" : "transparent" }}
        >
          · {selectedLabel}
        </span>
      </span>

      {/* schematic, not the finished artefact */}
      <span
        className="flex items-center justify-center transition-transform duration-[520ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ transform: active ? "scale(1)" : "scale(0.9)", opacity: active ? 1 : 0.55 }}
      >
        {glyph}
      </span>

      <span className="flex flex-col items-center gap-[8px]">
        <span
          className="font-display font-semibold leading-[0.95] tracking-[-0.015em] transition-all duration-500"
          style={{ fontSize: active ? 48 : 40 }}
        >
          {name}
        </span>
        <span className="font-display text-[21px] italic leading-tight text-silver-dim">{tag}</span>
        {jp && <span className="jp-sub text-[15px] text-silver-dim">{jp}</span>}
        <span className="mt-[4px] font-mono text-[12px] tracking-[0.2em] text-silver-dim">{size}</span>
      </span>

      {/* selected underline — a printed rule, not a chip */}
      <span
        aria-hidden="true"
        className="absolute bottom-[14px] left-1/2 h-px -translate-x-1/2 bg-[color:var(--color-ink)] transition-all duration-500"
        style={{ width: active ? 190 : 0 }}
      />
    </button>
  );
}

/** Horizontal boarding-ticket schematic — photo strip + detachable stub. */
function PassGlyph() {
  return (
    <span
      className="relative flex w-[366px] overflow-hidden border border-current"
      style={{ aspectRatio: `${BOARDING_W} / ${BOARDING_H}` }}
    >
      <span className="flex flex-1 flex-col justify-center gap-[7px] px-[14px] py-[11px]">
        <span className="h-[7px] w-[64%] bg-current" />
        <span className="flex gap-[7px]">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-[58px] w-[58px] bg-current" />
          ))}
        </span>
        <span className="h-[5px] w-[82%] bg-current opacity-40" />
      </span>
      <span className="my-[9px] w-px self-stretch border-l border-dashed border-current" />
      <span className="flex w-[96px] flex-col gap-[5px] px-[12px] py-[11px]">
        <span className="h-[5px] w-full bg-current opacity-70" />
        <span className="h-[5px] w-[68%] bg-current opacity-40" />
        <span className="h-[5px] w-[84%] bg-current opacity-40" />
        <span className="h-[5px] w-[56%] bg-current opacity-40" />
        <span className="mt-auto h-[18px] w-full bg-current opacity-75" />
      </span>
    </span>
  );
}

/** Vertical editorial film schematic — masthead, three frames, quote, barcode. */
function FilmGlyph() {
  return (
    <span className="relative flex h-[330px] w-[206px] flex-col overflow-hidden border border-current px-[17px] pb-[15px] pt-[13px]">
      <span className="mx-auto h-[11px] w-[46%] bg-current" />
      <span className="mx-auto mt-[5px] h-[3px] w-[30%] bg-current opacity-40" />
      <span className="mt-[15px] flex flex-1 items-start gap-[13px]">
        <span className="flex flex-col gap-[7px]">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-[49px] w-[49px] bg-current" />
          ))}
        </span>
        <span className="relative flex-1 self-stretch">
          <span className="absolute right-0 top-0 h-[22px] w-[22px] rounded-full border border-current opacity-70" />
          <span className="absolute bottom-[11px] left-1/2 h-[98px] w-[5px] -translate-x-1/2 bg-current opacity-80" />
        </span>
      </span>
      <span className="mt-[11px] h-px w-full bg-current opacity-30" />
      <span className="mt-[9px] flex gap-[7px]">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="h-[5px] flex-1 bg-current opacity-45" />
        ))}
      </span>
      <span className="mt-[11px] flex h-[17px] items-stretch justify-center gap-[3px]">
        {[3, 1, 2, 1, 3, 2, 1, 2].map((w, i) => (
          <span key={i} className="bg-current" style={{ width: w }} />
        ))}
      </span>
    </span>
  );
}
