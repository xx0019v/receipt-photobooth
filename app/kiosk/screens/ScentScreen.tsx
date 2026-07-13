"use client";

import { useEffect } from "react";
import Masthead from "@/app/components/Masthead";
import type { Scent } from "@/app/lib/edition";
import { useLang } from "@/app/lib/i18n";
import { useChromeArtwork } from "@/app/lib/chromeArtwork";

const REVEAL_DURATION = 1600;

/**
 * SCENT IDENTITY REVEAL — a white scent signature, not a loading screen and
 * not a chooser. The scent is already fixed by KioskApp; this screen states it
 * once, in a gallery-quiet white space, then dissolves to white and advances
 * to Format Select without any input.
 *
 * Motion order: a hairline draws in → the name's letter-spacing settles → the
 * notes rise → a single reflection passes across the scent's symbol → the whole
 * field washes to white. `prefers-reduced-motion` collapses this to a short
 * fade with no reflection or wash animation.
 */
export default function ScentScreen({
  selectedScent,
  onComplete,
}: {
  selectedScent: Scent;
  onComplete: () => void;
}) {
  const { sub } = useLang();
  const symbol = useChromeArtwork();

  useEffect(() => {
    const timer = setTimeout(onComplete, REVEAL_DURATION);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="scent-reveal relative flex h-full flex-col overflow-hidden bg-paper">
      <style>{`
        @keyframes srLine {
          from { transform: scaleX(0); opacity: 0; }
          to { transform: scaleX(1); opacity: 1; }
        }
        @keyframes srName {
          from { opacity: 0; letter-spacing: 0.34em; transform: translateY(6px); }
          to { opacity: 1; letter-spacing: -0.02em; transform: translateY(0); }
        }
        @keyframes srRise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes srReflect {
          0% { transform: translateX(-160%) skewX(-12deg); opacity: 0; }
          45% { opacity: 0.55; }
          100% { transform: translateX(160%) skewX(-12deg); opacity: 0; }
        }
        @keyframes srWash {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .sr-line { transform-origin: left center; animation: srLine .72s var(--ease-out-premium) both; }
        .sr-name { animation: srName .95s .16s var(--ease-out-premium) both; }
        .sr-notes { animation: srRise .8s .5s var(--ease-out-premium) both; }
        .sr-meta { animation: srRise .8s .64s var(--ease-out-premium) both; }
        .sr-symbol { animation: srRise 1.1s .3s var(--ease-out-premium) both; }
        .sr-sheen { animation: srReflect .9s .72s ease-out both; }
        .sr-wash { animation: srWash .34s 1.26s ease-in both; }

        @media (prefers-reduced-motion: reduce) {
          .sr-line, .sr-name, .sr-notes, .sr-meta, .sr-symbol {
            animation: srRise .18s ease-out both;
            letter-spacing: normal;
          }
          .sr-sheen { animation: none; opacity: 0; }
          .sr-wash { animation: srWash .1s 1.4s ease-in both; }
        }
      `}</style>

      <Masthead />

      {/* the scent's symbol — bled off the right edge, cropped and grayscaled
          into a watermark, with one reflection passing across it */}
      <div
        aria-hidden="true"
        className="sr-symbol pointer-events-none absolute -right-[190px] top-1/2 h-[720px] w-[720px] -translate-y-1/2"
      >
        <img
          src={symbol.path}
          alt=""
          className="h-full w-full object-contain opacity-[0.06] grayscale contrast-125"
        />
        <div className="absolute inset-0 overflow-hidden">
          <span
            className="sr-sheen absolute inset-y-0 -left-1/2 w-1/2"
            style={{
              background:
                "linear-gradient(100deg, transparent 30%, rgba(120,120,118,0.5) 50%, transparent 70%)",
            }}
          />
        </div>
      </div>

      <main className="relative z-[2] flex flex-1 flex-col justify-center px-[120px]">
        <span className="sr-line block h-px w-[132px] bg-ink" />

        <p className="sr-notes kicker mt-[30px]">Your scent identity</p>

        <h2 className="sr-name mt-[24px] font-display text-[128px] font-semibold uppercase leading-[0.84]">
          {selectedScent.name}
        </h2>

        <p className="sr-notes mt-[34px] font-mono text-[19px] uppercase tracking-[0.24em] text-ink-soft">
          {selectedScent.notes.map((note) => note.en).join("  ·  ")}
        </p>

        <div className="sr-meta mt-[52px] flex items-end gap-[64px] border-t border-[color:var(--color-line)] pt-[26px]">
          <div>
            <p className="font-mono text-[12px] uppercase tracking-[0.3em] text-silver-dim">
              Mood
            </p>
            <p className="mt-[8px] font-display text-[40px] italic leading-none text-ink">
              {selectedScent.mood.en}
            </p>
            {sub && (
              <p className="jp-sub mt-[8px] text-[17px] text-silver-dim">
                {selectedScent.mood.jp}
              </p>
            )}
          </div>
          <div className="ml-auto text-right">
            <p className="font-mono text-[12px] uppercase tracking-[0.3em] text-silver-dim">
              Destination
            </p>
            <p className="mt-[8px] font-display text-[40px] uppercase leading-none text-ink">
              {selectedScent.destination.en}
            </p>
          </div>
        </div>
      </main>

      {/* final dissolve to white, handing off to Format Select */}
      <div className="sr-wash pointer-events-none absolute inset-0 z-[20] bg-paper" />
    </div>
  );
}
