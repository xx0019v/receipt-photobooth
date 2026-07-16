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

  const turnTo = (index: number) => {
    const root = rootRef.current;
    const scene = root?.querySelectorAll<HTMLElement>(".scent-scene")[index];
    if (!scene) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scene.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };

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
                {/* The edition as a printed folio page: an oversized issue
                    numeral anchors the eye first, the name sets under it in
                    display caps, one line of character copy — then a full-
                    width issuing rail, not an inline text link. */}
                <button
                  type="button"
                  onClick={() => onSelect(scent)}
                  className="press group block w-full text-left"
                  style={{ cursor: "pointer" }}
                  aria-label={`Select edition ${edition.code}`}
                >
                  <div className="flex items-start gap-[36px]">
                    <span
                      aria-hidden="true"
                      className="font-display font-semibold leading-[0.78] tracking-[-0.04em] text-ink"
                      style={{ fontSize: 210 }}
                    >
                      {edition.no}
                    </span>
                    <span className="mt-[26px] block h-[150px] w-px bg-[color:var(--color-line)]" aria-hidden="true" />
                    <span className="mt-[30px] block font-mono text-[15px] uppercase leading-[2] tracking-[0.34em] text-silver-dim">
                      Edition
                      <br />
                      {edition.no} / {total}
                      <br />
                      of the archive
                    </span>
                  </div>
                  <h2 className="mt-[6px] font-display text-[150px] font-semibold uppercase leading-[0.84] tracking-[-0.03em]">
                    {edition.code}
                  </h2>
                  <p className="mt-[26px] font-display text-[32px] italic leading-[1.1] text-ink-soft">
                    {edition.character.en}
                  </p>
                  {sub && (
                    <p className="jp-sub mt-[8px] text-[18px] text-silver-dim">
                      {edition.character.jp}
                    </p>
                  )}

                  {/* issuing rail — a machine control strip, minimum 96px */}
                  <span className="mt-[54px] flex min-h-[96px] w-full items-center justify-between border border-[color:var(--color-ink)] bg-ink px-[44px] text-paper">
                    <span className="flex flex-col gap-[3px]">
                      <span className="font-mono text-[20px] uppercase tracking-[0.34em]">
                        Select this edition
                      </span>
                      {sub && (
                        <span className="jp-sub text-[14px] normal-case text-paper/55">
                          このエディションにする
                        </span>
                      )}
                    </span>
                    <span className="font-display text-[38px]">→</span>
                  </span>
                </button>
              </div>

              <div className="flex h-[150px] items-center justify-center">
                {i < EDITIONS.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => turnTo(i + 1)}
                    aria-label={`Next edition: ${EDITIONS[i + 1].code}`}
                    className="press scent-hint flex min-h-[96px] w-full items-center justify-between border-t border-[color:var(--color-line)] text-silver-dim"
                    style={{ cursor: "pointer" }}
                  >
                    <span className="flex items-baseline gap-[18px] text-left">
                      <span className="font-mono text-[13px] uppercase tracking-[0.34em]">Next edition</span>
                      <span className="font-display text-[28px] font-semibold uppercase tracking-[-0.01em] text-ink">
                        {EDITIONS[i + 1].code}
                      </span>
                    </span>
                    <svg width="18" height="11" viewBox="0 0 15 9" fill="none" aria-hidden="true">
                      <path
                        d="M1 1L7.5 7.5L14 1"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => turnTo(0)}
                    aria-label={`Return to first edition: ${EDITIONS[0].code}`}
                    className="press flex min-h-[96px] w-full items-center justify-between border-t border-[color:var(--color-line)] text-silver-dim"
                    style={{ cursor: "pointer" }}
                  >
                    <span className="flex items-baseline gap-[18px] text-left">
                      <span className="font-mono text-[13px] uppercase tracking-[0.34em]">Back to first</span>
                      <span className="font-display text-[28px] font-semibold uppercase tracking-[-0.01em] text-ink">
                        {EDITIONS[0].code}
                      </span>
                    </span>
                    <svg width="18" height="11" viewBox="0 0 15 9" fill="none" aria-hidden="true" className="rotate-180">
                      <path d="M1 1L7.5 7.5L14 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
