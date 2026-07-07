"use client";

import Portrait from "./Portrait";
import Qr from "./Qr";
import {
  BRAND,
  DOMAIN,
  editionDate,
  editionTime,
  loc,
  type Scent,
} from "@/app/lib/edition";
import { useLang } from "@/app/lib/i18n";

/**
 * The printed artefact — a luxury airport boarding pass rendered on thermal
 * paper: a "SCENT BOARDING PASS". Reused across Review, Printing and Done.
 * Keep it print-accurate; it doubles as the reference for the real render.
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
  const { t, lang } = useLang();
  const stamp = time ?? editionTime();
  const seat = String(frames.length).padStart(2, "0");

  return (
    <div className="paper-tex relative text-ink shadow-[0_30px_80px_-40px_rgba(0,0,0,0.6)]">
      {/* airport-style boarding stamp */}
      <div className="stamp pointer-events-none absolute right-[30px] top-[300px] z-[2] px-[16px] py-[7px] text-center font-mono uppercase leading-tight">
        <span className="block text-[24px] font-bold tracking-[0.18em]">Boarded</span>
        <span className="block text-[12px] tracking-[0.24em]">{editionDate()}</span>
      </div>

      <Perf />
      <div className="h-[7px] w-full bg-ink" />

      <div className="px-[44px] pb-[8px] pt-[42px]">
        {/* header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-[15px] uppercase tracking-[0.34em] text-silver-dim">
              {t.pass.title}
            </p>
            <p className="mt-[8px] font-display text-[30px] leading-none">
              {BRAND}
            </p>
          </div>
          <span className="flex h-[52px] w-[52px] items-center justify-center border border-[color:var(--color-ink)] font-display text-[24px]">
            TR
          </span>
        </div>

        <div className="mt-[8px] font-mono text-[13px] uppercase tracking-[0.28em] text-silver-dim">
          {t.pass.airline}
        </div>

        <Rule className="my-[22px]" />

        {/* route */}
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-[13px] uppercase tracking-[0.3em] text-silver-dim">
              {t.pass.from}
            </p>
            <p className="mt-[6px] font-display text-[42px] leading-none">
              {t.pass.fromValue}
            </p>
          </div>
          <div className="mb-[8px] flex-1 px-[18px]">
            <div className="relative h-[22px]">
              <span className="absolute left-0 right-0 top-1/2 border-t border-dashed border-[color:var(--color-ink)]" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-paper-bright px-[8px] text-[22px]">
                ✈
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono text-[13px] uppercase tracking-[0.3em] text-silver-dim">
              {t.pass.to}
            </p>
            <p className="mt-[6px] font-display text-[42px] leading-none">
              {loc(scent.destination, lang)}
            </p>
          </div>
        </div>

        <Rule className="my-[22px]" />

        {/* passenger info grid */}
        <div className="grid grid-cols-2 gap-x-[24px] gap-y-[16px]">
          <Field label={t.pass.passenger} value={t.pass.passengerValue} />
          <Field label={t.pass.flight} value={scent.code} align="right" />
          <Field label={t.pass.gate} value={t.pass.gateValue} />
          <Field label={t.pass.seat} value={seat} align="right" />
          <Field label={t.pass.boarding} value={stamp} />
          <Field label={t.pass.date} value={editionDate()} align="right" />
        </div>

        <Rule className="my-[22px]" />

        {/* fragrance */}
        <p className="font-mono text-[13px] uppercase tracking-[0.34em] text-silver-dim">
          {t.pass.fragrance}
        </p>
        <p className="mt-[8px] font-display text-[36px] leading-none">
          {loc(scent.mood, lang)} <span className="italic">/ {scent.name}</span>
        </p>
        <div className="mt-[18px] grid grid-cols-3 gap-[8px]">
          {t.pass.notes.map((tier, i) => (
            <div key={tier}>
              <p className="font-mono text-[12px] uppercase tracking-[0.24em] text-silver-dim">
                {tier}
              </p>
              <p className="mt-[6px] font-display text-[21px] italic leading-tight">
                {loc(scent.notes[i], lang)}
              </p>
            </div>
          ))}
        </div>

        <Rule className="my-[22px]" />

        {/* scent stamps (the photobooth frames) */}
        <div className="grid grid-cols-3 gap-[8px]">
          {frames.map((f) => (
            <div key={f} className="relative aspect-square w-full overflow-hidden bg-ink">
              <Portrait seed={f - 1} print />
              <Tick className="left-[6px] top-[6px] border-l border-t" />
              <Tick className="right-[6px] top-[6px] rotate-90 border-l border-t" />
              <Tick className="bottom-[6px] right-[6px] rotate-180 border-l border-t" />
              <Tick className="bottom-[6px] left-[6px] -rotate-90 border-l border-t" />
              <span className="absolute bottom-[6px] left-[8px] font-mono text-[11px] tracking-[0.1em] text-paper/80">
                {String(f).padStart(2, "0")}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-[18px] text-center font-display text-[26px] italic leading-[1.25]">
          “{loc(scent.phrase, lang)}”
        </p>
      </div>

      {/* perforation → detachable stub */}
      <Perforation />

      <div className="px-[44px] pb-[8px] pt-[20px]">
        <div className="flex items-center justify-between font-mono text-[13px] uppercase tracking-[0.3em] text-silver-dim">
          <span>{t.pass.stub}</span>
          <span>{scent.code}</span>
        </div>

        <div className="mt-[16px] grid grid-cols-3 gap-[10px] font-mono text-[15px] uppercase tracking-[0.1em]">
          <StubCell label={t.pass.gate} value={t.pass.gateValue} />
          <StubCell label={t.pass.seat} value={seat} />
          <StubCell label={t.pass.boarding} value={stamp} />
        </div>

        <Barcode />
        <p className="mt-[10px] text-center font-mono text-[15px] tracking-[0.3em]">
          {serial}
        </p>

        <div className="mt-[22px] flex items-center gap-[24px]">
          <div className="border border-[color:var(--color-ink)] p-[9px]">
            <Qr cell={5} seed={hashSeed(serial)} />
          </div>
          <div className="flex-1 font-mono text-[15px] uppercase leading-[1.6] tracking-[0.14em] text-silver-dim">
            <p>{t.pass.scan[0]}</p>
            <p>{t.pass.scan[1]}</p>
            <p className="mt-[8px] font-display text-[22px] normal-case tracking-normal text-ink">
              {t.pass.keep}
            </p>
          </div>
        </div>

        <p className="mt-[24px] text-center font-mono text-[14px] uppercase tracking-[0.34em]">
          {t.pass.closing}
        </p>
        <p className="mb-[6px] mt-[10px] text-center font-mono text-[12px] uppercase tracking-[0.3em] text-silver-dim">
          {DOMAIN}
        </p>
      </div>

      <CutLine />
    </div>
  );
}

function hashSeed(s: string): number {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0x7fffffff;
  return h || 7;
}

function Field({
  label,
  value,
  align = "left",
}: {
  label: string;
  value: string;
  align?: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "text-right" : ""}>
      <p className="font-mono text-[12px] uppercase tracking-[0.24em] text-silver-dim">
        {label}
      </p>
      <p className="mt-[5px] font-mono text-[22px] uppercase tracking-[0.04em]">
        {value}
      </p>
    </div>
  );
}

function StubCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[color:var(--color-line)] px-[12px] py-[10px]">
      <p className="text-[11px] tracking-[0.2em] text-silver-dim">{label}</p>
      <p className="mt-[4px] text-[18px]">{value}</p>
    </div>
  );
}

function Tick({ className = "" }: { className?: string }) {
  return (
    <span
      className={`pointer-events-none absolute h-[12px] w-[12px] border-paper/70 ${className}`}
    />
  );
}

function Rule({ className = "" }: { className?: string }) {
  return (
    <div
      className={`border-t border-dashed border-[color:var(--color-ink)] ${className}`}
    />
  );
}

function Perf() {
  return (
    <div
      className="h-[14px] w-full"
      style={{
        background:
          "radial-gradient(circle at 8px 0, transparent 0 7px, var(--color-paper-bright) 7px) 0 0 / 22px 14px repeat-x",
      }}
    />
  );
}

/** Ticket perforation with edge notches — separates the stub. */
function Perforation() {
  return (
    <div className="relative my-[6px] h-[28px]">
      <span className="absolute left-[-14px] top-1/2 h-[28px] w-[28px] -translate-y-1/2 rounded-full bg-[color:var(--color-paper)]" />
      <span className="absolute right-[-14px] top-1/2 h-[28px] w-[28px] -translate-y-1/2 rounded-full bg-[color:var(--color-paper)]" />
      <span className="absolute left-[26px] right-[26px] top-1/2 border-t-2 border-dashed border-[color:var(--color-silver)]" />
    </div>
  );
}

function CutLine() {
  return (
    <div className="relative flex items-center gap-[14px] px-[30px] py-[22px]">
      <span className="text-[22px]">✂</span>
      <span className="flex-1 border-t-2 border-dashed border-[color:var(--color-silver)]" />
    </div>
  );
}

function Barcode() {
  const bars = "4131322142313412214323121431324213".split("");
  return (
    <div className="mt-[20px] flex h-[74px] items-stretch justify-center gap-[3px]">
      {bars.map((w, i) => (
        <span key={i} className="bg-ink" style={{ width: Number(w) * 2.2 }} />
      ))}
    </div>
  );
}
