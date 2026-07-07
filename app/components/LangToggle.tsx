"use client";

import { useLang, type Lang } from "@/app/lib/i18n";

const OPTIONS: { id: Lang; label: string }[] = [
  { id: "en", label: "EN" },
  { id: "jp", label: "日本語" },
];

/** Discreet EN / JP switch, pinned to the stage corner on every screen. */
export default function LangToggle() {
  const { lang, setLang } = useLang();

  return (
    <div
      className="absolute right-[40px] top-[38px] z-[80] flex items-center gap-[2px] border border-[color:var(--color-ink)] bg-paper/70 backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
    >
      {OPTIONS.map((o) => {
        const active = lang === o.id;
        return (
          <button
            key={o.id}
            onClick={(e) => {
              e.stopPropagation();
              setLang(o.id);
            }}
            className={`press px-[22px] py-[12px] font-mono text-[17px] uppercase tracking-[0.2em] ${
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
