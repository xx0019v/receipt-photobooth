"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/app/lib/i18n";

const WARNING_SECONDS = 15;

export default function InactivityWarning({
  onContinue,
  onEnd,
}: {
  onContinue: () => void;
  onEnd: () => void;
}) {
  const { sub } = useLang();
  const [left, setLeft] = useState(WARNING_SECONDS);

  useEffect(() => {
    const interval = setInterval(() => setLeft((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="kiosk-overlay"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="session-hold-title"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="flex h-full w-full flex-col px-[80px] pb-[80px] pt-[72px] text-left">
        <div className="flex items-center justify-between border-b border-[color:var(--color-line)] pb-[28px]">
          <span className="font-mono text-[18px] uppercase tracking-[0.36em] text-ink">Session hold</span>
          <span className="font-mono text-[14px] uppercase tracking-[0.3em] text-silver-dim">Privacy reset armed</span>
        </div>

        <div className="grid flex-1 grid-cols-[1fr_340px] items-center gap-[70px]">
          <div>
            <p className="font-mono text-[15px] uppercase tracking-[0.34em] text-silver-dim">Still composing?</p>
            <h2 id="session-hold-title" className="mt-[22px] max-w-[650px] font-display text-[92px] font-semibold leading-[0.88] tracking-[-0.03em]">
              Keep this session <span className="italic">open.</span>
            </h2>
            {sub && (
              <p className="jp-sub mt-[22px] text-[20px] text-silver-dim">
                続ける場合は、下のボタンをタップしてください
              </p>
            )}
          </div>

          <div className="flex flex-col items-end border-l border-[color:var(--color-line)] pl-[54px]">
            <span className="font-display text-[230px] font-semibold leading-[0.72] tracking-[-0.06em] tabular-nums" aria-label={`${left} seconds remaining`}>
              {String(left).padStart(2, "0")}
            </span>
            <span className="mt-[32px] font-mono text-[14px] uppercase tracking-[0.3em] text-silver-dim">
              seconds to reset
            </span>
          </div>
        </div>

        <div className="grid grid-cols-[0.72fr_1.28fr] gap-[24px] border-t border-[color:var(--color-line)] pt-[28px]">
          <button
            type="button"
            onClick={onEnd}
            className="press flex min-h-[116px] items-center justify-center border border-[color:var(--color-ink)] bg-paper-bright px-[34px] font-mono text-[19px] uppercase tracking-[0.26em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--color-ink)]"
            style={{ cursor: "pointer" }}
          >
            End session
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="press flex min-h-[116px] items-center justify-between bg-ink px-[42px] font-mono text-[22px] uppercase tracking-[0.28em] text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--color-ink)]"
            style={{ cursor: "pointer" }}
          >
            <span>Continue session</span>
            <span className="font-display text-[38px]" aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
