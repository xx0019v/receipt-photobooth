"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Portrait from "@/app/components/Portrait";

const ITEM_W = 620;
const GAP = 24;
const STEP = ITEM_W + GAP;
const VIEWPORT_W = 700;
const DRAG_THRESHOLD = 56;
const TAP_MOVE_TOLERANCE = 8;

/**
 * FrameSelectionCarousel — the touch photo-selection stage. A single
 * integer (`activeIndex`) is the source of truth; the CSS `transform`
 * transition does all the settling, so there is no per-frame requestAnimationFrame
 * loop or React state update while idle. Design lineage (adapted, not
 * copied, from the OriginKit carousels supplied for this project):
 *  - Coverflow: one position value drives both the stage and the rail —
 *    distance-from-active determines size/opacity everywhere.
 *  - Button Carousel: the arc thumbnail rail and tap-to-select interaction.
 *  - Box Carousel: pointer-capture / drag-vs-tap / stale-closure discipline
 *    (a ref mirrors activeIndex so pointer handlers never read stale state).
 * The 3D cube itself, autoplay, hover-driven magnification, backdrop-filter
 * blur, and per-frame rAF interpolation from those sources are deliberately
 * not used — see docs/ORIGINKIT_USAGE.md.
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
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;
  const dragState = useRef<{ pointerId: number; startX: number; startY: number; moved: number } | null>(null);

  const commitDrag = useCallback(
    (dx: number) => {
      const cur = activeIndexRef.current;
      if (dx <= -DRAG_THRESHOLD && cur < frameIds.length - 1) onActiveChange(cur + 1);
      else if (dx >= DRAG_THRESHOLD && cur > 0) onActiveChange(cur - 1);
    },
    [frameIds.length, onActiveChange],
  );

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    try {
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    } catch {}
    dragState.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, moved: 0 };
    setDragging(true);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const s = dragState.current;
    if (!s || s.pointerId !== e.pointerId) return;
    const dx = e.clientX - s.startX;
    const dy = e.clientY - s.startY;
    // Ignore drags that are clearly vertical (not our axis).
    if (Math.abs(dy) > Math.abs(dx) + 16 && Math.abs(dx) < 12) return;
    s.moved = Math.max(s.moved, Math.abs(dx));
    setDragX(dx);
  }, []);

  const endDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const s = dragState.current;
      if (!s || s.pointerId !== e.pointerId) return;
      try {
        (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
      } catch {}
      const dx = dragX;
      const moved = s.moved;
      dragState.current = null;
      setDragging(false);
      setDragX(0);
      if (moved < TAP_MOVE_TOLERANCE) {
        onToggleSelect(frameIds[activeIndexRef.current]);
      } else {
        commitDrag(dx);
      }
    },
    [dragX, frameIds, onToggleSelect, commitDrag],
  );

  const trackX = (VIEWPORT_W - ITEM_W) / 2 - activeIndex * STEP + (dragging ? dragX : 0);

  return (
    <div className="flex flex-col items-center">
      {/* Main stage — active photo centred, neighbours peek as thin slats */}
      <div
        className="relative overflow-hidden"
        style={{ width: VIEWPORT_W, height: ITEM_W, touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div
          className="absolute top-0 flex"
          style={{
            gap: GAP,
            transform: `translateX(${trackX}px)`,
            transition: dragging || reducedMotion ? "none" : "transform 320ms cubic-bezier(0.22, 0.61, 0.36, 1)",
          }}
        >
          {frameIds.map((id, i) => {
            const isActive = i === activeIndex;
            const isSelected = selectedIds.includes(id);
            const printNo = isSelected ? selectedIds.indexOf(id) + 1 : null;
            return (
              <div
                key={id}
                className="relative shrink-0 overflow-hidden bg-paper-bright"
                style={{
                  width: ITEM_W,
                  height: ITEM_W,
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
                <span className="absolute left-[16px] bottom-[16px] font-mono text-[12px] uppercase tracking-[0.24em] text-paper mix-blend-difference">
                  Frame {String(i + 1).padStart(2, "0")}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-[18px] font-mono text-[15px] uppercase tracking-[0.32em] text-silver-dim">
        {selectedIds.includes(frameIds[activeIndex]) ? "Selected — tap to deselect" : "Tap the photo to select"}
      </p>

      {/* Arc thumbnail rail — distance-from-active drives size/opacity */}
      <div className="mt-[26px] flex items-end justify-center" style={{ gap: 10 }}>
        {frameIds.map((id, i) => {
          const dist = Math.abs(i - activeIndex);
          const visSize = dist === 0 ? 104 : dist === 1 ? 84 : 64;
          const lift = dist === 0 ? 0 : dist === 1 ? 10 : 22;
          const opacity = dist === 0 ? 1 : dist === 1 ? 0.78 : 0.5;
          const selected = selectedIds.includes(id);
          return (
            <button
              key={id}
              onClick={() => onActiveChange(i)}
              aria-label={`Frame ${i + 1}`}
              className="press flex shrink-0 items-center justify-center"
              style={{ width: 88, height: 88, cursor: "pointer" }}
            >
              <span
                className="relative block overflow-hidden border"
                style={{
                  width: visSize,
                  height: visSize,
                  marginBottom: lift,
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
