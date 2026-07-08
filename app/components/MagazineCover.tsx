"use client";

import Portrait from "./Portrait";
import Qr from "./Qr";
import { BRAND, DOMAIN, editionDate, editionTime, issueNo, type Scent } from "@/app/lib/edition";
import { useLang } from "@/app/lib/i18n";

/**
 * Alternate printed artefact: a fashion-magazine cover in the register of
 * VOGUE / ELLE / Harper's BAZAAR — a Didone masthead over a triptych of three
 * tall portrait frames (the three captures), coverlines on paper knockouts,
 * cover barcode + QR. Strict black-on-thermal-paper.
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

  return (
    <div className="paper-tex relative flex h-[900px] w-[640px] flex-col text-ink shadow-[0_30px_80px_-38px_rgba(0,0,0,0.7)]">
      {/* ─── masthead ─── */}
      <div className="px-[40px] pt-[34px]">
        <div className="flex items-center justify-between font-mono text-[12px] uppercase tracking-[0.32em] text-silver-dim">
          <span>{issueNo()}</span>
          <span>{editionDate()}</span>
        </div>
        <h1 className="mt-[4px] text-center font-display text-[94px] font-semibold leading-[0.8] tracking-[-0.025em]">
          {BRAND}
        </h1>
        <div className="mt-[8px] flex items-center gap-[14px]">
          <span className="h-px flex-1 bg-ink" />
          <span className="font-mono text-[12px] uppercase tracking-[0.42em]">
            Scent Memory Edition
          </span>
          <span className="h-px flex-1 bg-ink" />
        </div>
      </div>

      {/* ─── triptych of three tall frames ─── */}
      <div className="relative mx-[40px] mt-[16px] flex-1 overflow-hidden border border-[color:var(--color-ink)] bg-ink">
        <div className="flex h-full w-full">
          {[0, 1, 2].map((i) => {
            const f = frames[i] ?? frames[frames.length - 1] ?? 1;
            return (
              <div
                key={i}
                className="relative h-full flex-1 overflow-hidden [&:not(:first-child)]:border-l [&:not(:first-child)]:border-paper/70"
              >
                <Portrait seed={f - 1} print />
                {/* per-frame editorial caption, CONCEIT-style */}
                <span className="absolute left-[8px] top-[8px] bg-paper-bright/95 px-[7px] py-[3px] font-mono text-[10px] tracking-[0.14em]">
                  {String(f).padStart(2, "0")}
                </span>
                <span className="absolute bottom-[8px] left-[8px] font-mono text-[9px] tracking-[0.1em] text-paper/85">
                  {scent.code}
                </span>
              </div>
            );
          })}
        </div>

        {/* destination — top-right knockout */}
        <div className="pointer-events-none absolute right-[10px] top-[10px] max-w-[210px] bg-paper-bright/95 px-[12px] py-[8px] text-right">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-silver-dim">
            {t.pass.to}
          </p>
          <p className="mt-[1px] font-display text-[24px] italic leading-[0.95]">
            {scent.destination.en}
          </p>
        </div>

        {/* dominant coverline — one knockout anchoring the bottom */}
        <div className="pointer-events-none absolute inset-x-[10px] bottom-[10px] bg-paper-bright/96 px-[22px] pb-[16px] pt-[18px]">
          <p className="font-display text-[60px] font-semibold uppercase leading-[0.8] tracking-[-0.015em]">
            {scent.mood.en}
          </p>
          <p className="mt-[2px] font-display text-[22px] italic leading-none text-silver-dim">
            / {scent.name}
          </p>
          <p className="mt-[14px] max-w-[460px] font-display text-[20px] italic leading-[1.2]">
            “{scent.phrase.en}”
          </p>
          <span className="mt-[12px] block h-px bg-[color:var(--color-ink)]/25" />
          <div className="mt-[9px] flex items-center justify-between gap-[16px]">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em]">
              {scent.notes.map((n) => n.en).join("  ·  ")}
            </p>
            <p className="shrink-0 font-mono text-[10px] uppercase tracking-[0.22em] text-silver-dim">
              {stamp}
            </p>
          </div>
        </div>
      </div>

      {/* ─── bottom bar — barcode + closing + QR ─── */}
      <div className="flex items-end px-[40px] pb-[30px] pt-[16px]">
        <div>
          <Barcode />
          <p className="mt-[6px] font-mono text-[12px] tracking-[0.24em]">{serial}</p>
        </div>
        <span className="mx-auto h-[44px] w-px self-end bg-[color:var(--color-ink)]/20" />
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
