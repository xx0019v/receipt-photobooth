import Portrait from "./Portrait";
import Qr from "./Qr";
import {
  BRAND,
  CLOSING,
  DOMAIN,
  SUB_BRAND,
  editionDate,
  editionTime,
  issueNo,
  type Scent,
} from "@/app/lib/edition";

/**
 * The printed artefact — how the strip looks coming off the thermal printer.
 * Reused across Review, Printing and Done. Keep this layout print-accurate;
 * it doubles as the reference for the real receipt render later.
 */
export default function ReceiptStrip({
  frames,
  scent,
  serial,
  time,
}: {
  frames: number[];
  scent: Scent;
  serial: string;
  time?: string;
}) {
  const stamp = time ?? editionTime();

  return (
    <div className="relative bg-paper-bright text-ink shadow-[0_30px_80px_-40px_rgba(0,0,0,0.6)]">
      <Perf />

      <div className="px-[46px] pb-[8px] pt-[44px]">
        {/* masthead */}
        <div className="text-center">
          <p className="font-display text-[46px] font-semibold leading-none tracking-[-0.01em]">
            {BRAND}
          </p>
          <p className="mt-[14px] font-mono text-[15px] uppercase tracking-[0.42em] text-silver-dim">
            {SUB_BRAND}
          </p>
        </div>

        <Dashed className="my-[24px]" />

        {/* meta */}
        <div className="grid grid-cols-2 gap-y-[9px] font-mono text-[17px] uppercase tracking-[0.12em]">
          <span className="text-silver-dim">Date</span>
          <span className="text-right">{editionDate()}</span>
          <span className="text-silver-dim">Time</span>
          <span className="text-right">{stamp}</span>
          <span className="text-silver-dim">Issue</span>
          <span className="text-right">{issueNo()}</span>
          <span className="text-silver-dim">Serial</span>
          <span className="text-right">{serial}</span>
        </div>

        <div className="sillage my-[22px]" />

        {/* scent block — note pyramid */}
        <div className="text-center">
          <p className="font-mono text-[14px] uppercase tracking-[0.4em] text-silver-dim">
            The Scent — {scent.index}
          </p>
          <p className="mt-[10px] font-display text-[40px] leading-none">
            {scent.mood} <span className="italic">/ {scent.name}</span>
          </p>
          <div className="mt-[20px] grid grid-cols-3 gap-[8px]">
            {(["Top", "Heart", "Base"] as const).map((tier, i) => (
              <div key={tier}>
                <p className="font-mono text-[12px] uppercase tracking-[0.28em] text-silver-dim">
                  {tier}
                </p>
                <p className="mt-[6px] font-display text-[22px] italic leading-tight">
                  {scent.notes[i]}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="sillage my-[22px]" />

        {/* frames */}
        <div className="flex flex-col gap-[10px]">
          {frames.map((f) => (
            <div key={f} className="aspect-[4/3] w-full overflow-hidden bg-ink">
              <Portrait seed={f - 1} print />
            </div>
          ))}
        </div>

        <Dashed className="my-[24px]" />

        {/* editorial phrase */}
        <p className="text-center font-display text-[30px] italic leading-[1.25]">
          “{scent.phrase}”
        </p>

        <Dashed className="my-[24px]" />

        {/* receipt line items */}
        <div className="flex flex-col gap-[11px] font-mono text-[18px] uppercase tracking-[0.06em]">
          <Line label="1× Scent memory" value="0.00" />
          <Line label="Mood" value={scent.mood} />
          <Line label="Frames" value={`${frames.length} captured`} />
          <div className="mt-[6px] border-t border-dashed border-[color:var(--color-ink)] pt-[16px]">
            <div className="flex items-end justify-between">
              <span className="font-display text-[30px]">Total</span>
              <span className="font-display text-[30px] italic">One moment</span>
            </div>
          </div>
        </div>

        <Dashed className="my-[24px]" />

        {/* barcode + qr */}
        <Barcode />
        <div className="mt-[22px] flex items-center gap-[26px]">
          <div className="border border-[color:var(--color-ink)] p-[10px]">
            <Qr cell={6} seed={hashSeed(serial)} />
          </div>
          <div className="flex-1 font-mono text-[15px] uppercase leading-[1.6] tracking-[0.16em] text-silver-dim">
            <p>Scan to keep</p>
            <p>a digital copy.</p>
            <p className="mt-[8px] text-ink">{serial}</p>
          </div>
        </div>

        {/* closing */}
        <p className="mt-[26px] text-center font-display text-[26px] italic leading-tight">
          {CLOSING}
        </p>
        <p className="mb-[6px] mt-[14px] text-center font-mono text-[13px] uppercase tracking-[0.3em] text-silver-dim">
          {DOMAIN}
        </p>
      </div>

      <CutLine />
    </div>
  );
}

function hashSeed(s: string): number {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0x7fffffff;
  return h || 7;
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
  const bars = "413132214231341221432312143132".split("");
  return (
    <div className="flex h-[70px] items-stretch justify-center gap-[3px]">
      {bars.map((w, i) => (
        <span key={i} className="bg-ink" style={{ width: Number(w) * 2.4 }} />
      ))}
    </div>
  );
}
