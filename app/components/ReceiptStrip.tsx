"use client";

import Portrait from "./Portrait";
import Qr from "./Qr";
import { BRAND, DOMAIN, editionDate, editionTime, type Scent } from "@/app/lib/edition";
import { useLang } from "@/app/lib/i18n";

/**
 * The printed artefact — a landscape airline boarding pass on thermal stock.
 * Main section left, detachable stub right, vertical perforation between.
 * Strict black-on-paper: hierarchy comes from size/weight/spacing, never grey,
 * so the screen preview matches what a thermal head can actually print.
 */
export default function ReceiptStrip({
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
  const seat = String(frames.length).padStart(2, "0");

  return (
    <div className="paper-tex relative flex w-[920px] text-ink shadow-[0_30px_80px_-40px_rgba(0,0,0,0.6)]">
      {/* airline accent stripe */}
      <div className="absolute inset-x-0 top-0 z-[5] h-[6px] bg-ink" />

      {/* ============ MAIN SECTION ============ */}
      <div className="relative flex-1 px-[34px] pb-[24px] pt-[30px]">
        {/* boarding stamp */}
        <div className="stamp pointer-events-none absolute right-[20px] top-[128px] z-[2] px-[14px] py-[6px] text-center font-mono uppercase leading-tight">
          <span className="block text-[20px] font-bold tracking-[0.16em]">Boarded</span>
          <span className="block text-[11px] tracking-[0.2em]">{editionDate()}</span>
        </div>

        {/* header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-[13px] uppercase tracking-[0.3em]">
              {t.pass.title}
              {sub && <span className="jp-sub ml-[12px] text-[12px] normal-case">{sub.pass.title}</span>}
            </p>
            <p className="mt-[6px] font-display text-[30px] leading-none">{BRAND}</p>
          </div>
          <div className="flex items-center gap-[12px]">
            <span className="font-mono text-[11px] uppercase tracking-[0.26em]">
              {t.pass.airline}
            </span>
            <span className="flex h-[42px] w-[42px] items-center justify-center border border-[color:var(--color-ink)] font-display text-[19px]">
              TR
            </span>
          </div>
        </div>

        <Rule className="my-[16px]" />

        {/* route */}
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-[12px] uppercase tracking-[0.26em]">{t.pass.from}</p>
            <p className="mt-[4px] font-display text-[44px] leading-none">{t.pass.fromValue}</p>
          </div>
          <div className="mb-[10px] flex-1 px-[16px]">
            <div className="relative h-[20px]">
              <span className="absolute left-0 right-0 top-1/2 border-t border-dashed border-[color:var(--color-ink)]" />
              <span className="paper-tex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-[8px] text-[19px]">
                ✈
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono text-[12px] uppercase tracking-[0.26em]">{t.pass.to}</p>
            <p className="mt-[4px] font-display text-[44px] leading-none">
              {scent.destination.en}
            </p>
            {sub && (
              <p className="jp-sub mt-[3px] text-[13px]">{scent.destination.jp}</p>
            )}
          </div>
        </div>

        <Rule className="my-[16px]" />

        {/* info grid */}
        <div className="grid grid-cols-3 gap-x-[18px] gap-y-[12px]">
          <Field label={t.pass.passenger} value={t.pass.passengerValue} />
          <Field label={t.pass.flight} value={scent.code} />
          <Field label={t.pass.gate} value={t.pass.gateValue} />
          <Field label={t.pass.seat} value={seat} />
          <Field label={t.pass.boarding} value={stamp} />
          <Field label={t.pass.date} value={editionDate()} />
        </div>

        <Rule className="my-[16px]" />

        {/* fragrance + stamps */}
        <div className="flex items-start gap-[22px]">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[12px] uppercase tracking-[0.3em]">
              {t.pass.fragrance}
            </p>
            <p className="mt-[6px] font-display text-[27px] leading-[1.02]">
              {scent.mood.en} <span className="italic">/ {scent.name}</span>
            </p>
            <div className="mt-[12px] grid grid-cols-3 gap-[6px]">
              {t.pass.notes.map((tier, i) => (
                <div key={tier}>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em]">{tier}</p>
                  <p className="mt-[3px] font-display text-[16px] italic leading-tight">
                    {scent.notes[i].en}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex shrink-0 gap-[6px]">
            {frames.map((f) => (
              <div key={f} className="relative h-[112px] w-[112px] overflow-hidden bg-ink">
                <Portrait seed={f - 1} print />
                <span className="absolute bottom-[4px] left-[6px] font-mono text-[10px] tracking-[0.1em] text-paper">
                  {String(f).padStart(2, "0")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* phrase + closing */}
        <p className="mt-[16px] text-center font-display text-[21px] italic leading-[1.2]">
          “{scent.phrase.en}”
        </p>
        <p className="mt-[12px] text-center font-mono text-[11px] uppercase tracking-[0.3em]">
          {t.pass.closing}
          {sub && <span className="jp-sub ml-[12px] text-[11px] normal-case">{sub.pass.closing}</span>}
        </p>
      </div>

      {/* ============ PERFORATION ============ */}
      <div className="relative w-[0px]">
        <span className="paper-round absolute left-1/2 top-[-12px] h-[24px] w-[24px] -translate-x-1/2 rounded-full bg-[color:var(--color-paper)]" />
        <span className="absolute bottom-[-12px] left-1/2 h-[24px] w-[24px] -translate-x-1/2 rounded-full bg-[color:var(--color-paper)]" />
        <span className="absolute bottom-[16px] left-1/2 top-[16px] border-l-2 border-dashed border-[color:var(--color-ink)] opacity-60" />
      </div>

      {/* ============ STUB ============ */}
      <div className="relative flex w-[240px] flex-col px-[22px] pb-[20px] pt-[30px]">
        <div className="flex items-baseline justify-between font-mono text-[11px] uppercase tracking-[0.24em]">
          <span>{t.pass.stub}</span>
          <span>{scent.code}</span>
        </div>

        <div className="mt-[14px] flex flex-col gap-[8px]">
          <StubCell label={t.pass.gate} value={t.pass.gateValue} />
          <StubCell label={t.pass.seat} value={seat} />
          <StubCell label={t.pass.boarding} value={stamp} />
        </div>

        <div className="mt-[16px] flex flex-col items-center">
          <div className="border border-[color:var(--color-ink)] p-[8px]">
            <Qr cell={5} seed={hashSeed(serial)} />
          </div>
          <p className="mt-[8px] font-mono text-[13px] tracking-[0.24em]">{serial}</p>
        </div>

        <Barcode />

        <p className="mt-auto pt-[10px] text-center font-display text-[16px] italic leading-tight">
          {t.pass.keep}
        </p>
        <p className="mt-[4px] text-center font-mono text-[9px] uppercase tracking-[0.24em]">
          {DOMAIN}
        </p>
      </div>
    </div>
  );
}

function hashSeed(s: string): number {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0x7fffffff;
  return h || 7;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.2em]">{label}</p>
      <p className="mt-[3px] font-mono text-[19px] uppercase tracking-[0.02em] font-bold">
        {value}
      </p>
    </div>
  );
}

function StubCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[color:var(--color-ink)] px-[10px] py-[7px] font-mono uppercase">
      <p className="text-[9px] tracking-[0.18em]">{label}</p>
      <p className="mt-[2px] text-[16px] font-bold tracking-[0.04em]">{value}</p>
    </div>
  );
}

function Rule({ className = "" }: { className?: string }) {
  return (
    <div className={`border-t border-dashed border-[color:var(--color-ink)] ${className}`} />
  );
}

function Barcode() {
  const bars = "41313221423134122143231214313242".split("");
  return (
    <div className="mt-[14px] flex h-[54px] items-stretch justify-center gap-[2px]">
      {bars.map((w, i) => (
        <span key={i} className="bg-ink" style={{ width: Number(w) * 1.5 }} />
      ))}
    </div>
  );
}
