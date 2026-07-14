"use client";

import { useEffect, useRef } from "react";
import type { Scent } from "@/app/lib/edition";
import { useLang } from "@/app/lib/i18n";
import { motifForScent } from "@/app/lib/session";

/**
 * THE SCENT — a vertical chapter sequence, not a four-up menu. One scent fills
 * the screen at a time; scrolling reveals the next like turning the page of a
 * fragrance editorial. The guest confirms the scent currently in view. White
 * space, black type, a ghost of the scent's silver mark in the margin — no
 * cards, no object-like chrome, no web-form buttons.
 */
export default function ScentScreen({
  scents,
  onSelect,
}: {
  scents: Scent[];
  onSelect: (scent: Scent) => void;
}) {
  const { sub } = useLang();
  const rootRef = useRef<HTMLDivElement>(null);

  // Reveal each scene as it settles into view — a quiet page-turn, not a
  // carousel. Reduced-motion users get the static composition (see globals.css).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const scenes = Array.from(root.querySelectorAll<HTMLElement>(".scent-scene"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) e.target.classList.add("is-in");
      },
      { root, threshold: 0.55 },
    );
    scenes.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  const total = String(scents.length).padStart(2, "0");

  return (
    <div ref={rootRef} className="scent-scroll">
      {scents.map((scent, i) => {
        const symbol = motifForScent(scent);
        const index = String(i + 1).padStart(2, "0");
        return (
          <section key={scent.id} className="scent-scene">
            {/* the scent's silver mark — a ghost in the margin, never an object */}
            <img
              src={symbol.path}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -right-[180px] top-1/2 h-[640px] w-[640px] -translate-y-1/2 object-contain opacity-[0.05] grayscale"
            />

            <div className="scene-inner relative z-[2] flex h-full flex-col px-[120px]">
              <div className="flex items-center justify-between pt-[150px]">
                <p className="kicker">The Scent</p>
                <p className="font-mono text-[15px] tracking-[0.32em] text-silver-dim">
                  {index}
                  <span className="mx-[8px] text-[color:var(--color-line)]">/</span>
                  {total}
                </p>
              </div>

              <div className="flex flex-1 flex-col justify-center">
                <button
                  type="button"
                  onClick={() => onSelect(scent)}
                  className="press group block w-full text-left"
                  style={{ cursor: "pointer" }}
                  aria-label={`Select ${scent.name}`}
                >
                  <span className="block font-mono text-[15px] uppercase tracking-[0.3em] text-silver-dim">
                    {scent.mood.en}
                  </span>
                  <h2 className="mt-[18px] font-display text-[150px] font-semibold uppercase leading-[0.82] tracking-[-0.03em]">
                    {scent.name}
                  </h2>
                  <p className="mt-[32px] font-mono text-[19px] uppercase tracking-[0.24em] text-ink-soft">
                    {scent.notes.map((n) => n.en).join("  ·  ")}
                  </p>

                  <div className="mt-[46px] flex items-end gap-[48px] border-t border-[color:var(--color-line)] pt-[26px]">
                    <div>
                      <p className="font-mono text-[12px] uppercase tracking-[0.3em] text-silver-dim">
                        Destination
                      </p>
                      <p className="mt-[8px] font-display text-[40px] uppercase leading-none">
                        {scent.destination.en}
                      </p>
                      {sub && (
                        <p className="jp-sub mt-[7px] text-[16px] text-silver-dim">
                          {scent.mood.jp}
                        </p>
                      )}
                    </div>
                    <div className="ml-auto flex flex-col items-end text-right">
                      <span className="scent-select font-mono text-[16px] uppercase tracking-[0.34em] text-ink">
                        Select this scent
                      </span>
                      {sub && (
                        <span className="jp-sub mt-[7px] text-[15px] text-silver-dim">
                          この香りにする
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </div>

              <div className="flex h-[150px] items-center justify-center">
                {i < scents.length - 1 ? (
                  <span className="scent-hint flex flex-col items-center gap-[8px] text-silver-dim">
                    <span className="font-mono text-[13px] uppercase tracking-[0.4em]">Scroll</span>
                    <svg width="15" height="9" viewBox="0 0 15 9" fill="none" aria-hidden="true">
                      <path
                        d="M1 1L7.5 7.5L14 1"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                ) : (
                  <span className="font-mono text-[13px] uppercase tracking-[0.4em] text-silver-dim">
                    {sub ? "見ている香りをタップ" : "Tap a scent to choose"}
                  </span>
                )}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
