import Portrait from "./Portrait";
import { BRAND, editionDate, editionTime, issueNo } from "@/app/lib/edition";
import type { Frame } from "@/app/lib/api";

/**
 * The printed artefact — how the strip looks coming out of the thermal
 * receipt printer. Reused in Review, Printing and Done screens.
 * Frames with a `url` show the real capture; otherwise the mock Portrait.
 */
export default function ReceiptStrip({
  frames,
  serial,
  time,
}: {
  frames: Frame[];
  serial: string;
  time?: string;
}) {
  const stamp = time ?? editionTime();

  return (
    <div className="relative bg-paper-bright text-ink shadow-[0_30px_80px_-40px_rgba(0,0,0,0.6)]">
      {/* perforated top */}
      <Perf />

      <div className="px-[46px] pb-[8px] pt-[44px]">
        {/* masthead */}
        <div className="text-center">
          <p className="font-display text-[46px] font-semibold leading-none tracking-[-0.01em]">
            {BRAND}
          </p>
          <p className="mt-[14px] font-mono text-[15px] uppercase tracking-[0.42em] text-silver-dim">
            Portrait Edition
          </p>
        </div>

        <Dashed className="my-[26px]" />

        {/* meta */}
        <div className="grid grid-cols-2 gap-y-[10px] font-mono text-[17px] uppercase tracking-[0.12em]">
          <span className="text-silver-dim">Date</span>
          <span className="text-right">{editionDate()}</span>
          <span className="text-silver-dim">Time</span>
          <span className="text-right">{stamp}</span>
          <span className="text-silver-dim">Issue</span>
          <span className="text-right">{issueNo()}</span>
        </div>

        <Dashed className="my-[26px]" />

        {/* frames */}
        <div className="flex flex-col gap-[10px]">
          {frames.map((f) => (
            <div
              key={f.seed}
              className="aspect-[4/3] w-full overflow-hidden bg-ink"
            >
              {f.url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={f.url}
                  alt=""
                  className="h-full w-full object-cover grayscale contrast-125"
                />
              ) : (
                <Portrait seed={f.seed} print />
              )}
            </div>
          ))}
        </div>

        <Dashed className="my-[26px]" />

        {/* receipt line items */}
        <div className="flex flex-col gap-[12px] font-mono text-[18px] uppercase tracking-[0.06em]">
          <Line label={`${frames.length}× Portrait strip`} value="0.00" />
          <Line label="Confidence" value="MAX" />
          <Line label="Service" value="Complimentary" />
          <div className="mt-[6px] border-t border-dashed border-[color:var(--color-ink)] pt-[16px]">
            <div className="flex items-end justify-between">
              <span className="font-display text-[30px]">Total</span>
              <span className="font-display text-[30px] italic">One smile</span>
            </div>
          </div>
        </div>

        <Dashed className="my-[26px]" />

        {/* barcode + serial */}
        <Barcode />
        <p className="mt-[12px] text-center font-mono text-[16px] tracking-[0.3em]">
          {serial}
        </p>

        {/* footer */}
        <p className="mt-[26px] text-center font-display text-[26px] italic leading-tight">
          Thank you — keep this moment.
        </p>
        <p className="mb-[6px] mt-[14px] text-center font-mono text-[13px] uppercase tracking-[0.3em] text-silver-dim">
          the-receipt.studio
        </p>
      </div>

      {/* cut line */}
      <CutLine />
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-[16px]">
      <span>{label}</span>
      <span className="mx-[10px] flex-1 translate-y-[-4px] border-b border-dotted border-[color:var(--color-silver)]" />
      <span>{value}</span>
    </div>
  );
}

function Dashed({ className = "" }: { className?: string }) {
  return (
    <div
      className={`border-t border-dashed border-[color:var(--color-ink)] ${className}`}
    />
  );
}

function Perf() {
  return (
    <div
      className="h-[14px] w-full"
      style={{
        background:
          "radial-gradient(circle at 8px 0, transparent 0 7px, var(--color-paper-bright) 7px) 0 0 / 22px 14px repeat-x",
      }}
    />
  );
}

function CutLine() {
  return (
    <div className="relative flex items-center gap-[14px] px-[30px] py-[24px]">
      <span className="text-[22px]">✂</span>
      <span className="flex-1 border-t-2 border-dashed border-[color:var(--color-silver)]" />
    </div>
  );
}

function Barcode() {
  // deterministic bar pattern
  const bars = "413132214231341221432312143132".split("");
  return (
    <div className="flex h-[70px] items-stretch justify-center gap-[3px]">
      {bars.map((w, i) => (
        <span
          key={i}
          className="bg-ink"
          style={{ width: Number(w) * 2.4 }}
        />
      ))}
    </div>
  );
}
