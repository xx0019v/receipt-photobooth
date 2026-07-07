"use client";

import ReceiptStrip from "@/app/components/ReceiptStrip";
import { type Scent } from "@/app/lib/edition";
import { useLang } from "@/app/lib/i18n";

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
  const { t, sub } = useLang();

  return (
    <div className="flex h-full flex-col">
      <div className="px-[80px] pt-[64px]">
        <div className="flex items-baseline justify-between">
          <p className="kicker">{t.review.step}</p>
          <p className="font-mono text-[18px] uppercase tracking-[0.3em] text-silver-dim">
            {scent.code} · {serial}
          </p>
        </div>
        <h2 className="mt-[16px] font-display text-[84px] font-semibold leading-[0.9] tracking-[-0.02em]">
          {t.review.title[0]} <span className="italic">{t.review.title[1]}</span>
        </h2>
        <p className="mt-[14px] text-[25px] text-ink-soft">
          {scent.mood.en} — {scent.name}. {t.review.subTail}
        </p>
      </div>

      {/* boarding pass preview */}
      <div className="relative flex flex-1 items-start justify-center overflow-hidden px-[80px] pt-[40px]">
        <div className="w-[472px] pass-reveal drop-shadow-[0_40px_70px_rgba(0,0,0,0.28)]">
          <ReceiptStrip frames={frames} scent={scent} serial={serial} />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[120px] bg-gradient-to-t from-[color:var(--color-paper)] to-transparent" />
      </div>

      {/* actions */}
      <div className="grid grid-cols-[1fr_1.5fr] gap-[24px] px-[80px] pb-[86px] pt-[34px]">
        <button
          onClick={onRetake}
          className="press flex flex-col items-center justify-center gap-[5px] border border-[color:var(--color-ink)] py-[38px]"
          style={{ cursor: "pointer" }}
        >
          <span className="font-mono text-[23px] uppercase tracking-[0.3em]">
            {t.review.retake}
          </span>
          {sub && (
            <span className="jp-sub text-[15px] text-silver-dim">
              {sub.review.retake}
            </span>
          )}
        </button>
        <button
          onClick={onPrint}
          className="card press flex items-center justify-center gap-[22px] bg-ink py-[38px] text-paper"
          style={{ cursor: "pointer" }}
        >
          <span className="flex flex-col items-start gap-[5px]">
            <span className="font-mono text-[23px] uppercase tracking-[0.3em]">
              {t.review.print}
            </span>
            {sub && (
              <span className="jp-sub text-[16px] text-paper/55">{sub.review.print}</span>
            )}
          </span>
          <span className="font-display text-[40px]">→</span>
        </button>
      </div>
    </div>
  );
}
