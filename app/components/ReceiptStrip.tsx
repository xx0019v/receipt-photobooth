"use client";

import Portrait from "./Portrait";
import Qr from "./Qr";
import { BRAND, DOMAIN, editionDate, editionTime, type Scent } from "@/app/lib/edition";
import { useLang } from "@/app/lib/i18n";
import { passSecurityAsset } from "@/app/lib/chromeAssets";

/** Vertical 80mm-class boarding pass: 620×1040 (1:1.68). */
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
  const securitySeal = passSecurityAsset(scent.id);

  return (
    <article className="vertical-pass paper-tex relative flex h-[1040px] w-[620px] flex-col overflow-hidden text-ink shadow-[0_30px_80px_-38px_rgba(0,0,0,0.7)]">
      <div className="h-[7px] shrink-0 bg-ink" />

      {/* Document identity / airport metadata */}
      <header className="flex h-[92px] shrink-0 items-start justify-between border-b border-[color:var(--color-ink)] px-[34px] py-[20px]">
        <div>
          <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.3em]">
            {t.pass.title}
          </p>
          <p className="mt-[8px] font-display text-[24px] leading-none">{BRAND}</p>
        </div>
        <dl className="grid grid-cols-2 gap-x-[22px] gap-y-[6px] text-right font-mono uppercase">
          <Meta label={t.pass.flight} value={scent.code} />
          <Meta label="Serial" value={serial} />
          <Meta label={t.pass.date} value={editionDate()} />
          <Meta label={t.pass.boarding} value={stamp} />
        </dl>
      </header>

      {/* Route is the document's visual signature. */}
      <section className="relative h-[188px] shrink-0 overflow-hidden px-[34px] py-[22px]">
        <img
          src={securitySeal.path}
          width={104}
          height={104}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute right-[26px] top-[18px] h-[104px] w-[104px] object-contain opacity-[.08] grayscale contrast-150 mix-blend-multiply"
        />
        <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.26em] text-silver-dim">
          <span>PRS / TYO</span>
          <span>ZONE 01 · BOARDING OPEN</span>
        </div>
        <div className="relative mt-[20px] grid grid-cols-[120px_1fr] items-end gap-[18px]">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-silver-dim">{t.pass.from}</p>
            <p className="mt-[4px] font-display text-[40px] leading-none">{t.pass.fromValue}</p>
          </div>
          <div className="border-l border-[color:var(--color-ink)] pl-[20px]">
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-silver-dim">{t.pass.to}</p>
            <p className="mt-[2px] font-display text-[58px] font-semibold uppercase leading-[.82] tracking-[-0.035em]">
              {scent.destination.en}
            </p>
            {sub && <p className="jp-sub mt-[7px] text-[10px] text-silver-dim">{scent.destination.jp}</p>}
          </div>
        </div>
      </section>

      {/* Equal portrait frames — no captions or text overlays. */}
      <section className="mx-[34px] flex h-[278px] shrink-0 gap-[6px] border-y border-[color:var(--color-ink)] py-[10px]">
        {frames.slice(0, 3).map((frame) => (
          <div key={frame} className="min-w-0 flex-1 overflow-hidden bg-ink">
            <Portrait seed={frame - 1} print />
          </div>
        ))}
      </section>

      {/* Fragrance manifest */}
      <section className="mx-[34px] grid h-[142px] shrink-0 grid-cols-[1.25fr_.75fr] gap-[24px] border-b border-[color:var(--color-line)] py-[18px]">
        <div className="border-r border-[color:var(--color-line)] pr-[22px]">
          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-silver-dim">{t.pass.fragrance} / {t.pass.mood}</p>
          <p className="mt-[8px] font-display text-[26px] leading-[1.05]">
            {scent.name} <span className="italic">/ {scent.mood.en}</span>
          </p>
          {sub && <p className="jp-sub mt-[7px] text-[10px] text-silver-dim">{scent.mood.jp}</p>}
        </div>
        <div className="grid grid-cols-3 gap-[10px]">
          {t.pass.notes.map((tier, index) => (
            <div key={tier}>
              <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-silver-dim">{tier}</p>
              <p className="mt-[8px] font-display text-[14px] italic leading-[1.08]">{scent.notes[index].en}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Boarding information grid */}
      <section className="mx-[34px] grid h-[105px] shrink-0 grid-cols-3 border-b border-[color:var(--color-ink)] py-[14px]">
        <BoardingCell label={t.pass.passenger} value={t.pass.passengerValue} />
        <BoardingCell label={t.pass.gate} value={t.pass.gateValue} />
        <BoardingCell label={t.pass.seat} value={seat} />
        <BoardingCell label={t.pass.flight} value={scent.code} />
        <BoardingCell label={t.pass.boarding} value={stamp} />
        <BoardingCell label="Destination" value={scent.destination.en} />
      </section>

      {/* Detachable vertical-pass stub */}
      <footer className="relative mt-auto h-[220px] shrink-0 border-t border-dashed border-[color:var(--color-ink)] px-[34px] py-[14px]">
        <span className="absolute -left-[9px] -top-[10px] h-[18px] w-[18px] rounded-full bg-[color:var(--color-paper)]" />
        <span className="absolute -right-[9px] -top-[10px] h-[18px] w-[18px] rounded-full bg-[color:var(--color-paper)]" />
        <div className="flex h-full items-stretch gap-[24px]">
          <div className="flex flex-1 flex-col">
            <div className="flex items-baseline justify-between font-mono uppercase">
              <span className="text-[10px] tracking-[0.28em]">{t.pass.stub}</span>
              <span className="text-[9px] tracking-[0.2em] text-silver-dim">{scent.code} / {serial}</span>
            </div>
            <div className="mt-[10px] grid grid-cols-3 divide-x divide-[color:var(--color-line)]">
              <StubValue label={t.pass.gate} value={t.pass.gateValue} />
              <StubValue label={t.pass.seat} value={seat} />
              <StubValue label={t.pass.boarding} value={stamp} />
            </div>
            <div className="mt-auto">
              <Barcode />
              <div className="mt-[7px] flex justify-between font-mono text-[8px] uppercase tracking-[0.19em] text-silver-dim">
                <span>{DOMAIN}</span>
                <span>{t.pass.keep}</span>
              </div>
            </div>
          </div>
          <div className="flex w-[88px] shrink-0 flex-col items-center justify-center border-l border-[color:var(--color-line)] pl-[14px]">
            <div className="border border-[color:var(--color-ink)] p-[5px]">
              <Qr cell={3} seed={hashSeed(serial)} />
            </div>
            <p className="mt-[8px] text-center font-mono text-[7px] uppercase leading-[1.4] tracking-[0.12em] text-silver-dim">
              {t.pass.scan[0]}<br />{t.pass.scan[1]}
            </p>
          </div>
        </div>
      </footer>
    </article>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-[7px] tracking-[0.16em] text-silver-dim">{label}</dt><dd className="mt-[1px] text-[9px] tracking-[0.1em]">{value}</dd></div>;
}

function BoardingCell({ label, value }: { label: string; value: string }) {
  return <div className="px-[10px] first:pl-0"><p className="font-mono text-[7px] uppercase tracking-[0.17em] text-silver-dim">{label}</p><p className="mt-[3px] truncate font-mono text-[11px] font-semibold uppercase tracking-[0.08em]">{value}</p></div>;
}

function StubValue({ label, value }: { label: string; value: string }) {
  return <div className="px-[13px] first:pl-0"><p className="font-mono text-[7px] uppercase tracking-[0.17em] text-silver-dim">{label}</p><p className="mt-[4px] font-display text-[20px] leading-none">{value}</p></div>;
}

function hashSeed(s: string): number {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0x7fffffff;
  return h || 7;
}

function Barcode() {
  const bars = "413132214231341221432312143132421334".split("");
  return <div className="flex h-[36px] items-stretch gap-[2px] overflow-hidden">{bars.map((width, index) => <span key={index} className="shrink-0 bg-ink" style={{ width: Number(width) * 1.1 }} />)}</div>;
}
