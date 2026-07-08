"use client";

import Portrait from "./Portrait";
import { BRAND, editionDate, editionTime, issueNo, type Scent } from "@/app/lib/edition";
import { useLang } from "@/app/lib/i18n";

/**
 * Alternate printed artefact: a calm fashion-magazine cover (VOGUE / ELLE /
 * Harper's BAZAAR register). Didone masthead, a clean triptych of the three
 * tall captures (never covered by copy), then quiet coverlines and a cover
 * barcode. Strict black-on-thermal-paper. No QR — the pass carries that.
 */
export default function MagazineCover({
  frames,
  scent,
  serial,
  time,
}: {
  frames: number[];
  scent: Scent;
  serial: string;
  time?: string;
}) {
  const { t } = useLang();
  const stamp = time ?? editionTime();

  return (
    <div className="paper-tex relative flex h-[900px] w-[640px] flex-col text-ink shadow-[0_30px_80px_-38px_rgba(0,0,0,0.7)]">
      {/* ─── masthead ─── */}
      <div className="px-[44px] pt-[38px]">
        <div className="flex items-center justify-between font-mono text-[12px] uppercase tracking-[0.32em] text-silver-dim">
          <span>{issueNo()}</span>
          <span>{editionDate()}</span>
        </div>
        <h1 className="mt-[6px] text-center font-display text-[96px] font-semibold leading-[0.78] tracking-[-0.025em]">
          {BRAND}
        </h1>
        <div className="mt-[10px] flex items-center gap-[16px]">
          <span className="h-px flex-1 bg-ink" />
          <span className="font-mono text-[12px] uppercase tracking-[0.44em]">
            Scent Memory Edition
          </span>
          <span className="h-px flex-1 bg-ink" />
        </div>
      </div>

      {/* ─── triptych — three tall frames, fully visible ─── */}
      <div className="mx-[44px] mt-[26px] flex h-[452px] border border-[color:var(--color-ink)]">
        {[0, 1, 2].map((i) => {
          const f = frames[i] ?? frames[frames.length - 1] ?? 1;
          return (
            <div
              key={i}
              className="relative h-full flex-1 overflow-hidden bg-ink [&:not(:first-child)]:border-l [&:not(:first-child)]:border-paper"
            >
              <Portrait seed={f - 1} print />
              <span className="absolute left-0 top-0 bg-paper-bright px-[8px] py-[3px] font-mono text-[10px] tracking-[0.16em]">
                {String(f).padStart(2, "0")}
              </span>
            </div>
          );
        })}
      </div>

      {/* ─── quiet coverlines, below the photos (never overlapping) ─── */}
      <div className="mt-[24px] flex-1 px-[44px]">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-[64px] font-semibold uppercase leading-[0.78] tracking-[-0.02em]">
            {scent.mood.en}
          </h2>
          <p className="font-mono text-[12px] uppercase tracking-[0.28em] text-silver-dim">
            {t.pass.to} {scent.destination.en}
          </p>
        </div>
        <p className="mt-[6px] font-display text-[24px] italic leading-none text-silver-dim">
          / {scent.name}
        </p>
        <p className="mt-[22px] font-mono text-[13px] uppercase tracking-[0.26em]">
          {scent.notes.map((n) => n.en).join("   ·   ")}
        </p>
      </div>

      {/* ─── bottom bar — barcode + closing (no QR) ─── */}
      <div className="flex items-end justify-between px-[44px] pb-[34px]">
        <div>
          <Barcode />
          <p className="mt-[7px] font-mono text-[12px] tracking-[0.26em]">{serial}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[12px] uppercase tracking-[0.28em]">
            {t.pass.closing}
          </p>
          <p className="mt-[3px] font-mono text-[11px] uppercase tracking-[0.22em] text-silver-dim">
            {stamp} · {editionDate()}
          </p>
        </div>
      </div>
    </div>
  );
}

function Barcode() {
  const bars = "4131322142313412214323121431".split("");
  return (
    <div className="flex h-[46px] items-stretch gap-[2px]">
      {bars.map((w, i) => (
        <span key={i} className="bg-ink" style={{ width: Number(w) * 1.4 }} />
      ))}
    </div>
  );
}
