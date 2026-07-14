"use client";

import { useEffect, useRef } from "react";
import { EDITIONS, scentForEdition, type Scent } from "@/app/lib/edition";
import { useLang } from "@/app/lib/i18n";
import { motifForScent } from "@/app/lib/session";

/**
 * SELECT AN EDITION — a vertical chapter sequence, not a four-up menu. One
 * edition fills the screen at a time; scrolling turns the page like an
 * interactive publication. The guest confirms the edition in view. No scent /
 * fragrance language, no cards, no object-like chrome — the silver mark is
 * used only as a faint edition seal in the margin.
 */
export default function ScentScreen({
  onSelect,
}: {
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

  const total = String(EDITIONS.length).padStart(2, "0");

  return (
    <div ref={rootRef} className="scent-scroll">
      {EDITIONS.map((edition, i) => {
        const scent = scentForEdition(edition);
        const seal = motifForScent(scent);
        return (
          <section key={edition.no} className="scent-scene">
            {/* edition seal — a faint registration ghost in the margin */}
            <img
              src={seal.path}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -right-[180px] top-1/2 h-[640px] w-[640px] -translate-y-1/2 object-contain opacity-[0.045] grayscale"
            />

            <div className="scene-inner relative z-[2] flex h-full flex-col px-[120px]">
              <div className="flex items-center justify-between pt-[150px]">
                <p className="kicker">Select an Edition</p>
                <p className="font-mono text-[15px] tracking-[0.32em] text-silver-dim">
                  {edition.no}
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
                  aria-label={`Select edition ${edition.code}`}
                >
                  <span className="block font-mono text-[15px] uppercase tracking-[0.34em] text-silver-dim">
                    Edition {edition.no}
                  </span>
                  <h2 className="mt-[18px] font-display text-[172px] font-semibold uppercase leading-[0.82] tracking-[-0.03em]">
                    {edition.code}
                  </h2>
                  <p className="mt-[34px] font-display text-[38px] italic leading-[1.05] text-ink-soft">
                    {edition.character.en}
                  </p>
                  {sub && (
                    <p className="jp-sub mt-[10px] text-[19px] text-silver-dim">
                      {edition.character.jp}
                    </p>
                  )}

                  <div className="mt-[52px] flex items-end border-t border-[color:var(--color-line)] pt-[26px]">
                    <span className="font-mono text-[13px] uppercase tracking-[0.34em] text-silver-dim">
                      Limited edition · 1 of the archive
                    </span>
                    <span className="scent-select ml-auto font-mono text-[16px] uppercase tracking-[0.34em] text-ink">
                      Select this edition
                    </span>
                  </div>
                  {sub && (
                    <div className="mt-[8px] flex">
                      <span className="jp-sub ml-auto text-[15px] text-silver-dim">
                        このエディションにする
                      </span>
                    </div>
                  )}
                </button>
              </div>

              <div className="flex h-[150px] items-center justify-center">
                {i < EDITIONS.length - 1 ? (
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
                    {sub ? "見ているエディションをタップ" : "Tap an edition to choose"}
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
