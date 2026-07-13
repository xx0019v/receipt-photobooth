"use client";

import Portrait from "./Portrait";
import Qr from "./Qr";
import { BRAND, DOMAIN, editionDate, editionTime, type Scent } from "@/app/lib/edition";
import { useLang } from "@/app/lib/i18n";
import { passSecurityAsset } from "@/app/lib/chromeAssets";
import { useChromeArtwork } from "@/app/lib/chromeArtwork";

export const PASS_WIDTH = 620;
export const PASS_HEIGHT = 1760;

/** 80mm-class boarding pass: a vertical photo column followed by horizontal ticket data. */
export default function ReceiptStrip({
  frames,
  scent,
  serial,
  date,
  time,
}: {
  frames: number[];
  scent: Scent;
  serial: string;
  date?: string;
  time?: string;
}) {
  const { t, sub } = useLang();
  const sessionMotif = useChromeArtwork();
  const printedDate = date || editionDate();
  const stamp = time || editionTime();
  const seat = String(frames.length).padStart(2, "0");
  const securitySeal = passSecurityAsset(scent.id);
  const portraitFrames = Array.from({ length: 3 }, (_, index) => frames[index] ?? index + 1);

  return (
    <article
      className="vertical-pass paper-tex relative flex shrink-0 flex-col overflow-hidden text-ink shadow-[0_30px_80px_-38px_rgba(0,0,0,0.7)]"
      style={{ width: PASS_WIDTH, height: PASS_HEIGHT }}
    >
      <div className="h-[7px] shrink-0 bg-ink" />

      <header className="flex h-[88px] shrink-0 items-start justify-between border-b border-[color:var(--color-ink)] px-[34px] py-[17px]">
        <div className="min-w-0 pr-[24px]">
          <p className="whitespace-nowrap font-mono text-[11px] font-semibold uppercase tracking-[0.27em]">
            {t.pass.title}
          </p>
          <p className="mt-[8px] whitespace-nowrap font-display text-[24px] leading-none">{BRAND}</p>
        </div>
        <dl className="grid shrink-0 grid-cols-2 gap-x-[22px] gap-y-[6px] text-right font-mono uppercase">
          <Meta label={t.pass.flight} value={scent.code} />
          <Meta label="Serial" value={serial} />
          <Meta label={t.pass.date} value={printedDate} />
          <Meta label={t.pass.boarding} value={stamp} />
        </dl>
      </header>

      {/* The portraits are the only vertical composition on the pass. */}
      <section className="mx-[34px] h-[1120px] shrink-0 border-b border-[color:var(--color-ink)]">
        <div className="flex h-[38px] items-center justify-between border-b border-[color:var(--color-line)] font-mono text-[8px] uppercase tracking-[0.22em] text-silver-dim">
          <span className="flex items-center gap-[7px]">
            {/* the session's silver motif, kept tiny as an editorial manifest
                mark; the verified security seal below is a separate function */}
            <img
              src={sessionMotif.path}
              alt=""
              aria-hidden="true"
              className="h-[13px] w-[13px] object-contain opacity-45 grayscale"
            />
            Portrait manifest · 03 frames
          </span>
          <span>PRS / TYO · Sequence A</span>
        </div>
        <div className="flex h-[1081px] flex-col items-center justify-center gap-[9px]">
          {portraitFrames.map((frame, index) => (
            <figure key={`${frame}-${index}`} className="relative aspect-square h-[352px] w-[352px] shrink-0 overflow-hidden bg-ink">
              {/* The final frame is nudged a hair toward centre so the column
                  settles; the other two are untouched. */}
              <div
                className="absolute inset-0"
                style={index === 2 ? { transform: "translateX(-3px) scale(1.045)", transformOrigin: "center" } : undefined}
              >
                <Portrait seed={frame - 1} print />
              </div>
              <figcaption className="absolute bottom-[8px] left-[9px] bg-black/70 px-[6px] py-[3px] font-mono text-[7px] uppercase tracking-[0.18em] text-white">
                Frame {String(index + 1).padStart(2, "0")}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* From here down, every field reads horizontally like an airport ticket. */}
      <section className="mx-[34px] grid h-[154px] shrink-0 grid-cols-[84px_1fr_92px] items-center gap-[18px] border-b border-[color:var(--color-ink)]">
        <div>
          <p className="pass-label">{t.pass.from}</p>
          <p className="mt-[7px] whitespace-nowrap font-display text-[32px] leading-none">{t.pass.fromValue}</p>
          {sub && <p className="jp-sub mt-[5px] text-[9px] text-silver-dim">{sub.pass.fromValue}</p>}
        </div>

        <div className="min-w-0 border-x border-[color:var(--color-line)] px-[18px]">
          <div className="flex items-center justify-between">
            <p className="pass-label">{t.pass.to} / Destination</p>
            <span className="font-mono text-[7px] uppercase tracking-[0.16em] text-silver-dim">Zone 01</span>
          </div>
          <p className="mt-[7px] whitespace-nowrap font-display text-[43px] font-semibold uppercase leading-[.86] tracking-[-0.035em]">
            {scent.destination.en}
          </p>
          {sub && <p className="jp-sub mt-[7px] text-[10px] text-silver-dim">{scent.destination.jp}</p>}
        </div>

        <div className="flex flex-col items-center text-center">
          <p className="pass-label">{t.scent.securityMark}</p>
          <img
            src={securitySeal.path}
            width={68}
            height={68}
            alt=""
            aria-hidden="true"
            className="mt-[7px] h-[68px] w-[68px] object-contain grayscale contrast-150 mix-blend-multiply"
          />
          <span className="mt-[4px] font-mono text-[7px] uppercase tracking-[0.12em] text-silver-dim">Verified</span>
        </div>
      </section>

      <section className="mx-[34px] grid h-[110px] shrink-0 grid-cols-[1.06fr_.94fr] gap-[22px] border-b border-[color:var(--color-line)] py-[14px]">
        <div className="min-w-0 border-r border-[color:var(--color-line)] pr-[20px]">
          <p className="pass-label">{t.pass.fragrance} / {t.pass.mood}</p>
          <p className="mt-[8px] whitespace-nowrap font-display text-[24px] leading-none">
            {scent.name} <span className="italic">/ {scent.mood.en}</span>
          </p>
          {sub && <p className="jp-sub mt-[7px] text-[9px] text-silver-dim">{scent.mood.jp}</p>}
        </div>
        <div className="grid min-w-0 grid-cols-3 gap-[9px]">
          {t.pass.notes.map((tier, index) => (
            <div key={tier} className="min-w-0">
              <p className="pass-label tracking-[0.12em]">{tier}</p>
              <p className="mt-[7px] font-display text-[13px] italic leading-[1.08]">{scent.notes[index].en}</p>
              {sub && <p className="jp-sub mt-[4px] text-[7px] leading-tight text-silver-dim">{scent.notes[index].jp}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-[34px] grid h-[102px] shrink-0 grid-cols-3 grid-rows-2 border-b border-[color:var(--color-ink)] py-[11px]">
        <BoardingCell label={t.pass.passenger} value={t.pass.passengerValue} />
        <BoardingCell label={t.pass.gate} value={t.pass.gateValue} />
        <BoardingCell label={t.pass.seat} value={seat} />
        <BoardingCell label={t.pass.flight} value={scent.code} />
        <BoardingCell label={t.pass.boarding} value={stamp} />
        <BoardingCell label={t.pass.date} value={printedDate} />
      </section>

      <footer className="relative mt-auto h-[179px] shrink-0 border-t border-dashed border-[color:var(--color-ink)] px-[34px] py-[12px]">
        <span className="absolute -left-[9px] -top-[10px] h-[18px] w-[18px] rounded-full bg-[color:var(--color-paper)]" />
        <span className="absolute -right-[9px] -top-[10px] h-[18px] w-[18px] rounded-full bg-[color:var(--color-paper)]" />
        <div className="flex h-full items-stretch gap-[22px]">
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-baseline justify-between gap-[16px] font-mono uppercase">
              <span className="whitespace-nowrap text-[10px] tracking-[0.28em]">{t.pass.stub}</span>
              <span className="whitespace-nowrap text-[8px] tracking-[0.14em] text-silver-dim">{scent.code} / {serial}</span>
            </div>
            <div className="mt-[10px] grid grid-cols-3 divide-x divide-[color:var(--color-line)]">
              <StubValue label={t.pass.gate} value={t.pass.gateValue} />
              <StubValue label={t.pass.seat} value={seat} />
              <StubValue label={t.pass.boarding} value={stamp} />
            </div>
            <div className="mt-auto">
              <Barcode />
              <div className="mt-[6px] flex justify-between gap-[12px] font-mono text-[7px] uppercase tracking-[0.14em] text-silver-dim">
                <span className="whitespace-nowrap">{DOMAIN}</span>
                <span className="whitespace-nowrap">{t.pass.keep}</span>
              </div>
            </div>
          </div>
          <div className="flex w-[90px] shrink-0 flex-col items-center justify-center border-l border-[color:var(--color-line)] pl-[14px]">
            <div className="border border-[color:var(--color-ink)] p-[5px]">
              <Qr cell={3} seed={hashSeed(serial)} />
            </div>
            <p className="mt-[7px] text-center font-mono text-[7px] uppercase leading-[1.35] tracking-[0.1em] text-silver-dim">
              {t.pass.scan[0]}<br />{t.pass.scan[1]}
            </p>
          </div>
        </div>
      </footer>
    </article>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div><dt className="whitespace-nowrap text-[7px] tracking-[0.14em] text-silver-dim">{label}</dt><dd className="mt-[1px] whitespace-nowrap text-[9px] tracking-[0.08em]">{value}</dd></div>;
}

function BoardingCell({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 border-r border-[color:var(--color-line)] px-[12px] first:pl-0 [&:nth-child(3n)]:border-r-0 [&:nth-child(4)]:pl-0"><p className="pass-label">{label}</p><p className="mt-[4px] whitespace-nowrap font-mono text-[10px] font-semibold uppercase tracking-[0.06em]">{value}</p></div>;
}

function StubValue({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 px-[12px] first:pl-0"><p className="pass-label">{label}</p><p className="mt-[4px] whitespace-nowrap font-display text-[18px] leading-none">{value}</p></div>;
}

function hashSeed(s: string): number {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0x7fffffff;
  return h || 7;
}

function Barcode() {
  const bars = "413132214231341221432312143132421334".split("");
  return <div className="flex h-[32px] items-stretch gap-[2px] overflow-hidden" aria-label="Barcode">{bars.map((width, index) => <span key={index} className="shrink-0 bg-ink" style={{ width: Number(width) * 1.1 }} />)}</div>;
}
