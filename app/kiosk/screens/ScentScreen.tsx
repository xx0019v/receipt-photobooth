"use client";

import { useEffect, useRef } from "react";
import { EDITIONS, scentForEdition, type Scent } from "@/app/lib/edition";
import { useLang } from "@/app/lib/i18n";
import type { ChromeAsset } from "@/app/lib/chromeAssets";
import { motifsForScent } from "@/app/lib/session";

/**
 * SELECT AN EDITION — a vertical folio sequence, not a four-up menu.
 *
 * Each edition is art-directed as its OWN page: the numeral, the name, the
 * character line, the seal and the margins are composed differently per
 * edition so that turning the page reveals a genuinely different layout
 * rather than the same template with different words. The composition is
 * keyed to what the edition means:
 *
 *   01 RAW        flush-left, unadorned, no seal — "first light, unedited"
 *   02 STILL      centred and symmetric, precise registration — "held, exact"
 *   03 BOLD       name cropped off the right edge over an ink band — "nothing hidden"
 *   04 AFTERIMAGE type low in the frame under a ghosted echo — "the trace left"
 *
 * What does NOT vary: the issuing rail and the page-turn control keep their
 * position and size on every page. On a kiosk the guest must never have to
 * re-find the primary action — the composition above it is what changes.
 */
export default function ScentScreen({
  onSelect,
}: {
  onSelect: (scent: Scent, motif: ChromeAsset) => void;
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
        const motifs = motifsForScent(scent);
        const variant = i % 4;
        const jp = sub ? edition.character.jp : null;

        return (
          <section key={edition.no} className="scent-scene">
            <div
              className="scene-inner relative z-[2] flex h-full flex-col"
              style={{ paddingLeft: variant === 1 ? 150 : variant === 3 ? 110 : 72, paddingRight: variant === 1 ? 150 : 72 }}
            >
              <div
                className="flex items-center pt-[150px]"
                style={{ justifyContent: variant === 1 ? "center" : "space-between", gap: variant === 1 ? 22 : 0 }}
              >
                <p className="kicker">Select an Edition</p>
                <p className="font-mono text-[15px] tracking-[0.32em] text-silver-dim">
                  {edition.no}
                  <span className="mx-[8px] text-[color:var(--color-line)]">/</span>
                  {total}
                </p>
              </div>

              <div className="flex flex-1 flex-col justify-center">
                <div
                  className="grid w-full grid-cols-[minmax(0,1fr)_340px] items-center gap-[42px]"
                  style={{ textAlign: variant === 1 ? "center" : "left" }}
                >
                  <div className="min-w-0">
                  {/* ---- 01 RAW — flush left, unadorned, nothing centred ---- */}
                  {variant === 0 && (
                    <>
                      <span
                        aria-hidden="true"
                        className="block font-display font-semibold leading-[0.74] tracking-[-0.05em]"
                        style={{ fontSize: 250, marginLeft: -14 }}
                      >
                        {edition.no}
                      </span>
                      <h2 className="mt-[4px] font-display text-[132px] font-semibold uppercase leading-[0.86] tracking-[-0.03em]">
                        {edition.code}
                      </h2>
                      <p className="mt-[28px] max-w-[620px] font-display text-[34px] italic leading-[1.08] text-ink-soft">
                        {edition.character.en}
                      </p>
                      {jp && <p className="jp-sub mt-[10px] text-[18px] text-silver-dim">{jp}</p>}
                    </>
                  )}

                  {/* ---- 02 STILL — centred and calm. Set in the display
                       serif's softer register: mixed case, normal tracking,
                       no all-caps rigidity, no hairline sandwich. ---- */}
                  {variant === 1 && (
                    <>
                      <span className="block font-mono text-[14px] tracking-[0.22em] text-silver-dim">
                        Edition {edition.no}
                      </span>
                      <h2 className="mt-[20px] font-display text-[118px] font-medium leading-[0.94] tracking-[-0.015em]">
                        {edition.code.charAt(0) + edition.code.slice(1).toLowerCase()}
                      </h2>
                      <p className="mx-auto mt-[26px] max-w-[600px] font-display text-[32px] italic leading-[1.18] text-ink-soft">
                        {edition.character.en}
                      </p>
                      {jp && <p className="jp-sub mt-[12px] text-[17px] text-silver-dim">{jp}</p>}
                    </>
                  )}

                  {/* ---- 03 BOLD — weight and scale carry the contrast, not a
                       black band or type running off the page. ---- */}
                  {variant === 2 && (
                    <>
                      <span className="block font-mono text-[14px] tracking-[0.22em] text-silver-dim">
                        Edition {edition.no}
                      </span>
                      <h2
                        className="font-display font-semibold uppercase leading-[0.84] tracking-[-0.035em]"
                        style={{ fontSize: 176, marginTop: 26, marginLeft: -8 }}
                      >
                        {edition.code}
                      </h2>
                      <div className="mt-[30px] flex items-start gap-[34px]">
                        <span className="mt-[14px] block h-px w-[150px] shrink-0 bg-[color:var(--color-ink)]" aria-hidden="true" />
                        <div>
                          <p className="max-w-[560px] font-display text-[32px] italic leading-[1.12] text-ink-soft">
                            {edition.character.en}
                          </p>
                          {jp && <p className="jp-sub mt-[10px] text-[18px] text-silver-dim">{jp}</p>}
                        </div>
                      </div>
                    </>
                  )}

                  {/* ---- 04 AFTERIMAGE — low in the frame, under its own echo ---- */}
                  {variant === 3 && (
                    <>
                      <span className="block h-[150px]" aria-hidden="true" />
                      <span
                        aria-hidden="true"
                        className="block font-display font-semibold uppercase leading-[0.84] tracking-[-0.03em] text-silver"
                        style={{ fontSize: 104, opacity: 0.28, transform: "translateX(26px)" }}
                      >
                        {edition.code}
                      </span>
                      <h2
                        className="font-display font-semibold uppercase leading-[0.84] tracking-[-0.03em]"
                        style={{ fontSize: 104, marginTop: -34 }}
                      >
                        {edition.code}
                      </h2>
                      <div className="mt-[30px] flex items-end justify-between">
                        <p className="max-w-[560px] font-display text-[32px] italic leading-[1.1] text-ink-soft">
                          {edition.character.en}
                        </p>
                        <span
                          aria-hidden="true"
                          className="font-display font-semibold leading-[0.74] tracking-[-0.05em] text-silver-dim"
                          style={{ fontSize: 150 }}
                        >
                          {edition.no}
                        </span>
                      </div>
                      {jp && <p className="jp-sub mt-[10px] text-[18px] text-silver-dim">{jp}</p>}
                    </>
                  )}

                  </div>

                  <div className="border-l border-[color:var(--color-ink)] pl-[20px] text-left">
                    <div>
                      <p className="font-mono text-[14px] uppercase tracking-[0.24em]">
                        Choose a print mark
                      </p>
                      {sub && (
                        <p className="jp-sub mt-[5px] text-[13px] text-silver-dim">
                          紙面に残すマークを選択
                        </p>
                      )}
                    </div>
                    <div className="mt-[14px] grid grid-cols-1 gap-[10px]">
                      {motifs.map((motif, markIndex) => (
                        <button
                          key={motif.id}
                          type="button"
                          onClick={() => onSelect(scent, motif)}
                          className="press group relative min-h-[148px] overflow-hidden border border-[color:var(--color-line)] bg-paper-bright text-left"
                          aria-label={`Select ${edition.code} with ${motif.name}`}
                        >
                          <span className="absolute left-[14px] top-[12px] z-[2] font-mono text-[12px] uppercase tracking-[0.24em] text-silver-dim">
                            {edition.no}
                            {String.fromCharCode(65 + markIndex)}
                          </span>
                          <img
                            src={motif.path}
                            alt=""
                            aria-hidden="true"
                            width={118}
                            height={118}
                            className="absolute right-[12px] top-[8px] h-[118px] w-[148px] object-contain grayscale contrast-125 transition-transform duration-500 ease-out group-active:scale-[0.97]"
                          />
                          <span className="absolute bottom-[12px] left-[14px] right-[14px] z-[2] truncate border-t border-[color:var(--color-line-soft)] bg-paper-bright/90 pt-[7px] font-mono text-[11px] uppercase tracking-[0.1em] text-ink">
                            {motif.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex h-[150px] items-center justify-center">
                {i < EDITIONS.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => turnTo(i + 1)}
                    aria-label={`Next edition: ${EDITIONS[i + 1].code}`}
                    className="press scent-hint flex min-h-[112px] w-full items-center justify-between border-t border-[color:var(--color-line)] text-silver-dim"
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
                    className="press flex min-h-[112px] w-full items-center justify-between border-t border-[color:var(--color-line)] text-silver-dim"
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
