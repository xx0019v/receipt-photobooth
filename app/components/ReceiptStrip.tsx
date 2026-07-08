"use client";

import Portrait from "./Portrait";
import Qr from "./Qr";
import { BRAND, DOMAIN, editionDate, editionTime, type Scent } from "@/app/lib/edition";
import { useLang } from "@/app/lib/i18n";

/**
 * The printed artefact — a wide airline boarding pass on thermal stock
 * (1000×560, still clearly landscape). Three zones:
 *   LEFT   a hero-grade photobooth strip — three stacked frames, contact-sheet
 *   CENTER identity, route (NOW ✈ destination), fragrance, quiet meta
 *   RIGHT  detachable stub — gate / seat / flight / barcode / serial / QR
 * Strict black-on-paper: hierarchy from size / weight / spacing only, so the
 * preview matches real thermal output.
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
    <div className="paper-tex relative flex h-[560px] w-[1000px] text-ink shadow-[0_30px_80px_-38px_rgba(0,0,0,0.7)]">
      <div className="absolute inset-x-0 top-0 z-[5] h-[6px] bg-ink" />

      {/* ============ LEFT — the photo strip, hero-grade ============ */}
      <div className="flex w-[296px] flex-col gap-[10px] border-r border-dashed border-[color:var(--color-ink)] px-[18px] pb-[18px] pt-[22px]">
        <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.24em] text-silver-dim">
          <span>Frames 01–{seat}</span>
          <span>{scent.code}</span>
        </div>
        {frames.map((f) => (
          <div
            key={f}
            className="relative min-h-0 flex-1 overflow-hidden bg-ink outline outline-1 outline-offset-[3px] outline-[color:var(--color-line)]"
          >
            <Portrait seed={f - 1} print />
            <span className="absolute bottom-[5px] left-[7px] font-mono text-[10px] tracking-[0.1em] text-paper">
              {String(f).padStart(2, "0")}
            </span>
          </div>
        ))}
      </div>

      {/* ============ CENTER — identity, route, fragrance ============ */}
      <div className="relative flex flex-1 flex-col px-[32px] pb-[22px] pt-[22px]">
        {/* boarding stamp */}
        <div className="stamp pointer-events-none absolute right-[28px] top-[118px] z-[2] px-[12px] py-[5px] text-center font-mono uppercase leading-tight">
          <span className="block text-[18px] font-bold tracking-[0.14em]">Boarded</span>
          <span className="block text-[10px] tracking-[0.18em]">{editionDate()}</span>
        </div>

        {/* identity */}
        <div className="flex items-baseline justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.26em]">
              {t.pass.title}
              {sub && (
                <span className="jp-sub ml-[10px] text-[11px] normal-case text-silver-dim">
                  {sub.pass.title}
                </span>
              )}
            </p>
            <p className="mt-[5px] font-display text-[30px] leading-none tracking-tight">
              {BRAND}
            </p>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-silver-dim">
            {t.pass.airline}
          </p>
        </div>

        <div className="my-[18px] border-t border-dashed border-[color:var(--color-ink)]" />

        {/* route */}
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-silver-dim">
              {t.pass.from}
            </p>
            <p className="mt-[4px] font-display text-[46px] leading-none">
              {t.pass.fromValue}
            </p>
          </div>
          <div className="mb-[10px] flex-1 px-[20px]">
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
            <p className="mt-[4px] font-display text-[46px] leading-none">
              {scent.destination.en}
            </p>
            {sub && (
              <p className="jp-sub mt-[2px] text-[12px] text-silver-dim">
                {scent.destination.jp}
              </p>
            )}
          </div>
        </div>

        <div className="my-[18px] border-t border-dashed border-[color:var(--color-ink)]" />

        {/* fragrance */}
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-silver-dim">
          {t.pass.fragrance}
        </p>
        <p className="mt-[6px] font-display text-[30px] leading-[1.0]">
          {scent.mood.en} <span className="italic">/ {scent.name}</span>
        </p>
        <div className="mt-[14px] grid w-[86%] grid-cols-3 divide-x divide-[color:var(--color-line)] border-t border-[color:var(--color-line)] pt-[9px]">
          {t.pass.notes.map((tier, i) => (
            <div key={tier} className="pl-[12px] first:pl-0">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-silver-dim">
                {tier}
              </p>
              <p className="mt-[3px] font-display text-[16px] italic leading-tight">
                {scent.notes[i].en}
              </p>
            </div>
          ))}
        </div>

        {/* quiet meta + phrase — anchored to the floor with whitespace above */}
        <div className="mt-auto">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-silver-dim">
            {t.pass.passenger} {t.pass.passengerValue} · {t.pass.boarding} {stamp} · {editionDate()}
          </p>
          <div className="rule-hair my-[12px]" />
          <p className="font-display text-[20px] italic leading-tight">
            “{scent.phrase.en}”
          </p>
          <p className="mt-[8px] font-mono text-[10px] uppercase tracking-[0.28em]">
            {t.pass.closing}
            {sub && (
              <span className="jp-sub ml-[10px] text-[10px] normal-case">
                {sub.pass.closing}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ============ PERFORATION ============ */}
      <div className="relative w-0">
        <span className="absolute left-1/2 top-[-11px] h-[22px] w-[22px] -translate-x-1/2 rounded-full bg-[color:var(--color-paper)]" />
        <span className="absolute bottom-[-11px] left-1/2 h-[22px] w-[22px] -translate-x-1/2 rounded-full bg-[color:var(--color-paper)]" />
        <span className="absolute bottom-[16px] left-1/2 top-[16px] border-l-2 border-dashed border-[color:var(--color-ink)] opacity-70" />
      </div>

      {/* ============ RIGHT — detachable stub ============ */}
      <div className="flex w-[216px] flex-col px-[22px] pb-[20px] pt-[22px]">
        <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.22em]">
          <span>{t.pass.stub}</span>
          <span>{scent.code}</span>
        </div>

        <div className="mt-[16px] flex flex-col gap-[8px]">
          <StubCell label={t.pass.gate} value={t.pass.gateValue} />
          <StubCell label={t.pass.seat} value={seat} />
          <StubCell label={t.pass.flight} value={scent.code} />
        </div>

        <div className="mt-[18px] flex items-center gap-[12px]">
          <div className="border border-[color:var(--color-ink)] p-[6px]">
            <Qr cell={4} seed={hashSeed(serial)} />
          </div>
          <div className="flex-1 font-mono text-[9px] uppercase leading-[1.7] tracking-[0.14em] text-silver-dim">
            <p>{t.pass.scan[0]}</p>
            <p>{t.pass.scan[1]}</p>
          </div>
        </div>

        <div className="mt-auto">
          <Barcode />
          <p className="mt-[8px] text-center font-mono text-[12px] tracking-[0.26em]">
            {serial}
          </p>
          <p className="mt-[14px] text-center font-display text-[16px] italic leading-tight">
            {t.pass.keep}
          </p>
          <p className="mt-[4px] text-center font-mono text-[8px] uppercase tracking-[0.22em] text-silver-dim">
            {DOMAIN}
          </p>
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

function StubCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[color:var(--color-ink)] px-[10px] py-[7px] font-mono uppercase">
      <p className="text-[8px] tracking-[0.16em] text-silver-dim">{label}</p>
      <p className="mt-[1px] text-[15px] font-bold">{value}</p>
    </div>
  );
}

function Barcode() {
  const bars = "413132214231341221432312143132421334".split("");
  return (
    <div className="flex h-[48px] items-stretch justify-center gap-[2px]">
      {bars.map((w, i) => (
        <span key={i} className="bg-ink" style={{ width: Number(w) * 1.2 }} />
      ))}
    </div>
  );
}
