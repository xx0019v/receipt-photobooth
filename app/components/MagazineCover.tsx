"use client";

import Portrait from "./Portrait";
import { BRAND, editionDate, editionTime, issueNo, type Scent } from "@/app/lib/edition";
import { useLang } from "@/app/lib/i18n";

/**
 * Alternate printed artefact — "the film" register: a photobooth strip blown
 * up to cover format. Three full-width frames stacked like film, quiet
 * REC/timecode overlays, and the wordmark at the bottom (photos are the
 * hero). Strict black-on-thermal-paper. No QR — the pass carries that.
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
      {/* top meta */}
      <div className="flex items-center justify-between border-b border-[color:var(--color-line)] px-[36px] pb-[16px] pt-[28px] font-mono text-[10px] uppercase tracking-[0.32em] text-silver-dim">
        <span>{issueNo()}</span>
        <span>{scent.code}</span>
        <span>{editionDate()}</span>
      </div>

      {/* ─── the strip — three full-width frames, the hero ─── */}
      <div className="mx-[36px] mt-[18px] flex flex-1 flex-col gap-[7px]">
        {[0, 1, 2].map((i) => {
          const f = frames[i] ?? frames[frames.length - 1] ?? 1;
          const tc = `00:0${i}:0${(f * 7) % 10}`;
          return (
            <div
              key={i}
              className="relative min-h-0 flex-1 overflow-hidden bg-ink outline outline-1 outline-offset-[3px] outline-[color:var(--color-line)]"
            >
              <Portrait seed={f - 1} print />
              {/* quiet camcorder overlays */}
              <span className="absolute left-[10px] top-[8px] font-mono text-[10px] tracking-[0.18em] text-paper/90">
                REC ·
              </span>
              <span className="absolute right-[10px] top-[8px] font-mono text-[10px] tracking-[0.18em] text-paper/70">
                {String(f).padStart(2, "0")}
              </span>
              <span className="absolute bottom-[8px] right-[10px] font-mono text-[10px] tracking-[0.16em] text-paper/70">
                {tc}
              </span>
            </div>
          );
        })}
      </div>

      {/* ─── wordmark at the bottom — THEFILM register ─── */}
      <div className="px-[40px] pb-[34px] pt-[26px] text-center">
        <h1 className="font-display text-[50px] font-semibold leading-[0.94] tracking-[-0.008em]">
          {BRAND}
        </h1>
        <div className="mt-[14px] flex items-center justify-center gap-[14px]">
          <span className="h-px w-[56px] bg-ink" />
          <p className="font-mono text-[10px] uppercase tracking-[0.4em]">
            Beyond the photo booth
          </p>
          <span className="h-px w-[56px] bg-ink" />
        </div>

        <p className="mt-[20px] font-mono text-[10px] uppercase tracking-[0.24em] text-silver-dim">
          {scent.mood.en} / {scent.name} · {t.pass.to} {scent.destination.en} · {stamp}
        </p>

        <div className="mt-[22px] flex items-end justify-between border-t border-[color:var(--color-line)] pt-[18px]">
          <div className="text-left">
            <Barcode />
            <p className="mt-[6px] font-mono text-[11px] tracking-[0.24em]">{serial}</p>
          </div>
          <p className="pb-[4px] font-mono text-[10px] uppercase tracking-[0.24em]">
            {t.pass.closing}
          </p>
        </div>
      </div>
    </div>
  );
}

function Barcode() {
  const bars = "41313221423134122143".split("");
  return (
    <div className="flex h-[30px] items-stretch gap-[2px]">
      {bars.map((w, i) => (
        <span key={i} className="bg-ink" style={{ width: Number(w) * 1.3 }} />
      ))}
    </div>
  );
}
