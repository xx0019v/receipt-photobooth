"use client";

import CapturedPhoto from "./CapturedPhoto";
import {
  getQuoteLayoutVariant,
  type FilmArtifactProps,
} from "@/app/lib/film";
import { editionForScent } from "@/app/lib/edition";
import type { Quote } from "@/app/lib/quotes";

/**
 * FILM — SCENT · PHOTO. A collectible gallery print rebuilt in React/CSS/SVG
 * from the reference art direction (never pasted as an image): a Didone
 * masthead, three square captures stacked slightly left of centre, a single
 * editorial quote set vertically down the right margin, one cropped chrome
 * motif, a metadata rule, an editorial statement, and a barcode. Strict
 * monochrome, thermal-safe, no QR.
 *
 * Fixed artefact size 640×1280 so Format / Review / Printing / Done can scale
 * one identical piece.
 */
export default function MagazineCover({
  frames,
  frameSources,
  selectedQuote,
  selectedChromeMotif,
  selectedScent,
  scentNotes,
  serial,
  issueDate,
  edition,
}: FilmArtifactProps) {
  const layout = getQuoteLayoutVariant(selectedQuote);
  const isLong = layout === "long";
  const editionRun = deriveRun(serial);
  const year = romanYear(issueDate);
  const ed = editionForScent(selectedScent);

  return (
    <div
      className="paper-tex relative flex h-[1280px] w-[640px] flex-col overflow-hidden text-ink"
      data-scent-notes={scentNotes.join(" | ")}
      data-quote-layout={layout}
    >
      {/* ---- Masthead --------------------------------------------------- */}
      <header className="pt-[44px] text-center">
        <h1 className="font-display text-[74px] font-normal uppercase leading-[0.9] tracking-[0.16em]">
          FILM
        </h1>
        <p className="mt-[16px] font-mono text-[13px] uppercase tracking-[0.52em] text-silver-dim">
          Edition · Print
        </p>
      </header>

      {/* ---- Body : photo column (left) + quote / motif (right) --------- */}
      <div className="relative mt-[30px] flex flex-1 items-start px-[46px]">
        <div className="flex flex-col gap-[14px]">
          {[0, 1, 2].map((index) => {
            const frame = frames[index] ?? frames[frames.length - 1] ?? index + 1;
            return (
              <div
                key={index}
                className="relative h-[288px] w-[288px] shrink-0 overflow-hidden bg-ink"
              >
                <CapturedPhoto
                  src={frameSources?.[frame]}
                  seed={frame - 1}
                  print
                />
                <span className="pointer-events-none absolute inset-0 border border-[color:var(--color-line)]" />
              </div>
            );
          })}
        </div>

        {/* right margin — the editorial breathing room */}
        <div className="relative flex-1 self-stretch">
          {/* a thin registration line gives the margin depth — non-figurative,
              so the session motif is drawn exactly once (the orb below) */}
          <span
            aria-hidden="true"
            className="absolute right-[6px] top-[120px] bottom-[8px] w-px bg-[color:var(--color-line-soft)]"
          />

          {/* The selected ACUSE mark: large enough to survive 1-bit print. */}
          <figure
            aria-hidden="true"
            className="absolute right-0 top-0 h-[154px] w-[154px] overflow-hidden border border-[color:var(--color-line)] bg-paper-bright"
          >
            <img
              src={selectedChromeMotif.path}
              alt=""
              width={138}
              height={138}
              className="absolute inset-[8px] h-[calc(100%-16px)] w-[calc(100%-16px)] object-contain grayscale contrast-125 mix-blend-multiply"
            />
          </figure>

          {/* vertical editorial quote — reads bottom-to-top, down the margin */}
          {!isLong && (
            <div className="absolute inset-x-0 bottom-0 top-[180px] flex items-center justify-center">
              <span
                className="whitespace-nowrap font-display uppercase leading-none tracking-[0.06em] text-ink"
                style={{
                  transform: "rotate(-90deg)",
                  fontSize: layout === "short" ? 60 : 40,
                }}
              >
                {selectedQuote.text.replace(/\.$/, "")}
                <span className="text-silver-dim">.</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ---- Footer : notes · metadata · statement · barcode ------------ */}
      <footer className="px-[46px] pb-[38px]">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-silver-dim">
          {ed.code} — {ed.character.en}
        </p>

        <div className="mt-[14px] h-px w-full bg-[color:var(--color-line)]" />

        <dl className="mt-[12px] grid grid-cols-4 gap-x-[14px]">
          <Meta label="Issued" value={issueDate || "—"} />
          <Meta label="Run" value={editionRun} />
          <Meta label="Serial" value={serial} />
          <Meta label="Edition" value={ed.code} />
        </dl>

        <p className="mt-[16px] text-center font-mono text-[11px] uppercase tracking-[0.34em] text-ink-soft">
          {isLong ? selectedQuote.text : "Captured, composed, issued."}
        </p>

        <div className="mt-[14px] flex items-end justify-between">
          <span className="font-display text-[22px] uppercase tracking-[0.14em]">
            FILM
          </span>
          <Barcode />
          <span className="text-right font-mono text-[10px] leading-[1.5] tracking-[0.2em] text-silver-dim">
            {edition || "—"}
            <br />
            {year}
          </span>
        </div>
      </footer>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="font-mono text-[9px] uppercase tracking-[0.32em] text-silver-dim">
        {label}
      </dt>
      <dd className="mt-[5px] truncate font-mono text-[13px] uppercase tracking-[0.08em] text-ink">
        {value}
      </dd>
    </div>
  );
}

function Barcode() {
  const bars = "413132214231341221433142".split("");
  return (
    <div
      className="flex h-[34px] items-stretch justify-center gap-[2px]"
      aria-hidden="true"
    >
      {bars.map((width, index) => (
        <span
          key={index}
          className="bg-ink"
          style={{ width: Number(width) * 1.15 }}
        />
      ))}
    </div>
  );
}

/** A collectible print-run number, deterministic from the fixed serial. */
function deriveRun(serial: string): string {
  const digits = serial.replace(/\D/gu, "");
  if (!digits) return "01 / 100";
  const run = (parseInt(digits.slice(-4), 10) % 100) + 1;
  return `${String(run).padStart(2, "0")} / 100`;
}

/** Roman-numeral year lifted from the fixed issue date, e.g. MMXXVI. */
function romanYear(issueDate: string): string {
  const match = issueDate.match(/(\d{4})/u);
  const year = match ? parseInt(match[1], 10) : 0;
  if (!year) return "";
  const map: [number, string][] = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let n = year;
  let out = "";
  for (const [value, symbol] of map) {
    while (n >= value) {
      out += symbol;
      n -= value;
    }
  }
  return out;
}
