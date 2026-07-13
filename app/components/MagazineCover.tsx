"use client";

import Portrait from "./Portrait";
import { editionDate, issueNo, type Scent } from "@/app/lib/edition";
import { useLang } from "@/app/lib/i18n";
import type { Quote } from "@/app/lib/quotes";
import { useChromeArtwork } from "@/app/lib/chromeArtwork";

/**
 * COVER artefact — a 1:1 square art / quote card in the Korean-photobooth
 * register: a quiet soft-grey card, a small three-frame contact strip, and a
 * big editorial quote as the hero. The paper runs a little longer than the
 * square (thin header/footer), but the eye reads a square print. No QR.
 * Strict white / black / grey.
 */
export default function MagazineCover({
  frames,
  scent,
  quote,
  serial,
}: {
  frames: number[];
  scent: Scent;
  quote: Quote;
  serial: string;
}) {
  const { t } = useLang();
  const motif = useChromeArtwork();

  return (
    <div className="paper-tex relative flex h-[760px] w-[640px] flex-col text-ink shadow-[0_30px_80px_-38px_rgba(0,0,0,0.7)]">
      {/* thin header */}
      <div className="flex items-center justify-between px-[40px] pt-[26px] font-mono text-[11px] uppercase tracking-[0.3em] text-silver-dim">
        <span>Parfum Receipt Studio</span>
        <span>{issueNo()}</span>
      </div>

      {/* the 1:1 square art card */}
      <div className="mx-[40px] mt-[18px] flex aspect-square flex-col bg-[#ece9e3] p-[34px]">
        {/* small contact strip */}
        <div className="flex h-[150px] w-full gap-[6px]">
          {frames.map((f) => (
            <div key={f} className="relative min-w-0 flex-1 overflow-hidden bg-ink">
              <Portrait seed={f - 1} print />
              <span className="absolute bottom-[5px] left-[7px] font-mono text-[9px] tracking-[0.1em] text-paper">
                {String(f).padStart(2, "0")}
              </span>
            </div>
          ))}
        </div>

        {/* One fixed session motif beside the quote; never regenerated here. */}
        <div className="grid flex-1 grid-cols-[1fr_138px] items-center gap-[18px]">
          <QuoteBlock quote={quote} />
          <figure className="flex h-[180px] items-center justify-center border-l border-[color:var(--color-line)] pl-[16px]">
            <img
              src={motif.path}
              width={120}
              height={150}
              alt=""
              aria-hidden="true"
              className="h-[150px] w-[120px] object-contain opacity-75 grayscale contrast-125 mix-blend-multiply"
            />
          </figure>
        </div>

        {/* quiet caption inside the card */}
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.24em] text-silver-dim">
          <span>{scent.mood.en} · {scent.name}</span>
          <span>{editionDate()}</span>
        </div>
      </div>

      {/* thin footer */}
      <div className="mt-auto flex items-center justify-between px-[40px] pb-[24px] pt-[16px] font-mono text-[10px] uppercase tracking-[0.26em] text-silver-dim">
        <span>{serial}</span>
        <span>{t.pass.closing}</span>
      </div>
    </div>
  );
}

function QuoteBlock({ quote }: { quote: Quote }) {
  const alignment = quote.alignment === "left" ? "text-left" : quote.alignment === "right" ? "text-right" : "text-center";
  const scale = quote.scale === "large" ? 1.08 : quote.scale === "compact" ? 0.84 : 1;
  const base = `${alignment} leading-[0.98]`;
  const content = quote.lineBreak ?? [quote.text];
  const lines = content.map((line, index) => <span key={index} className="block">{line}</span>);
  if (quote.variant === "sans-caps") {
    return (
      <p className={`${base} font-sans font-semibold uppercase tracking-[0.02em]`} style={{ fontSize: 66 * scale }}>
        {lines}
      </p>
    );
  }
  if (quote.variant === "sans") {
    return (
      <p className={`${base} font-sans font-semibold tracking-[-0.01em]`} style={{ fontSize: 52 * scale }}>
        {lines}
      </p>
    );
  }
  if (quote.variant === "serif-italic") {
    return (
      <p className={`${base} font-display italic`} style={{ fontSize: 58 * scale }}>{lines}</p>
    );
  }
  // serif
  return (
    <p className={`${base} font-display leading-[1.02]`} style={{ fontSize: 52 * scale }}>{lines}</p>
  );
}
