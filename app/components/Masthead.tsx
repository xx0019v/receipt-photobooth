"use client";

import { BRAND, editionDate, issueNo } from "@/app/lib/edition";
import { useLang } from "@/app/lib/i18n";

/**
 * The magazine masthead. Compact variant for in-flow screens,
 * grand variant for the idle cover. The far right is kept clear for the
 * language toggle.
 */
export default function Masthead({
  variant = "compact",
}: {
  variant?: "compact" | "cover";
}) {
  const { t } = useLang();

  if (variant === "cover") {
    return (
      <header className="px-[80px] pt-[70px]">
        <div className="flex items-center gap-[40px] kicker">
          <span>{issueNo()}</span>
          <span>{editionDate()}</span>
          <span className="flex-1 text-center pr-[150px]">
            {t.cover.portrait}
          </span>
        </div>
        <div className="rule mt-[26px]" />
      </header>
    );
  }

  return (
    <header className="px-[80px] pt-[64px]">
      <div className="flex items-baseline gap-[26px]">
        <span className="font-display text-[38px] leading-none tracking-[-0.01em]">
          {BRAND}
        </span>
        <span className="kicker">{issueNo()}</span>
      </div>
      <div className="rule-hair mt-[22px]" />
    </header>
  );
}
