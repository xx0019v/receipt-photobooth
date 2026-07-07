import { BRAND, SUB_BRAND, editionDate, issueNo } from "@/app/lib/edition";

/**
 * The magazine masthead. Compact variant for in-flow screens,
 * grand variant for the idle cover.
 */
export default function Masthead({
  variant = "compact",
}: {
  variant?: "compact" | "cover";
}) {
  if (variant === "cover") {
    return (
      <header className="px-[80px] pt-[70px]">
        <div className="flex items-center justify-between kicker">
          <span>{issueNo()}</span>
          <span>{SUB_BRAND} EDITION</span>
          <span>{editionDate()}</span>
        </div>
        <div className="rule mt-[26px]" />
      </header>
    );
  }

  return (
    <header className="px-[80px] pt-[64px]">
      <div className="flex items-baseline justify-between">
        <span className="font-display text-[38px] leading-none tracking-[-0.01em]">
          {BRAND}
        </span>
        <span className="kicker">{issueNo()}</span>
      </div>
      <div className="rule-hair mt-[22px]" />
    </header>
  );
}
