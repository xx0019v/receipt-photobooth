"use client";

import Portrait from "./Portrait";
import Qr from "./Qr";
import { BRAND, DOMAIN, editionDate, editionTime, type Scent } from "@/app/lib/edition";
import { useLang } from "@/app/lib/i18n";

/**
 * The printed artefact — a wide airline boarding pass on thermal stock
 * (~2.8:1). Three zones: LEFT identity + fragrance + photo stamps, CENTER
 * route + passenger data, RIGHT detachable stub (QR / barcode / serial),
 * split by a vertical perforation. Strict black-on-paper: hierarchy from
 * size / weight / spacing only, so the preview matches real thermal output.
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
    <div className="paper-tex relative flex h-[352px] w-[1000px] text-ink shadow-[0_30px_80px_-38px_rgba(0,0,0,0.7)]">
      <div className="absolute inset-x-0 top-0 z-[5] h-[6px] bg-ink" />

      {/* ============ LEFT — identity + fragrance + stamps ============ */}
      <div className="flex w-[300px] flex-col border-r border-dashed border-[color:var(--color-ink)] px-[26px] pb-[22px] pt-[26px]">
        <p className="font-mono text-[12px] uppercase tracking-[0.26em]">
          {t.pass.title}
        </p>
        {sub && <p className="jp-sub text-[12px] text-silver-dim">{sub.pass.title}</p>}
        <p className="mt-[5px] font-display text-[27px] leading-none">{BRAND}</p>
        <p className="mt-[6px] font-mono text-[10px] uppercase tracking-[0.24em] text-silver-dim">
          {t.pass.airline}
        </p>

        <div className="mt-[16px]">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em]">
            {t.pass.fragrance}
          </p>
          <p className="mt-[5px] font-display text-[23px] leading-[1.0]">
            {scent.mood.en} <span className="italic">/ {scent.name}</span>
          </p>
          <div className="mt-[10px] grid grid-cols-3 gap-[6px]">
            {t.pass.notes.map((tier, i) => (
              <div key={tier}>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-silver-dim">
                  {tier}
                </p>
                <p className="mt-[2px] font-display text-[14px] italic leading-tight">
                  {scent.notes[i].en}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto flex gap-[6px]">
          {frames.map((f) => (
            <div key={f} className="relative h-[76px] w-[76px] overflow-hidden bg-ink">
              <Portrait seed={f - 1} print />
              <span className="absolute bottom-[3px] left-[5px] font-mono text-[9px] text-paper">
                {String(f).padStart(2, "0")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ============ CENTER — route + passenger data ============ */}
      <div className="relative flex flex-1 flex-col px-[30px] pb-[22px] pt-[26px]">
        {/* boarding stamp */}
        <div className="stamp pointer-events-none absolute right-[26px] top-[92px] z-[2] px-[12px] py-[5px] text-center font-mono uppercase leading-tight">
          <span className="block text-[18px] font-bold tracking-[0.14em]">Boarded</span>
          <span className="block text-[10px] tracking-[0.18em]">{editionDate()}</span>
        </div>

        {/* route */}
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-silver-dim">
              {t.pass.from}
            </p>
            <p className="mt-[3px] font-display text-[40px] leading-none">
              {t.pass.fromValue}
            </p>
          </div>
          <div className="mb-[9px] flex-1 px-[18px]">
            <div className="relative h-[18px]">
              <span className="absolute left-0 right-0 top-1/2 border-t border-dashed border-[color:var(--color-ink)]" />
              <span className="paper-tex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-[7px] text-[18px]">
                ✈
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-silver-dim">
              {t.pass.to}
            </p>
            <p className="mt-[3px] font-display text-[40px] leading-none">
              {scent.destination.en}
            </p>
            {sub && <p className="jp-sub text-[12px] text-silver-dim">{scent.destination.jp}</p>}
          </div>
        </div>

        <div className="my-[14px] border-t border-dashed border-[color:var(--color-ink)]" />

        {/* passenger grid */}
        <div className="grid grid-cols-3 gap-x-[18px] gap-y-[12px]">
          <Field label={t.pass.passenger} value={t.pass.passengerValue} />
          <Field label={t.pass.flight} value={scent.code} />
          <Field label={t.pass.gate} value={t.pass.gateValue} />
          <Field label={t.pass.seat} value={seat} />
          <Field label={t.pass.boarding} value={stamp} />
          <Field label={t.pass.date} value={editionDate()} />
        </div>

        <p className="mt-auto font-display text-[18px] italic leading-tight">
          “{scent.phrase.en}”
        </p>
        <p className="mt-[6px] font-mono text-[10px] uppercase tracking-[0.28em]">
          {t.pass.closing}
          {sub && <span className="jp-sub ml-[10px] text-[10px] normal-case">{sub.pass.closing}</span>}
        </p>
      </div>

      {/* ============ PERFORATION ============ */}
      <div className="relative w-0">
        <span className="absolute left-1/2 top-[-11px] h-[22px] w-[22px] -translate-x-1/2 rounded-full bg-[color:var(--color-paper)]" />
        <span className="absolute bottom-[-11px] left-1/2 h-[22px] w-[22px] -translate-x-1/2 rounded-full bg-[color:var(--color-paper)]" />
        <span className="absolute bottom-[14px] left-1/2 top-[14px] border-l-2 border-dashed border-[color:var(--color-ink)] opacity-70" />
      </div>

      {/* ============ RIGHT — detachable stub ============ */}
      <div className="flex w-[212px] flex-col px-[20px] pb-[18px] pt-[26px]">
        <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.22em]">
          <span>{t.pass.stub}</span>
          <span>{scent.code}</span>
        </div>

        <div className="mt-[12px] flex items-start gap-[12px]">
          <div className="border border-[color:var(--color-ink)] p-[6px]">
            <Qr cell={4} seed={hashSeed(serial)} />
          </div>
          <div className="flex flex-1 flex-col gap-[6px]">
            <StubCell label={t.pass.gate} value={t.pass.gateValue} />
            <StubCell label={t.pass.seat} value={seat} />
          </div>
        </div>

        <Barcode />
        <p className="mt-[6px] text-center font-mono text-[12px] tracking-[0.22em]">{serial}</p>

        <p className="mt-auto pt-[8px] text-center font-display text-[15px] italic leading-tight">
          {t.pass.keep}
        </p>
        <p className="mt-[3px] text-center font-mono text-[8px] uppercase tracking-[0.22em] text-silver-dim">
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
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-silver-dim">
        {label}
      </p>
      <p className="mt-[3px] font-mono text-[18px] font-bold uppercase tracking-[0.02em]">
        {value}
      </p>
    </div>
  );
}

function StubCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[color:var(--color-ink)] px-[9px] py-[5px] font-mono uppercase">
      <p className="text-[8px] tracking-[0.16em] text-silver-dim">{label}</p>
      <p className="mt-[1px] text-[14px] font-bold">{value}</p>
    </div>
  );
}

function Barcode() {
  const bars = "413132214231341221432312143132421334".split("");
  return (
    <div className="mt-[12px] flex h-[46px] items-stretch justify-center gap-[2px]">
      {bars.map((w, i) => (
        <span key={i} className="bg-ink" style={{ width: Number(w) * 1.2 }} />
      ))}
    </div>
  );
}
