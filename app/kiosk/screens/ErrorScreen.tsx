"use client";

import { ERROR_COPY, type ErrorKind } from "@/app/lib/errors";
import { useLang } from "@/app/lib/i18n";
import IssueCore from "@/app/components/motion/IssueCore";

/**
 * Kiosk recovery screen. White, calm, two actions max. Session state
 * (frames, edition, serial, issueDate, quote) lives in KioskApp and is
 * untouched by an error — retry resumes exactly where the guest left off,
 * never regenerating identity or double-printing.
 */
export default function ErrorScreen({
  kind,
  onPrimary,
  onSecondary,
}: {
  kind: ErrorKind;
  onPrimary: () => void;
  onSecondary: () => void;
}) {
  const { sub } = useLang();
  const copy = ERROR_COPY[kind];

  return (
    <div
      className="flex h-full flex-col items-center justify-center bg-paper px-[80px] text-center"
      role="alert"
      aria-live="assertive"
    >
      <div className="mb-[36px] opacity-70">
        <IssueCore state="calibrate" progress={0} size={80} showLabel={false} />
      </div>
      <p className="kicker">RECOVERY</p>
      <h2 className="mt-[18px] font-display text-[64px] font-semibold leading-[0.95] tracking-[-0.02em]">
        {copy.title}
      </h2>
      {sub && <p className="jp-sub mt-[10px] text-[19px] text-silver-dim">{copy.jp}</p>}

      <p className="mt-[26px] max-w-[640px] text-[19px] font-light leading-[1.6] text-ink-soft">
        {copy.detail}
      </p>
      {sub && (
        <p className="jp-sub mt-[6px] max-w-[640px] text-[15px] text-silver-dim">
          {copy.detailJp}
        </p>
      )}

      <div className="mt-[52px] grid w-full max-w-[760px] grid-cols-2 gap-[24px]">
        <button
          onClick={onSecondary}
          className="press flex min-h-[112px] flex-col items-center justify-center gap-[6px] border border-[color:var(--color-ink)] bg-paper-bright px-[28px] py-[24px]"
          style={{ cursor: "pointer" }}
        >
          <span className="font-mono text-[21px] uppercase tracking-[0.26em]">
            {copy.secondary}
          </span>
          {sub && <span className="jp-sub text-[16px] text-silver-dim">{copy.secondaryJp}</span>}
        </button>
        <button
          onClick={onPrimary}
          className="press flex min-h-[112px] items-center justify-center border border-[color:var(--color-ink)] bg-ink px-[28px] py-[24px] text-paper"
          style={{ cursor: "pointer" }}
        >
          <span className="flex flex-col items-center gap-[4px]">
            <span className="font-mono text-[21px] uppercase tracking-[0.26em]">
              {copy.primary}
            </span>
            {sub && <span className="jp-sub text-[16px] text-paper/60">{copy.primaryJp}</span>}
          </span>
        </button>
      </div>
    </div>
  );
}
