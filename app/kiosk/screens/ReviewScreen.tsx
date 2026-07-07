"use client";

import ReceiptStrip from "@/app/components/ReceiptStrip";
import type { Scent } from "@/app/lib/edition";

export default function ReviewScreen({
  frames,
  scent,
  serial,
  onPrint,
  onRetake,
}: {
  frames: number[];
  scent: Scent;
  serial: string;
  onPrint: () => void;
  onRetake: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-[80px] pt-[64px]">
        <div className="flex items-baseline justify-between">
          <p className="kicker">Step IV — The Proof</p>
          <p className="font-mono text-[18px] uppercase tracking-[0.3em] text-silver-dim">
            {serial}
          </p>
        </div>
        <h2 className="mt-[18px] font-display text-[88px] font-semibold leading-[0.9] tracking-[-0.02em]">
          Your scent <span className="italic">memory.</span>
        </h2>
        <p className="mt-[16px] text-[26px] text-ink-soft">
          {scent.mood} — {scent.name}. Print it, or shoot again.
        </p>
      </div>

      {/* receipt preview */}
      <div className="relative flex flex-1 items-start justify-center overflow-hidden px-[80px] pt-[44px]">
        <div className="w-[470px] anim-fade-up">
          <ReceiptStrip frames={frames} scent={scent} serial={serial} />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[120px] bg-gradient-to-t from-[color:var(--color-paper)] to-transparent" />
      </div>

      {/* actions */}
      <div className="grid grid-cols-[1fr_1.4fr] gap-[24px] px-[80px] pb-[86px] pt-[36px]">
        <button
          onClick={onRetake}
          className="press flex items-center justify-center border border-[color:var(--color-ink)] py-[44px]"
          style={{ cursor: "none" }}
        >
          <span className="font-mono text-[24px] uppercase tracking-[0.34em]">
            Retake
          </span>
        </button>
        <button
          onClick={onPrint}
          className="press flex items-center justify-center gap-[22px] bg-ink py-[44px] text-paper"
          style={{ cursor: "none" }}
        >
          <span className="font-mono text-[24px] uppercase tracking-[0.34em]">
            Print it
          </span>
          <span className="font-display text-[40px]">→</span>
        </button>
      </div>
    </div>
  );
}
