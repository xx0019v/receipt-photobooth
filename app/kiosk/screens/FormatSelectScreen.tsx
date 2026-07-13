"use client";

import { useEffect } from "react";
import Masthead from "@/app/components/Masthead";
import { useLang } from "@/app/lib/i18n";
import { usePrintStyle, type PrintStyle } from "@/app/lib/printStyle";
import { CHROME_ASSETS } from "@/app/lib/chromeAssets";

/**
 * The ritual of choosing HOW the memory is kept — a boarding pass or film.
 * Two large editorial choices with a schematic of each artefact; a quiet
 * confirm; then Continue. No "template" language, no card-UI cheapness.
 */
export default function FormatSelectScreen({
  onContinue,
}: {
  onContinue: () => void;
}) {
  const { t, sub } = useLang();
  const { style, setStyle } = usePrintStyle();

  useEffect(() => {
    setStyle("pass");
  }, [setStyle]);

  const selectedName =
    style === "pass" ? t.format.passName : t.format.coverName;

  return (
    <div className="flex h-full flex-col">
      <Masthead />

      <div className="px-[80px] pt-[58px]">
        <p className="kicker anim-fade-up">{t.format.step}</p>
        <h2 className="anim-fade-up delay-1 mt-[20px] font-display text-[92px] font-semibold leading-[0.86] tracking-[-0.025em]">
          {t.format.title[0]}
          <br />
          <span className="italic">{t.format.title[1]}</span>
        </h2>
        {sub && (
          <p className="jp-sub anim-fade-up delay-2 mt-[16px] text-[22px] text-silver-dim">
            {sub.format.title[0]}
            {sub.format.title[1]}
          </p>
        )}
      </div>

      {/* the spread — two facing pages, the chosen one steps forward */}
      <div className="anim-fade-up delay-2 relative flex flex-1 items-stretch px-[80px] py-[24px]">
        <Page
          id="pass"
          side="left"
          active={style === "pass"}
          index="I"
          name={t.format.passName}
          tag={t.format.passTag}
          jp={sub?.format.passTag}
          selectedLabel={t.format.selected}
          onPick={() => setStyle("pass")}
          glyph={<PassGlyph />}
        />
        <span
          aria-hidden="true"
          className="relative z-[1] my-[10px] w-px shrink-0 bg-[color:var(--color-line)]"
        />
        <Page
          id="cover"
          side="right"
          active={style === "cover"}
          index="II"
          name={t.format.coverName}
          tag={t.format.coverTag}
          jp={sub?.format.coverTag}
          selectedLabel={t.format.selected}
          onPick={() => setStyle("cover")}
          glyph={<CoverGlyph />}
        />
      </div>

      <div className="flex items-center justify-between gap-[24px] px-[80px] pb-[86px] pt-[10px]">
        <p className="font-mono text-[18px] uppercase tracking-[0.28em] text-silver-dim">
          {t.format.selected}:{" "}
          <span className="text-ink">{selectedName}</span>
        </p>
        <button
          onClick={onContinue}
          className="card press flex items-center gap-[22px] bg-ink px-[64px] py-[40px] text-paper"
          style={{ cursor: "pointer" }}
        >
          <span className="flex flex-col items-start gap-[4px]">
            <span className="font-mono text-[24px] uppercase tracking-[0.36em]">
              {t.format.continue}
            </span>
            {sub && (
              <span className="jp-sub text-[15px] text-paper/55">
                {sub.format.continue}
              </span>
            )}
          </span>
          <span className="font-display text-[42px]">→</span>
        </button>
      </div>
    </div>
  );
}

function Page({
  id,
  side,
  active,
  index,
  name,
  tag,
  jp,
  selectedLabel,
  onPick,
  glyph,
}: {
  id: PrintStyle;
  side: "left" | "right";
  active: boolean;
  index: string;
  name: string;
  tag: string;
  jp?: string;
  selectedLabel: string;
  onPick: () => void;
  glyph: React.ReactNode;
}) {
  const recede = side === "left" ? "-translate-x-[14px]" : "translate-x-[14px]";

  return (
    <button
      onClick={onPick}
      className={`card press relative z-[1] flex flex-1 flex-col items-center justify-center gap-[26px] px-[28px] py-[40px] text-center transition-[transform,opacity,filter] duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
        active
          ? "scale-100 opacity-100"
          : `scale-[0.94] opacity-40 grayscale ${recede}`
      }`}
      style={{ cursor: "pointer" }}
      aria-pressed={active}
      data-format={id}
    >
      <div className="flex items-center gap-[12px] font-mono text-[16px] tracking-[0.3em] text-silver-dim">
        <span>{index}</span>
        {active && (
          <span
            key="sel"
            className="text-[13px] uppercase tracking-[0.3em] text-ink"
            style={{ animation: "wordIn 0.4s ease both" }}
          >
            · {selectedLabel}
          </span>
        )}
      </div>

      {/* schematic of the artefact */}
      <div
        className={`flex shrink-0 items-center justify-center transition-transform duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          active ? "scale-100" : "scale-[0.88]"
        }`}
      >
        {glyph}
      </div>

      <div>
        <h3
          className={`font-display font-semibold uppercase leading-[0.9] tracking-[-0.01em] transition-all duration-500 ${
            active ? "text-[50px]" : "text-[40px]"
          }`}
        >
          {name}
        </h3>
        <p className="mt-[10px] font-display text-[22px] italic leading-tight text-silver-dim">
          {tag}
        </p>
        {jp && <p className="jp-sub mt-[8px] text-[15px] text-silver-dim">{jp}</p>}
      </div>
    </button>
  );
}

/** Vertical 80mm boarding-pass schematic. */
function PassGlyph() {
  return (
    <div className="relative flex h-[164px] w-[104px] flex-col overflow-hidden border border-current p-[7px]">
      <img src={CHROME_ASSETS.stars.path} width={34} height={34} alt="" aria-hidden="true" className="absolute right-[4px] top-[4px] h-[34px] w-[34px] object-contain opacity-30 grayscale mix-blend-multiply" />
      <span className="h-[4px] w-[70%] bg-current" />
      <div className="mx-auto mt-[7px] flex h-[76px] w-[24px] flex-col gap-[2px] border-y border-current py-[3px]">
        {[0, 1, 2].map((i) => (
          <span key={i} className="aspect-square w-full bg-current" />
        ))}
      </div>
      <div className="mt-[6px] flex flex-col gap-[4px]">
        <span className="h-[3px] w-[92%] bg-current" />
        <span className="h-[3px] w-[68%] bg-current opacity-40" />
      </div>
      <div className="mt-auto flex items-end gap-[7px] border-t border-dashed border-current pt-[7px]">
        <span className="h-[18px] flex-1 bg-current" />
        <span className="h-[22px] w-[22px] border border-current" />
      </div>
    </div>
  );
}

/** Vertical photo-film schematic, matching the printed artefact ratio. */
function CoverGlyph() {
  return (
    <div className="relative flex h-[164px] w-[98px] flex-col gap-[4px] overflow-hidden border border-current p-[7px]">
      <img src={CHROME_ASSETS.ribbon.path} width={32} height={36} alt="" aria-hidden="true" className="absolute bottom-[8px] right-[5px] h-[36px] w-[32px] object-contain opacity-40 grayscale mix-blend-multiply" />
      <span className="mx-auto mb-[2px] h-[4px] w-[64%] bg-current" />
      {[0, 1, 2].map((i) => (
        <span key={i} className="w-full flex-1 bg-current" />
      ))}
      <span className="mt-[3px] h-[3px] w-[58%] bg-current opacity-60" />
      <span className="h-[3px] w-[74%] bg-current opacity-35" />
    </div>
  );
}
