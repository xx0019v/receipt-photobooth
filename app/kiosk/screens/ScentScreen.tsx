"use client";

import { useEffect } from "react";
import Masthead from "@/app/components/Masthead";
import type { Scent } from "@/app/lib/edition";
import { useLang } from "@/app/lib/i18n";

const REVEAL_DURATION = 1600;

/**
 * Technical placeholder for the future Scent Identity Reveal art direction.
 * The scent is already fixed by KioskApp; this screen only reveals it briefly
 * and advances without input.
 */
export default function ScentScreen({
  selectedScent,
  onComplete,
}: {
  selectedScent: Scent;
  onComplete: () => void;
}) {
  const { sub } = useLang();

  useEffect(() => {
    const timer = setTimeout(onComplete, REVEAL_DURATION);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="flex h-full flex-col bg-paper">
      <style>{`
        @keyframes scentIdentityFade {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .scent-identity-reveal { animation: scentIdentityFade .45s ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .scent-identity-reveal {
            animation-duration: .12s;
            transform: none;
          }
        }
      `}</style>

      <Masthead />

      <main className="scent-identity-reveal flex flex-1 flex-col justify-center px-[120px]">
        <p className="kicker">Scent identity</p>
        <h2 className="mt-[28px] font-display text-[118px] font-semibold uppercase leading-[0.86] tracking-[-0.03em]">
          {selectedScent.name}
        </h2>
        <p className="mt-[34px] font-display text-[44px] italic text-ink-soft">
          {selectedScent.mood.en}
        </p>
        {sub && (
          <p className="jp-sub mt-[10px] text-[20px] text-silver-dim">
            {selectedScent.mood.jp}
          </p>
        )}

        <div className="mt-[64px] grid grid-cols-[1fr_auto] gap-[48px] border-y border-[color:var(--color-line)] py-[28px]">
          <p className="font-mono text-[17px] uppercase tracking-[0.22em] text-silver-dim">
            {selectedScent.notes.map((note) => note.en).join(" · ")}
          </p>
          <p className="font-display text-[30px] uppercase leading-none">
            {selectedScent.destination.en}
          </p>
        </div>
      </main>
    </div>
  );
}
