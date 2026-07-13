"use client";

import Portrait from "./Portrait";
import { BRAND, editionDate, issueNo, type Scent } from "@/app/lib/edition";
import type { Quote } from "@/app/lib/quotes";
import { useChromeArtwork } from "@/app/lib/chromeArtwork";

/**
 * PHOTO FILM artefact — restored from the original vertical film design:
 * three square captures stacked as a quiet contact column, followed by one
 * editorial quote and one fixed session motif. Strict monochrome, no QR.
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
  const motif = useChromeArtwork();

  return (
    <div className="paper-tex relative flex h-[1280px] w-[640px] flex-col text-ink shadow-[0_30px_80px_-38px_rgba(0,0,0,0.42)]">
      <div className="flex items-center justify-between border-b border-[color:var(--color-line)] px-[36px] pb-[16px] pt-[28px] font-mono text-[10px] uppercase tracking-[0.32em] text-silver-dim">
        <span>{issueNo()}</span>
        <span>Photo Film · {scent.code}</span>
        <span>{editionDate()}</span>
      </div>

      <div className="mx-[36px] mt-[18px] flex h-[974px] flex-col items-center gap-[7px]">
        {[0, 1, 2].map((index) => {
          const frame = frames[index] ?? frames[frames.length - 1] ?? 1;
          const timecode = `00:0${index}:0${(frame * 7) % 10}`;
          return (
            <div
              key={index}
              className="relative aspect-square h-[320px] w-[320px] shrink-0 overflow-hidden bg-ink outline outline-1 outline-offset-[3px] outline-[color:var(--color-line)]"
            >
              <Portrait seed={frame - 1} print />
              <span className="absolute left-[10px] top-[8px] font-mono text-[10px] tracking-[0.18em] text-paper/90">
                REC ·
              </span>
              <span className="absolute right-[10px] top-[8px] font-mono text-[10px] tracking-[0.18em] text-paper/75">
                {String(frame).padStart(2, "0")}
              </span>
              <span className="absolute bottom-[8px] right-[10px] font-mono text-[10px] tracking-[0.16em] text-paper/75">
                {timecode}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-1 flex-col px-[40px] pb-[28px] pt-[24px]">
        <div className="flex items-start justify-between gap-[28px] border-b border-[color:var(--color-line)] pb-[18px]">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[9px] uppercase tracking-[0.34em] text-silver-dim">
              Editorial statement · {quote.mood}
            </p>
            <QuoteBlock quote={quote} />
          </div>
          <figure className="flex h-[84px] w-[76px] shrink-0 items-center justify-center border-l border-[color:var(--color-line)] pl-[14px]">
            <img
              src={motif.path}
              width={62}
              height={72}
              alt=""
              aria-hidden="true"
              className="h-[72px] w-[62px] object-contain opacity-60 grayscale contrast-125 mix-blend-multiply"
            />
          </figure>
        </div>

        <div className="mt-[14px] flex items-start justify-between gap-[24px]">
          <div>
            <h1 className="font-display text-[40px] font-semibold leading-[0.9] tracking-[-0.012em]">
              {BRAND}
            </h1>
            <p className="mt-[7px] font-mono text-[9px] uppercase tracking-[0.25em] text-silver-dim">
              {scent.mood.en} / {scent.name} · {scent.destination.en}
            </p>
          </div>
          <div className="text-right">
            <Barcode />
            <p className="mt-[5px] font-mono text-[10px] tracking-[0.24em]">{serial}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuoteBlock({ quote }: { quote: Quote }) {
  const alignment = quote.alignment === "left" ? "text-left" : quote.alignment === "right" ? "text-right" : "text-center";
  const scale = quote.scale === "large" ? 1.08 : quote.scale === "compact" ? 0.88 : 1;
  const lines = quote.lineBreak ?? [quote.text];
  const variant = quote.variant === "sans-caps"
    ? "font-sans font-semibold uppercase tracking-[0.015em]"
    : quote.variant === "sans"
      ? "font-sans font-semibold tracking-[-0.01em]"
      : quote.variant === "serif-italic"
        ? "font-display italic"
        : "font-display";

  return (
    <p
      className={`mt-[8px] text-pretty leading-[0.96] ${alignment} ${variant}`}
      style={{ fontSize: 35 * scale }}
    >
      {lines.map((line) => <span key={line} className="block">{line}</span>)}
    </p>
  );
}

function Barcode() {
  const bars = "41313221423134122143".split("");
  return (
    <div className="flex h-[28px] items-stretch justify-end gap-[2px]" aria-hidden="true">
      {bars.map((width, index) => (
        <span key={index} className="bg-ink" style={{ width: Number(width) * 1.1 }} />
      ))}
    </div>
  );
}
