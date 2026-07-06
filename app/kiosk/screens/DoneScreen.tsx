"use client";

import { useEffect, useState } from "react";
import Masthead from "@/app/components/Masthead";

const AUTO_RETURN = 12_000;

export default function DoneScreen({
  serial,
  onReset,
}: {
  serial: string;
  onReset: () => void;
}) {
  const [left, setLeft] = useState(Math.round(AUTO_RETURN / 1000));

  useEffect(() => {
    const t = setTimeout(onReset, AUTO_RETURN);
    const i = setInterval(() => setLeft((n) => Math.max(0, n - 1)), 1000);
    return () => {
      clearTimeout(t);
      clearInterval(i);
    };
  }, [onReset]);

  return (
    <button
      onClick={onReset}
      className="absolute inset-0 h-full w-full text-left"
      style={{ cursor: "none" }}
    >
      <div className="flex h-full flex-col">
        <Masthead />

        <div className="flex flex-1 flex-col items-center justify-center px-[80px] text-center">
          <p className="kicker anim-fade-up">Edition Complete</p>

          <h2 className="anim-fade-up delay-1 mt-[30px] font-display font-semibold leading-[0.86] tracking-[-0.02em]">
            <span className="block text-[124px]">Collect your</span>
            <span className="block text-[124px] italic">receipt.</span>
          </h2>

          <p className="anim-fade-up delay-2 mt-[40px] max-w-[720px] text-[30px] leading-[1.4] text-ink-soft">
            Tear along the dotted line below the slot. Scan the code to keep a
            digital copy.
          </p>

          {/* QR */}
          <div className="anim-fade-up delay-3 mt-[70px] flex flex-col items-center">
            <div className="border border-[color:var(--color-ink)] p-[22px]">
              <Qr />
            </div>
            <p className="mt-[20px] font-mono text-[18px] uppercase tracking-[0.3em] text-silver-dim">
              {serial}
            </p>
          </div>
        </div>

        {/* footer */}
        <div className="px-[80px] pb-[86px]">
          <div className="rule-hair" />
          <div className="mt-[28px] flex items-center justify-between font-mono text-[18px] uppercase tracking-[0.3em]">
            <span className="text-silver-dim">Tap anywhere for next guest</span>
            <span>New edition in {left}s</span>
          </div>
        </div>
      </div>
    </button>
  );
}

/** Deterministic decorative QR placeholder (swap for a real code later). */
function Qr() {
  const n = 21;
  const cells: boolean[] = [];
  let s = 7;
  for (let i = 0; i < n * n; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    cells.push((s >> 16) % 2 === 0);
  }
  const finder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);

  return (
    <div
      className="grid bg-paper-bright"
      style={{
        gridTemplateColumns: `repeat(${n}, 12px)`,
        gridTemplateRows: `repeat(${n}, 12px)`,
      }}
    >
      {cells.map((on, i) => {
        const r = Math.floor(i / n);
        const c = i % n;
        const isFinder = finder(r, c);
        const filled = isFinder
          ? (r < 7 && c < 7 && (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4))) ||
            (r < 7 && c >= n - 7 && (r === 0 || r === 6 || c === n - 1 || c === n - 7 || (r >= 2 && r <= 4 && c >= n - 5 && c <= n - 3))) ||
            (r >= n - 7 && c < 7 && (r === n - 1 || r === n - 7 || c === 0 || c === 6 || (r >= n - 5 && r <= n - 3 && c >= 2 && c <= 4)))
          : on;
        return (
          <span
            key={i}
            style={{ background: filled ? "var(--color-ink)" : "transparent" }}
          />
        );
      })}
    </div>
  );
}
