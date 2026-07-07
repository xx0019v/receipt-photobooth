"use client";

import Portrait from "./Portrait";
import Qr from "./Qr";
import { BRAND, DOMAIN, editionDate, editionTime, issueNo, type Scent } from "@/app/lib/edition";
import { useLang } from "@/app/lib/i18n";

/**
 * Alternate printed artefact: a fashion-magazine cover in the register of
 * VOGUE / ELLE / Harper's BAZAAR — Didone masthead, full-bleed portrait,
 * coverlines, cover barcode. Still strict black-on-thermal-paper.
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
  const { t, sub } = useLang();
  const stamp = time ?? editionTime();
  const hero = frames[Math.min(1, frames.length - 1)] ?? 1;

  return (
    <div className="paper-tex relative flex h-[900px] w-[640px] flex-col text-ink shadow-[0_30px_80px_-38px_rgba(0,0,0,0.7)]">
      {/* masthead */}
      <div className="px-[40px] pt-[34px]">
        <div className="flex items-center justify-between font-mono text-[12px] uppercase tracking-[0.32em] text-silver-dim">
          <span>{issueNo()}</span>
          <span>{editionDate()}</span>
        </div>
        <h1 className="mt-[6px] text-center font-display text-[92px] font-semibold leading-[0.82] tracking-[-0.02em]">
          {BRAND}
        </h1>
        <div className="mt-[8px] flex items-center gap-[14px]">
          <span className="h-px flex-1 bg-ink" />
          <span className="font-mono text-[12px] uppercase tracking-[0.4em]">
            Scent Memory Edition
          </span>
          <span className="h-px flex-1 bg-ink" />
        </div>
      </div>

      {/* hero portrait + coverlines (on paper knockouts so they read on any photo) */}
      <div className="relative mx-[40px] mt-[18px] flex-1 overflow-hidden border border-[color:var(--color-ink)] bg-ink">
        <Portrait seed={hero - 1} print />

        {/* headline — top-left knockout */}
        <div className="pointer-events-none absolute left-[18px] top-[18px] bg-paper-bright/95 px-[16px] py-[12px]">
          <p className="font-mono text-[12px] uppercase tracking-[0.3em]">
            {scent.code} · {t.pass.gateValue}
          </p>
          <p className="mt-[3px] font-display text-[52px] font-semibold uppercase leading-[0.84]">
            {scent.mood.en}
          </p>
          <p className="font-display text-[26px] italic leading-none">/ {scent.name}</p>
        </div>

        {/* destination — top-right knockout */}
        <div className="pointer-events-none absolute right-[18px] top-[18px] bg-paper-bright/95 px-[16px] py-[12px] text-right">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-silver-dim">
            {t.pass.to}
          </p>
          <p className="font-display text-[34px] italic leading-[0.9]">
            {scent.destination.en}
          </p>
        </div>

        {/* coverlines — bottom-left knockout */}
        <div className="pointer-events-none absolute bottom-[18px] left-[18px] max-w-[420px] bg-paper-bright/95 px-[16px] py-[12px]">
          <p className="font-display text-[24px] italic leading-[1.12]">
            “{scent.phrase.en}”
          </p>
          <p className="mt-[8px] font-mono text-[12px] uppercase tracking-[0.22em]">
            {scent.notes.map((n) => n.en).join(" · ")}
          </p>
          <p className="mt-[2px] font-mono text-[11px] uppercase tracking-[0.22em] text-silver-dim">
            {stamp} · {editionDate()}
          </p>
        </div>
      </div>

      {/* bottom bar — barcode + meta */}
      <div className="flex items-end justify-between px-[40px] pb-[30px] pt-[18px]">
        <div>
          <Barcode />
          <p className="mt-[6px] font-mono text-[12px] tracking-[0.24em]">{serial}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[13px] uppercase tracking-[0.28em]">
            {t.pass.closing}
          </p>
          {sub && <p className="jp-sub mt-[2px] text-[12px] text-silver-dim">{sub.pass.closing}</p>}
          <div className="mt-[8px] flex items-center justify-end gap-[10px]">
            <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-silver-dim">
              {DOMAIN}
            </span>
            <div className="border border-[color:var(--color-ink)] p-[5px]">
              <Qr cell={3} seed={hashSeed(serial)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function hashSeed(s: string): number {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0x7fffffff;
  return h || 7;
}

function Barcode() {
  const bars = "4131322142313412214323121431".split("");
  return (
    <div className="flex h-[44px] items-stretch gap-[2px]">
      {bars.map((w, i) => (
        <span key={i} className="bg-ink" style={{ width: Number(w) * 1.3 }} />
      ))}
    </div>
  );
}
