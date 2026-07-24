"use client";

import { useCallback, useEffect, useRef } from "react";
import Portrait from "@/app/components/Portrait";

// Stage geometry — the active proof is the screen's hero, and the 940px
// viewport leaves ~128px of the previous/next proofs visible at each edge so
// it is obvious the strip continues sideways.
const ITEM_W = 660;
const GAP = 24;
const STEP = ITEM_W + GAP;
const VIEWPORT_W = 940;
const EDGE_PAD = (VIEWPORT_W - ITEM_W) / 2;
const RAPID_TAP_LOCK_MS = 220;

// Arc thumbnail rail — distance-from-active drives size and lift along a
// shallow parabola: lift = ARC_K * dist².
const ARC_K = 14;
const THUMB_SIZE = [108, 86, 68] as const;
const THUMB_OPACITY = [1, 0.8, 0.55] as const;

/**
 * FrameSelectionCarousel — the touch photo-selection stage.
 *
 * The strip scrolls horizontally using the browser's own scrolling with
 * scroll-snap, rather than a JavaScript drag controller. Native scrolling is
 * what a touchscreen guest already expects: it has real momentum, it snaps,
 * it never fights the browser for gesture ownership, and it costs no
 * per-frame JavaScript. `activeIndex` is derived from scroll position, and
 * tapping the centred proof selects it.
 */
export default function FrameSelectionCarousel({
  frameIds,
  activeIndex,
  onActiveChange,
  selectedIds,
  onToggleSelect,
  reducedMotion,
}: {
  frameIds: number[];
  activeIndex: number;
  onActiveChange: (i: number) => void;
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  reducedMotion: boolean;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;
  const lastTapRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  // Scroll position -> active index. Read inside one rAF so a flick does not
  // queue a React update per scroll event.
  const handleScroll = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const el = scrollerRef.current;
      if (!el) return;
      const idx = Math.round(el.scrollLeft / STEP);
      const clamped = Math.max(0, Math.min(frameIds.length - 1, idx));
      if (clamped !== activeIndexRef.current) onActiveChange(clamped);
    });
  }, [frameIds.length, onActiveChange]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Active index changed from outside (thumbnail, print-order slot) -> scroll
  // there. Skipped when already in place so this never fights a live scroll.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const target = activeIndex * STEP;
    if (Math.abs(el.scrollLeft - target) < 4) return;
    el.scrollTo({ left: target, behavior: reducedMotion ? "auto" : "smooth" });
  }, [activeIndex, reducedMotion]);

  // Native scrolling suppresses click after a drag, so a click here is a real
  // tap. The lock only guards a double-fire from the same press.
  const handleSelect = useCallback(
    (id: number) => {
      const now = performance.now();
      if (now - lastTapRef.current < RAPID_TAP_LOCK_MS) return;
      lastTapRef.current = now;
      onToggleSelect(id);
    },
    [onToggleSelect],
  );

  const activeSelected = selectedIds.includes(frameIds[activeIndex]);

  return (
    <div className="relative flex flex-col items-center">
      <style>{`
        .frame-strip { scrollbar-width: none; -ms-overflow-style: none; }
        .frame-strip::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Horizontally scrolling strip — the browser owns the gesture */}
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="frame-strip relative overflow-x-auto overflow-y-hidden"
        style={{
          width: VIEWPORT_W,
          height: ITEM_W,
          scrollSnapType: reducedMotion ? "none" : "x mandatory",
          touchAction: "pan-x",
          overscrollBehaviorX: "contain",
        }}
      >
        <div className="flex" style={{ gap: GAP, paddingLeft: EDGE_PAD, paddingRight: EDGE_PAD }}>
          {frameIds.map((id, i) => {
            const isActive = i === activeIndex;
            const isSelected = selectedIds.includes(id);
            const printNo = isSelected ? selectedIds.indexOf(id) + 1 : null;
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleSelect(id)}
                aria-pressed={isSelected}
                aria-label={
                  isSelected
                    ? `Frame ${i + 1}, print ${printNo}. Remove from print order`
                    : `Frame ${i + 1}. Add to print order`
                }
                className="relative shrink-0 overflow-hidden bg-paper-bright"
                style={{
                  width: ITEM_W,
                  height: ITEM_W,
                  scrollSnapAlign: "center",
                  cursor: "pointer",
                  opacity: isActive ? 1 : 0.5,
                  transition: reducedMotion ? "opacity 140ms linear" : "opacity 260ms ease",
                }}
              >
                <Portrait seed={id} />
                {isActive && (
                  <>
                    <RegMark className="left-[16px] top-[16px]" selected={isSelected} />
                    <RegMark className="right-[16px] top-[16px] rotate-90" selected={isSelected} />
                    <RegMark className="bottom-[16px] right-[16px] rotate-180" selected={isSelected} />
                    <RegMark className="bottom-[16px] left-[16px] -rotate-90" selected={isSelected} />
                  </>
                )}
                {printNo && (
                  <span className="absolute bottom-[16px] right-[16px] border border-[color:var(--color-ink)] bg-paper-bright px-[10px] py-[4px] font-mono text-[13px] uppercase tracking-[0.2em]">
                    PRINT {String(printNo).padStart(2, "0")}
                  </span>
                )}
                <span className="absolute bottom-[16px] left-[16px] font-mono text-[12px] uppercase tracking-[0.24em] text-paper mix-blend-difference">
                  Frame {String(i + 1).padStart(2, "0")}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-[18px] font-mono text-[15px] uppercase tracking-[0.26em] text-silver-dim">
        {activeSelected ? "Selected — tap to remove" : "Swipe sideways · tap to select"}
      </p>

      {/* Arc thumbnail rail */}
      <div className="mt-[26px] flex items-start justify-center" style={{ gap: 10 }}>
        {frameIds.map((id, i) => {
          const dist = Math.min(2, Math.abs(i - activeIndex));
          const visSize = THUMB_SIZE[dist];
          const lift = ARC_K * Math.abs(i - activeIndex) ** 2;
          const opacity = THUMB_OPACITY[dist];
          const selected = selectedIds.includes(id);
          return (
            <button
              key={id}
              onClick={() => onActiveChange(i)}
              aria-label={`Go to frame ${i + 1}`}
              className="press flex shrink-0 items-start justify-center"
              style={{ width: 88, height: 88 + ARC_K * 4, cursor: "pointer" }}
            >
              <span
                className="relative block overflow-hidden border"
                style={{
                  width: visSize,
                  height: visSize,
                  marginTop: Math.min(lift, ARC_K * 4),
                  opacity,
                  borderColor: i === activeIndex ? "var(--color-ink)" : "var(--color-line)",
                  transition: reducedMotion
                    ? "none"
                    : "width 260ms ease, height 260ms ease, margin 260ms ease, opacity 260ms ease",
                }}
              >
                <Portrait seed={id} />
                {selected && (
                  <span className="absolute right-[3px] top-[3px] h-[6px] w-[6px] rounded-full bg-ink" aria-hidden="true" />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RegMark({ className = "", selected }: { className?: string; selected: boolean }) {
  return (
    <span
      className={`proof-lock-mark pointer-events-none absolute h-[22px] w-[22px] border-l-2 border-t-2 ${
        selected ? "border-[color:var(--color-ink)]" : "border-paper/70"
      } ${className}`}
      aria-hidden="true"
    />
  );
}
