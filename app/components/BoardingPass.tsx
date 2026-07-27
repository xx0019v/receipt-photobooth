"use client";

import CapturedPhoto from "./CapturedPhoto";
import Qr from "./Qr";
import { BRAND, editionDate, editionTime, editionForScent, type Scent } from "@/app/lib/edition";
import { useLang } from "@/app/lib/i18n";
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
// Layout: leftEdge(54) + MAIN(1232, photos untouched) + cut(40) + INFO(400)
// + cut(40) + STUB(280) + rightEdge(54) = 2100. The paper length grew so the
// right-hand boarding data reads like a real airline ticket without ever
// shrinking the photo strip.
export const BOARDING_W = 2100;
export const BOARDING_H = 620;
export const BOARDING_MAIN_W = 1232;
export const BOARDING_INFO_W = 400;
export const BOARDING_STUB_W = 280;
export const BOARDING_PHOTO_SIZE = 368;
export const BOARDING_PHOTO_GAP = 20;

/**
 * Thermal-safe type scale shared with the canonical SVG renderer.
 *
 * The 620-unit artwork is reduced to a 384-dot head (0.619×). Anything below
 * 14 artwork units becomes a 6-8 dot glyph and is not reliably readable on
 * the physical printer. These values keep every informational line at 9 dots
 * or larger after rasterisation.
 */
export const PASS_TYPE = {
  masthead: 22,
  supporting: 20,
  label: 20,
  edge: 20,
  caption: 18,
  stubSmall: 20,
  stubTiny: 18,
} as const;

/** Shared on-screen width for Review, Printing, and Done at 1080×1920. */
export const BOARDING_SCREEN_W = 1000;

/** Right-edge printer slot (screen presentation only, Printing/Done). */
export const PASS_SLOT_W = 46;

/** Physical thermal canvas — paper width fixed 620, length follows the artwork. */
export const PASS_PRINT_W = 620;
export const PASS_PRINT_H = BOARDING_W;

export default function BoardingPass({
  frames,
  frameSources,
  scent,
  serial,
  date,
  time,
}: {
  frames: number[];
  frameSources?: Record<number, string>;
  scent: Scent;
  serial: string;
  date?: string;
  time?: string;
}) {
  const { t } = useLang();
  const motif = useChromeArtwork();
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
      <EdgeMark side="left">{BRAND} - Boarding Pass</EdgeMark>

      {/* ---- Main : headline + photo strip ----------------------------- */}
      <div
        className="flex h-full shrink-0 flex-col px-[40px] py-[26px]"
        style={{ width: BOARDING_MAIN_W }}
      >
        <div
          className="flex items-center justify-between font-mono uppercase tracking-[0.22em]"
          style={{ fontSize: PASS_TYPE.masthead }}
        >
          <span>{BRAND}</span>
          <span className="text-silver-dim">Boarding Pass</span>
        </div>
        <div className="mt-[14px] h-px w-full bg-[color:var(--color-ink)]" />

        <div className="mt-[16px] flex items-start justify-between">
          <div>
            <h1 className="font-display text-[54px] font-semibold uppercase leading-[0.92] tracking-[-0.02em]">
              Memories, bottled.
            </h1>
            <p
              className="mt-[9px] font-mono uppercase leading-[1.5] tracking-[0.18em] text-silver-dim"
              style={{ fontSize: PASS_TYPE.supporting }}
            >
              A journey in frames. A memory that stays with you.
            </p>
          </div>
          {/* The selected ACUSE mark is part of the edition, not decoration. */}
          <figure
            aria-hidden="true"
            className="relative h-[120px] w-[120px] shrink-0 overflow-hidden border border-[color:var(--color-ink)] bg-paper-bright"
          >
            <img
              src={motif.path}
              alt=""
              width={106}
              height={106}
              className="absolute inset-[7px] h-[calc(100%-14px)] w-[calc(100%-14px)] object-contain grayscale contrast-125 mix-blend-multiply"
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
                <CapturedPhoto
                  src={frameSources?.[frame]}
                  seed={frame - 1}
                  print
                />
              </div>
              <span className="pointer-events-none absolute inset-0 border border-[color:var(--color-line)]" />
            </figure>
          ))}
        </div>

        <div className="mt-auto flex items-center gap-[16px] pt-[14px]">
          <span className="h-px flex-1 bg-[color:var(--color-line)]" />
          <span
            className="font-mono uppercase tracking-[0.22em] text-silver-dim"
            style={{ fontSize: PASS_TYPE.caption }}
          >
            Captured today, remembered always.
          </span>
          <span className="text-silver-dim" style={{ fontSize: PASS_TYPE.caption }}>✦</span>
          <span className="h-px flex-1 bg-[color:var(--color-line)]" />
        </div>
      </div>

      {/* ---- Perforation : dashed cut line with edge notches cut inward -- */}
      <div className="relative w-[40px] shrink-0 overflow-hidden">
        <span className="absolute left-1/2 top-[22px] bottom-[22px] w-px -translate-x-1/2 border-l border-dashed border-[color:var(--color-ink)]" />
        <span className="absolute left-1/2 top-0 h-[11px] w-[22px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--color-paper)] ring-1 ring-[color:var(--color-line)]" />
        <span className="absolute left-1/2 bottom-0 h-[11px] w-[22px] -translate-x-1/2 translate-y-1/2 rounded-full bg-[color:var(--color-paper)] ring-1 ring-[color:var(--color-line)]" />
      </div>

      {/* ---- Main boarding information --------------------------------- */}
      <div
        className="flex h-full shrink-0 flex-col px-[30px] py-[26px]"
        style={{ width: BOARDING_INFO_W }}
      >
        <div className="flex items-start justify-between">
          <div>
            <Label>Passenger</Label>
            <p className="mt-[6px] font-display text-[26px] uppercase leading-none">Guest</p>
          </div>
          <div className="text-right">
            <Label>Class</Label>
            <p className="mt-[6px] font-mono text-[18px] uppercase tracking-[0.1em]">Archive</p>
          </div>
        </div>

        <Rule />

        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-[8px]">
          <div>
            <Label>From</Label>
            <p className="mt-[7px] font-display text-[38px] uppercase leading-none">Now</p>
          </div>
          <Plane />
          <div className="text-right">
            <Label>To</Label>
            <p className="mt-[7px] font-display text-[38px] uppercase leading-none">Forever</p>
          </div>
        </div>
        <div className="mt-[16px]">
          <Label>Route</Label>
          <p className="mt-[6px] font-mono text-[20px] uppercase tracking-[0.12em]">Memory → Archive</p>
        </div>

        <Rule />

        <div className="grid grid-cols-3 gap-x-[14px] gap-y-[18px]">
          <div>
            <Label>Flight</Label>
            <p className="mt-[6px] font-mono text-[20px] uppercase tracking-[0.08em]">{scent.code}</p>
          </div>
          <div>
            <Label>Gate</Label>
            <p className="mt-[6px] font-mono text-[20px] uppercase tracking-[0.08em]">{t.pass.gateValue}</p>
          </div>
          <div className="text-right">
            <Label>Seat</Label>
            <p className="mt-[6px] font-mono text-[20px] uppercase tracking-[0.08em]">{seat}</p>
          </div>
          <div>
            <Label>Boarding</Label>
            <p className="mt-[6px] font-mono text-[18px] tracking-[0.06em]">{stamp}</p>
          </div>
          <div className="col-span-2 text-right">
            <Label>Date</Label>
            <p className="mt-[6px] font-mono text-[18px] tracking-[0.06em]">{printedDate}</p>
          </div>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-x-[14px] border-t border-[color:var(--color-line)] pt-[16px]">
          <div>
            <Label>Edition</Label>
            <p className="mt-[6px] font-display text-[22px] uppercase leading-none">{edition.no} · {edition.code}</p>
          </div>
          <div className="text-right">
            <Label>Serial</Label>
            <p className="mt-[6px] font-mono text-[18px] tracking-[0.04em]">{serial}</p>
          </div>
        </div>
      </div>

      {/* ---- Perforation between main info and the tear-off stub -------- */}
      <div className="relative w-[40px] shrink-0 overflow-hidden">
        <span className="absolute left-1/2 top-[22px] bottom-[22px] w-px -translate-x-1/2 border-l border-dashed border-[color:var(--color-ink)]" />
        <span className="absolute left-1/2 top-0 h-[11px] w-[22px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--color-paper)] ring-1 ring-[color:var(--color-line)]" />
        <span className="absolute left-1/2 bottom-0 h-[11px] w-[22px] -translate-x-1/2 translate-y-1/2 rounded-full bg-[color:var(--color-paper)] ring-1 ring-[color:var(--color-line)]" />
      </div>

      {/* ---- Tear-off stub (nearest the printer slot) ------------------- */}
      <div
        className="flex h-full shrink-0 flex-col px-[24px] py-[24px]"
        style={{ width: BOARDING_STUB_W }}
      >
        <Label>Pass No.</Label>
        <p className="mt-[5px] font-mono text-[21px] uppercase tracking-[0.04em]">{passNo}</p>
        <div className="mt-[12px]">
          <Label>Serial</Label>
          <p className="mt-[4px] font-mono tracking-[0.04em]" style={{ fontSize: PASS_TYPE.stubSmall }}>{serial}</p>
        </div>

        <Rule />

        <div className="grid grid-cols-2 gap-x-[14px] gap-y-[13px]">
          <div>
            <Label>From</Label>
            <p className="mt-[4px] font-display text-[19px] uppercase leading-none">Now</p>
          </div>
          <div className="text-right">
            <Label>To</Label>
            <p className="mt-[4px] font-display text-[19px] uppercase leading-none">Forever</p>
          </div>
          <div>
            <Label>Flight</Label>
            <p className="mt-[4px] font-mono uppercase tracking-[0.04em]" style={{ fontSize: PASS_TYPE.stubSmall }}>{scent.code}</p>
          </div>
          <div className="text-right">
            <Label>Seat</Label>
            <p className="mt-[4px] font-mono uppercase tracking-[0.04em]" style={{ fontSize: PASS_TYPE.stubSmall }}>{seat}</p>
          </div>
          <div>
            <Label>Date</Label>
            <p className="mt-[4px] font-mono tracking-[0.03em]" style={{ fontSize: PASS_TYPE.stubTiny }}>{printedDate}</p>
          </div>
          <div className="text-right">
            <Label>Time</Label>
            <p className="mt-[4px] font-mono tracking-[0.03em]" style={{ fontSize: PASS_TYPE.stubTiny }}>{stamp}</p>
          </div>
        </div>

        <div className="mt-auto">
          <Barcode />
          <div className="mt-[10px] flex items-end justify-between gap-[10px]">
            <span
              className="font-mono uppercase tracking-[0.12em] text-silver-dim"
              style={{ fontSize: PASS_TYPE.stubTiny }}
            >
              Ed. {edition.no}
            </span>
            <div className="shrink-0 border border-[color:var(--color-ink)] p-[5px]">
              <Qr cell={3} seed={hashSeed(serial)} />
            </div>
          </div>
        </div>
      </div>

      <EdgeMark side="right">One of the archive. Made to last.</EdgeMark>
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
      <span className="text-silver-dim" style={{ fontSize: PASS_TYPE.edge }}>✦</span>
      <span
        className="absolute font-mono uppercase tracking-[0.2em] text-silver-dim"
        style={{
          fontSize: PASS_TYPE.edge,
          transform: side === "left" ? "rotate(-90deg)" : "rotate(90deg)",
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </span>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="font-mono uppercase tracking-[0.16em] text-silver-dim"
      style={{ fontSize: PASS_TYPE.label }}
    >
      {children}
    </p>
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
