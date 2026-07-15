"use client";

import { useLang } from "@/app/lib/i18n";

export default function InactivityWarning({
  onContinue,
  onEnd,
}: {
  onContinue: () => void;
  onEnd: () => void;
}) {
  const { sub } = useLang();
  return (
    <div className="kiosk-overlay" role="alertdialog" aria-live="assertive">
      <div className="flex w-[760px] flex-col items-center border border-[color:var(--color-ink)] bg-paper-bright px-[64px] py-[64px] text-center">
        <p className="kicker">SESSION</p>
        <h2 className="mt-[16px] font-display text-[46px] font-semibold leading-[1] tracking-[-0.02em]">
          Session still active?
        </h2>
        {sub && (
          <p className="jp-sub mt-[10px] text-[17px] text-silver-dim">
            画面をタップして続ける
          </p>
        )}
        <div className="mt-[40px] grid w-full grid-cols-2 gap-[20px]">
          <button
            onClick={onEnd}
            className="press flex min-h-[80px] items-center justify-center border border-[color:var(--color-ink)] bg-paper-bright font-mono text-[16px] uppercase tracking-[0.26em]"
            style={{ cursor: "pointer" }}
          >
            End session
          </button>
          <button
            onClick={onContinue}
            className="press flex min-h-[80px] items-center justify-center border border-[color:var(--color-ink)] bg-ink font-mono text-[16px] uppercase tracking-[0.26em] text-paper"
            style={{ cursor: "pointer" }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
