"use client";

import Portrait from "./Portrait";
import Qr from "./Qr";
import { BRAND, DOMAIN, editionDate, editionTime, editionForScent, type Scent } from "@/app/lib/edition";
import { useLang } from "@/app/lib/i18n";
import { passSecurityAsset } from "@/app/lib/chromeAssets";
import { useChromeArtwork } from "@/app/lib/chromeArtwork";

/**
 * BoardingPass — the single source of truth for the PASS artefact, drawn as a
 * horizontal airline-style ticket: a large photo strip and editorial headline
 * on the left, a detachable data stub on the right, a vertical perforation
 * between them. Strict monochrome, thermal-safe.
 *
 * The artwork is horizontal. For physical print it is rotated 90° into the
 * thermal canvas (see BoardingPassPrint) so the paper,
 * held sideways, reads exactly like this. On screen it is shown horizontally.
 */
// Single source of truth for the PASS dimensions. Width (the printed paper
// width) is fixed at 620; the length is derived from the artwork so the photo
// strip can stay large without cramping the ticket data.
export const BOARDING_W = 2000;
export const BOARDING_H = 620;
export const BOARDING_MAIN_W = 1232;
export const BOARDING_STUB_W = 620;
export const BOARDING_PHOTO_SIZE = 368;
export const BOARDING_PHOTO_GAP = 20;

/** Shared on-screen width for Review, Printing, and Done at 1080×1920. */
export const BOARDING_SCREEN_W = 1000;

/** Physical thermal canvas — paper width fixed 620, length follows the artwork. */
export const PASS_PRINT_W = 620;
export const PASS_PRINT_H = BOARDING_W;

export default function BoardingPass({
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
  const motif = useChromeArtwork();
  const seal = passSecurityAsset(scent.id);
  const printedDate = date || editionDate();
  const stamp = time || editionTime();
  const seat = `${String(frames.length).padStart(2, "0")}A`;
  const photos = Array.from({ length: 3 }, (_, i) => frames[i] ?? i + 1);
  const passNo = `TR-${serial.replace(/\D/gu, "").slice(-6).padStart(6, "0")}`;
  const edition = editionForScent(scent);

  return (
    <article
      className="paper-tex relative flex shrink-0 overflow-hidden text-ink shadow-[0_30px_80px_-40px_rgba(0,0,0,0.6)]"
      style={{ width: BOARDING_W, height: BOARDING_H }}
    >
      <EdgeMark side="left">{BRAND} — {t.pass.title}</EdgeMark>

      {/* ---- Main : headline + photo strip ----------------------------- */}
      <div
        className="flex h-full shrink-0 flex-col px-[40px] py-[26px]"
        style={{ width: BOARDING_MAIN_W }}
      >
        <div className="flex items-center justify-between font-mono text-[15px] uppercase tracking-[0.3em]">
          <span>{BRAND}</span>
          <span className="text-silver-dim">{t.pass.title}</span>
        </div>
        <div className="mt-[14px] h-px w-full bg-[color:var(--color-ink)]" />

        <div className="mt-[16px] flex items-start justify-between">
          <div>
            <h1 className="font-display text-[54px] font-semibold uppercase leading-[0.92] tracking-[-0.02em]">
              Memories, bottled.
            </h1>
            <p className="mt-[9px] font-mono text-[13px] uppercase leading-[1.6] tracking-[0.28em] text-silver-dim">
              A journey in scent. A memory that stays with you.
            </p>
          </div>
          {/* circular security seal — a flat printed stamp, not an object */}
          <figure
            aria-hidden="true"
            className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-full ring-1 ring-[color:var(--color-ink)]"
          >
            <img
              src={motif.path}
              alt=""
              className="absolute left-1/2 top-1/2 h-[128%] w-[128%] -translate-x-1/2 -translate-y-1/2 object-cover grayscale contrast-[0.9] mix-blend-multiply"
            />
          </figure>
        </div>

        <div className="mt-[18px] flex" style={{ gap: BOARDING_PHOTO_GAP }}>
          {photos.map((frame, i) => (
            <figure
              key={`${frame}-${i}`}
              className="relative shrink-0 overflow-hidden bg-ink"
              style={{ width: BOARDING_PHOTO_SIZE, height: BOARDING_PHOTO_SIZE }}
            >
              <div
                className="absolute inset-0"
                style={i === 2 ? { transform: "translateX(-3px) scale(1.04)", transformOrigin: "center" } : undefined}
              >
                <Portrait seed={frame - 1} print />
              </div>
              <span className="pointer-events-none absolute inset-0 border border-[color:var(--color-line)]" />
            </figure>
          ))}
        </div>

        <div className="mt-auto flex items-center gap-[16px] pt-[14px]">
          <span className="h-px flex-1 bg-[color:var(--color-line)]" />
          <span className="font-mono text-[12px] uppercase tracking-[0.34em] text-silver-dim">
            Captured today, remembered always.
          </span>
          <span className="text-[12px] text-silver-dim">✦</span>
          <span className="h-px flex-1 bg-[color:var(--color-line)]" />
        </div>
      </div>

      {/* ---- Perforation : dashed cut line with edge notches cut inward -- */}
      <div className="relative w-[40px] shrink-0 overflow-hidden">
        <span className="absolute left-1/2 top-[22px] bottom-[22px] w-px -translate-x-1/2 border-l border-dashed border-[color:var(--color-ink)]" />
        <span className="absolute left-1/2 top-0 h-[11px] w-[22px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--color-paper)] ring-1 ring-[color:var(--color-line)]" />
        <span className="absolute left-1/2 bottom-0 h-[11px] w-[22px] -translate-x-1/2 translate-y-1/2 rounded-full bg-[color:var(--color-paper)] ring-1 ring-[color:var(--color-line)]" />
      </div>

      {/* ---- Stub : the data column ------------------------------------ */}
      <div
        className="flex h-full shrink-0 flex-col px-[36px] py-[20px]"
        style={{ width: BOARDING_STUB_W }}
      >
        <div className="grid grid-cols-2 gap-x-[40px]">
          <Field label={`Pass No.`} value={passNo} big />
          <Field label={`Serial No.`} value={serial} big />
        </div>

        <Rule />

        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-[10px]">
          <div>
            <Label>{t.pass.from}</Label>
            <p className="mt-[7px] font-display text-[40px] uppercase leading-none">{t.pass.fromValue}</p>
          </div>
          <Plane />
          <div className="text-right">
            <Label>{t.pass.to}</Label>
            <p className="mt-[7px] font-display text-[40px] uppercase leading-none">{scent.destination.en}</p>
          </div>
        </div>
        <div className="mt-[16px]">
          <Label>Route</Label>
          <p className="mt-[6px] font-mono text-[18px] uppercase tracking-[0.2em]">You → Forever</p>
        </div>

        <Rule />

        <div className="grid grid-cols-2 gap-x-[40px] gap-y-[18px]">
          <div>
            <Label>Edition</Label>
            <p className="mt-[6px] font-display text-[25px] uppercase leading-none">{edition.no} · {edition.code}</p>
          </div>
          <div className="text-right">
            <Label>{t.pass.flight}</Label>
            <p className="mt-[6px] font-mono text-[20px] uppercase tracking-[0.1em]">{scent.code}</p>
          </div>
          <div>
            <Label>{t.pass.date}</Label>
            <p className="mt-[6px] font-mono text-[16px] tracking-[0.06em]">{printedDate}</p>
          </div>
          <div className="text-right">
            <Label>{t.pass.boarding}</Label>
            <p className="mt-[6px] font-mono text-[16px] tracking-[0.06em]">{stamp}</p>
          </div>
          <div>
            <Label>{t.pass.gate}</Label>
            <p className="mt-[6px] font-mono text-[18px] uppercase tracking-[0.1em]">{t.pass.gateValue}</p>
          </div>
          <div className="text-right">
            <Label>{t.pass.seat}</Label>
            <p className="mt-[6px] font-mono text-[18px] uppercase tracking-[0.1em]">{seat}</p>
          </div>
        </div>

        <div className="mt-[12px]">
          <Label>Notes</Label>
          <p className="mt-[7px] font-mono text-[13px] uppercase leading-[1.6] tracking-[0.14em] text-ink-soft">
            Thank you for sharing your moment with us.
          </p>
        </div>

        <div className="mt-auto flex items-end justify-between gap-[24px]">
          <div className="min-w-0">
            <Barcode />
            <p className="mt-[5px] font-mono text-[10px] tracking-[0.16em] text-silver-dim">{DOMAIN}</p>
          </div>
          <div className="shrink-0 border border-[color:var(--color-ink)] p-[6px]">
            <Qr cell={4} seed={hashSeed(serial)} />
          </div>
        </div>
      </div>

      <EdgeMark side="right">Scented memories. Made to last.</EdgeMark>
    </article>
  );
}

/** The horizontal ticket rotated into the shared thermal canvas. */
export function BoardingPassPrint(props: React.ComponentProps<typeof BoardingPass>) {
  return (
    <div className="relative shrink-0" style={{ width: PASS_PRINT_W, height: PASS_PRINT_H }}>
      <div
        className="absolute left-1/2 top-1/2"
        style={{ width: BOARDING_W, height: BOARDING_H, transform: "translate(-50%,-50%) rotate(90deg)" }}
      >
        <BoardingPass {...props} />
      </div>
    </div>
  );
}

function EdgeMark({ side, children }: { side: "left" | "right"; children: React.ReactNode }) {
  return (
    <div
      className={`relative flex w-[54px] shrink-0 items-center justify-center ${side === "left" ? "border-r" : "border-l"} border-[color:var(--color-line-soft)]`}
    >
      <span className="text-[13px] text-silver-dim">✦</span>
      <span
        className="absolute font-mono text-[11px] uppercase tracking-[0.3em] text-silver-dim"
        style={{ transform: side === "left" ? "rotate(-90deg)" : "rotate(90deg)", whiteSpace: "nowrap" }}
      >
        {children}
      </span>
    </div>
  );
}

function Field({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="min-w-0">
      <Label>{label}</Label>
      <p className={`mt-[6px] truncate font-mono uppercase tracking-[0.08em] ${big ? "text-[24px]" : "text-[16px]"}`}>
        {value}
      </p>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-silver-dim">{children}</p>
  );
}

function Rule() {
  return <div className="my-[12px] h-px w-full bg-[color:var(--color-line)]" />;
}

function Plane() {
  return (
    <svg width="30" height="16" viewBox="0 0 30 16" fill="none" aria-hidden="true" className="mb-[4px] text-ink">
      <path d="M1 8h20l4-6M21 8l4 6M25 2l4 6-4 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function hashSeed(s: string): number {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0x7fffffff;
  return h || 7;
}

function Barcode() {
  const bars = "413132214231341221432312143132421334".split("");
  return (
    <div className="flex h-[42px] items-stretch gap-[2px] overflow-hidden" aria-label="Barcode">
      {bars.map((width, index) => (
        <span key={index} className="shrink-0 bg-ink" style={{ width: Number(width) * 1.3 }} />
      ))}
    </div>
  );
}
