"use client";

import Portrait from "./Portrait";
import {
  getQuoteLayoutVariant,
  type FilmArtifactProps,
} from "@/app/lib/film";
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
  selectedQuote,
  selectedChromeMotif,
  selectedScent,
  scentNotes,
  scentMood,
  scentDestination,
  serial,
  issueDate,
  edition,
}: FilmArtifactProps) {
  const layout = getQuoteLayoutVariant(selectedQuote);
  const isLong = layout === "long";
  const editionRun = deriveRun(serial);
  const year = romanYear(issueDate);

  return (
    <div
      className="paper-tex relative flex h-[1280px] w-[640px] flex-col overflow-hidden text-ink"
      data-scent-notes={scentNotes.join(" | ")}
      data-quote-layout={layout}
    >
      {/* ---- Masthead --------------------------------------------------- */}
      <header className="pt-[62px] text-center">
        <h1 className="font-display text-[74px] font-normal uppercase leading-[0.9] tracking-[0.16em]">
          FILM
        </h1>
        <p className="mt-[17px] font-mono text-[13px] uppercase tracking-[0.52em] text-silver-dim">
          Scent · Photo
        </p>
      </header>

      {/* ---- Body : photo column (left) + quote / motif (right) --------- */}
      <div className="relative mt-[46px] flex flex-1 items-start px-[46px]">
        <div className="flex flex-col gap-[14px]">
          {[0, 1, 2].map((index) => {
            const frame = frames[index] ?? frames[frames.length - 1] ?? index + 1;
            return (
              <div
                key={index}
                className="relative h-[288px] w-[288px] shrink-0 overflow-hidden bg-ink"
              >
                <Portrait seed={frame - 1} print />
                <span className="pointer-events-none absolute inset-0 border border-[color:var(--color-line)]" />
              </div>
            );
          })}
        </div>

        {/* right margin — the editorial breathing room */}
        <div className="relative flex-1 self-stretch">
          {/* the same motif, blown up and barely-there — a secondary echo that
              gives the margin depth without competing with the primary orb or
              the photographs */}
          <img
            src={selectedChromeMotif.path}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -right-[140px] top-[210px] h-[420px] w-[420px] object-contain opacity-[0.038] grayscale"
          />

          {/* cropped chrome motif — an orb read through a circular window,
              not a pasted SVG icon */}
          <figure
            aria-hidden="true"
            className="absolute right-0 top-[8px] h-[82px] w-[82px] overflow-hidden rounded-full shadow-[inset_0_2px_6px_rgba(0,0,0,0.28),inset_0_-4px_10px_rgba(0,0,0,0.14)]"
          >
            <img
              src={selectedChromeMotif.path}
              alt=""
              className="absolute left-1/2 top-1/2 h-[150%] w-[150%] -translate-x-1/2 -translate-y-1/2 object-cover grayscale contrast-[1.2] brightness-[1.02]"
            />
            <span className="absolute left-[22%] top-[16%] h-[22px] w-[22px] rounded-full bg-white/55 blur-[3px]" />
          </figure>

          {/* vertical editorial quote — reads bottom-to-top, down the margin */}
          {!isLong && (
            <div className="absolute inset-x-0 bottom-0 top-[112px] flex items-center justify-center">
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
      <footer className="px-[46px] pb-[46px]">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-silver-dim">
          {scentMood} · {scentNotes.join(" · ")}
        </p>

        <div className="mt-[16px] h-px w-full bg-[color:var(--color-line)]" />

        <dl className="mt-[16px] grid grid-cols-4 gap-x-[16px]">
          <Meta label="Issue" value={edition || "—"} />
          <Meta label="Edition" value={editionRun} />
          <Meta label="Serial" value={serial} />
          <Meta label="Scent" value={selectedScent.name} />
        </dl>

        <p className="mt-[26px] text-center font-mono text-[11px] uppercase tracking-[0.36em] text-ink-soft">
          {isLong
            ? selectedQuote.text
            : "Captured by Film, remembered by Scent."}
        </p>

        <div className="mt-[22px] flex items-end justify-between">
          <span className="font-display text-[22px] uppercase tracking-[0.14em]">
            FILM
          </span>
          <Barcode />
          <span className="font-mono text-[13px] tracking-[0.24em] text-silver-dim">
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
