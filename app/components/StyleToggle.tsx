"use client";

import { usePrintStyle, type PrintStyle } from "@/app/lib/printStyle";

const OPTIONS: { id: PrintStyle; label: string }[] = [
  { id: "pass", label: "PASS" },
  { id: "cover", label: "COVER" },
];

/** Operator control: choose which artefact the printer produces. */
export default function StyleToggle() {
  const { style, setStyle } = usePrintStyle();

  return (
    <div
      className="absolute right-[40px] top-[94px] z-[80] flex items-center gap-[2px] border border-[color:var(--color-ink)] bg-paper/70 backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
    >
      {OPTIONS.map((o) => {
        const active = style === o.id;
        return (
          <button
            key={o.id}
            onClick={(e) => {
              e.stopPropagation();
              setStyle(o.id);
            }}
            className={`press px-[18px] py-[12px] font-mono text-[15px] uppercase tracking-[0.2em] ${
              active ? "bg-ink text-paper" : "text-silver-dim"
            }`}
            style={{ cursor: "pointer" }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
