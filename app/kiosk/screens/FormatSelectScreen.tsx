"use client";

import { useEffect } from "react";
import Masthead from "@/app/components/Masthead";
import { useLang } from "@/app/lib/i18n";
import { usePrintStyle } from "@/app/lib/printStyle";
import BoardingPass, { BOARDING_H, BOARDING_W } from "@/app/components/BoardingPass";
import MagazineCover from "@/app/components/MagazineCover";
import { type Scent } from "@/app/lib/edition";
import { type FilmArtifactProps } from "@/app/lib/film";

/**
 * FORMAT — no schematic cards. The artefact the guest will actually collect
 * is shown at近-full print scale as the hero; the other format waits as a
 * physical sliver at the screen edge (tap it, or the rail toggle, to swap).
 * The eye starts on paper, not on UI.
 */
const PASS_PREVIEW_W = 940;
const PASS_SCALE = PASS_PREVIEW_W / BOARDING_W;
const FILM_PREVIEW_H = 1000;
const FILM_SCALE = FILM_PREVIEW_H / 1280;

export default function FormatSelectScreen({
  scent,
  filmProps,
  onContinue,
}: {
  scent: Scent;
  filmProps: FilmArtifactProps;
  onContinue: () => void;
}) {
  const { t, sub } = useLang();
  const { style, setStyle } = usePrintStyle();

  useEffect(() => {
    setStyle("pass");
  }, [setStyle]);

  const isPass = style === "pass";

  return (
    <div className="flex h-full flex-col">
      <Masthead />

      <div className="px-[80px] pt-[40px]">
        <p className="kicker anim-fade-up">{t.format.step}</p>
        <h2 className="anim-fade-up delay-1 mt-[14px] font-display text-[74px] font-semibold leading-[0.88] tracking-[-0.025em]">
          {t.format.title[0]} <span className="italic">{t.format.title[1]}</span>
        </h2>
      </div>

      {/* The paper itself is the hero — the live artefact at near-print scale */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {isPass ? (
          <div className="anim-fade-up delay-2 relative">
            <div
              className="overflow-hidden border border-[color:var(--color-line)] bg-paper-bright shadow-[0_30px_60px_-42px_rgba(0,0,0,0.55)]"
              style={{ width: PASS_PREVIEW_W, height: Math.round(BOARDING_H * PASS_SCALE) }}
            >
              <div style={{ width: BOARDING_W, height: BOARDING_H, transform: `scale(${PASS_SCALE})`, transformOrigin: "top left" }}>
                <BoardingPass frames={[]} scent={scent} serial="0000-0000" />
              </div>
            </div>
            <div className="mt-[22px] flex items-baseline justify-between font-mono uppercase">
              <span className="text-[26px] tracking-[0.3em]">{t.format.passName}</span>
              <span className="text-[13px] tracking-[0.24em] text-silver-dim">620 × 2100 · {t.format.passTag}</span>
            </div>
          </div>
        ) : (
          <div className="anim-fade-up delay-2 relative flex items-end gap-[36px]">
            <div
              className="overflow-hidden border border-[color:var(--color-line)] bg-paper-bright shadow-[0_30px_60px_-42px_rgba(0,0,0,0.55)]"
              style={{ width: Math.round(640 * FILM_SCALE), height: FILM_PREVIEW_H }}
            >
              <div style={{ width: 640, transform: `scale(${FILM_SCALE})`, transformOrigin: "top left" }}>
                <MagazineCover {...filmProps} />
              </div>
            </div>
            <div className="mb-[8px] flex flex-col gap-[6px] font-mono uppercase" style={{ writingMode: "vertical-rl" }}>
              <span className="text-[24px] tracking-[0.3em]">{t.format.coverName}</span>
              <span className="text-[13px] tracking-[0.24em] text-silver-dim">640 × 1280 · {t.format.coverTag}</span>
            </div>
          </div>
        )}

        {/* the other format waits at the screen edge — a physical sliver */}
        <button
          type="button"
          onClick={() => setStyle(isPass ? "cover" : "pass")}
          aria-label={isPass ? t.format.coverName : t.format.passName}
          className="press absolute right-0 top-1/2 flex -translate-y-1/2 items-center"
          style={{ cursor: "pointer", minHeight: 320, minWidth: 88 }}
        >
          <span className="flex flex-col items-center gap-[16px] border-y border-l border-[color:var(--color-line)] bg-paper-bright py-[36px] pl-[18px] pr-[10px] shadow-[-14px_0_30px_-24px_rgba(0,0,0,0.4)]">
            <span className="font-mono text-[13px] uppercase tracking-[0.3em] text-silver-dim" style={{ writingMode: "vertical-rl" }}>
              {isPass ? t.format.coverName : t.format.passName} →
            </span>
          </span>
        </button>
      </div>

      {/* action rail */}
      <div className="flex items-stretch gap-[24px] px-[80px] pb-[80px] pt-[8px]">
        <div className="flex flex-1 flex-col justify-center border-t border-[color:var(--color-line)] pt-[16px]">
          <span className="font-mono text-[15px] uppercase tracking-[0.28em] text-silver-dim">
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
            <span className="font-mono text-[22px] uppercase tracking-[0.36em]">{t.format.continue}</span>
            {sub && <span className="jp-sub text-[14px] text-paper/55">{sub.format.continue}</span>}
          </span>
          <span className="font-display text-[38px]">→</span>
        </button>
      </div>
    </div>
  );
}
