"use client";

import { useCallback, useRef, useState } from "react";
import Portrait from "@/app/components/Portrait";

// Stage geometry — the active proof is the screen's hero (660px, inside the
// 640–700 acceptance band) and the 940px viewport leaves ~128px of the
// previous/next proofs visible as physical slats at each edge.
const ITEM_W = 660;
const GAP = 24;
const STEP = ITEM_W + GAP;
const VIEWPORT_W = 940;
const DRAG_THRESHOLD = 56;
const TAP_MOVE_TOLERANCE = 8;
const RAPID_TAP_LOCK_MS = 220;

// Peel (drag-to-slot) gesture — Draggable Sticker's grab/lift/paste principle
// rebuilt with CSS transform/opacity only (no WebGL, no canvas, no mesh).
const PEEL_START_DY = 48; // vertical-down travel before the proof "peels"
const PEEL_GHOST_W = 150;
const PEEL_MAX_TILT = 2.5; // degrees

// Arc thumbnail rail — Round Carousel's circle-placement principle flattened
// to a 2D parabola: lift(dist) = ARC_K * dist^2. Max depth at dist=2 is
// 14 * 4 = 56px (inside the 50–90px acceptance band).
const ARC_K = 14;
const THUMB_SIZE = [108, 86, 68] as const;
const THUMB_OPACITY = [1, 0.8, 0.55] as const;

type PeelState = {
  frameId: number;
  /** ghost centre, in the carousel root's local (pre-scale) coordinates */
  x: number;
  y: number;
  tilt: number;
};

/**
 * FrameSelectionCarousel — the touch photo-selection stage. A single
 * integer (`activeIndex`) is the source of truth; the CSS `transform`
 * transition does all the settling, so there is no per-frame
 * requestAnimationFrame loop or React state update while idle. Design
 * lineage (principles adapted, no code copied — see
 * docs/DESIGN_SOURCE_INVENTORY.md):
 *  - Coverflow: one position value drives both the stage and the rail.
 *  - Button Carousel: arc thumbnail rail + tap-to-select.
 *  - Box Carousel: pointer-capture / drag-vs-tap / stale-closure / rapid-tap
 *    discipline (activeIndexRef mirrors state; pointercancel is terminal).
 *  - Round Carousel: the circle-placement math behind the rail's parabolic
 *    arc (no 3D ring, no autoplay, no idle rAF).
 *  - Draggable Sticker: the grab → lift → paste gesture, reinterpreted as
 *    lifting a print proof into a PRINT ORDER slot (no WebGL, no holo).
 */
export default function FrameSelectionCarousel({
  frameIds,
  activeIndex,
  onActiveChange,
  selectedIds,
  onToggleSelect,
  onPeelDrop,
  reducedMotion,
}: {
  frameIds: number[];
  activeIndex: number;
  onActiveChange: (i: number) => void;
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  /** Optional drag-to-slot: called with the frame and the drop point (client coords). */
  onPeelDrop?: (frameId: number, clientX: number, clientY: number) => void;
  reducedMotion: boolean;
}) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [peel, setPeel] = useState<PeelState | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;
  const lastTapRef = useRef(0);
  const dragState = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    moved: number;
    mode: "undecided" | "swipe" | "peel";
    lastX: number;
  } | null>(null);

  // Convert client coordinates to the carousel root's local space. The kiosk
  // stage is scaled to fit the window, so client px ≠ local px; dividing by
  // the measured scale keeps the peel ghost under the finger at any zoom.
  const toLocal = useCallback((clientX: number, clientY: number) => {
    const root = rootRef.current;
    if (!root) return { x: clientX, y: clientY };
    const rect = root.getBoundingClientRect();
    const scale = rect.width / root.offsetWidth || 1;
    return { x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale };
  }, []);

  const commitDrag = useCallback(
    (dx: number) => {
      const cur = activeIndexRef.current;
      if (dx <= -DRAG_THRESHOLD && cur < frameIds.length - 1) onActiveChange(cur + 1);
      else if (dx >= DRAG_THRESHOLD && cur > 0) onActiveChange(cur - 1);
    },
    [frameIds.length, onActiveChange],
  );

  const toggleActive = useCallback(() => {
    const now = performance.now();
    if (now - lastTapRef.current < RAPID_TAP_LOCK_MS) return;
    lastTapRef.current = now;
    onToggleSelect(frameIds[activeIndexRef.current]);
  }, [frameIds, onToggleSelect]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (dragState.current) return; // one pointer at a time — no multi-touch races
    try {
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    } catch {}
    dragState.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      moved: 0,
      mode: "undecided",
      lastX: e.clientX,
    };
    setDragging(true);
    setPressed(true);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const s = dragState.current;
      if (!s || s.pointerId !== e.pointerId) return;
      const dx = e.clientX - s.startX;
      const dy = e.clientY - s.startY;
      s.moved = Math.max(s.moved, Math.abs(dx), Math.abs(dy));

      if (s.mode === "undecided") {
        if (Math.abs(dx) > 14 && Math.abs(dx) > Math.abs(dy)) {
          s.mode = "swipe";
        } else if (onPeelDrop && dy > PEEL_START_DY && Math.abs(dx) < dy) {
          // Downward pull — the proof peels off the stage toward the slots.
          s.mode = "peel";
        }
      }

      if (s.mode === "swipe") {
        setDragX(dx);
      } else if (s.mode === "peel") {
        const { x, y } = toLocal(e.clientX, e.clientY);
        const vx = e.clientX - s.lastX;
        const tilt = reducedMotion ? 0 : Math.max(-PEEL_MAX_TILT, Math.min(PEEL_MAX_TILT, vx * 0.4));
        setPeel({ frameId: frameIds[activeIndexRef.current], x, y, tilt });
      }
      s.lastX = e.clientX;
    },
    [frameIds, onPeelDrop, reducedMotion, toLocal],
  );

  const endDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const s = dragState.current;
      if (!s || s.pointerId !== e.pointerId) return;
      try {
        (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
      } catch {}
      const { mode, moved } = s;
      const dx = dragX;
      dragState.current = null;
      setDragging(false);
      setPressed(false);
      setDragX(0);
      setPeel(null);

      // pointercancel is terminal: no tap, no navigation, no drop.
      if (e.type === "pointercancel") return;

      if (mode === "peel") {
        onPeelDrop?.(frameIds[activeIndexRef.current], e.clientX, e.clientY);
        return;
      }
      if (moved < TAP_MOVE_TOLERANCE) {
        // The photo surface and explicit action share one rapid-tap lock, so
        // mixed input can never select then immediately deselect one proof.
        toggleActive();
        return;
      }
      if (mode === "swipe") commitDrag(dx);
    },
    [dragX, frameIds, onPeelDrop, commitDrag, toggleActive],
  );

  const trackX = (VIEWPORT_W - ITEM_W) / 2 - activeIndex * STEP + (dragging && !peel ? dragX : 0);
  const activeSelected = selectedIds.includes(frameIds[activeIndex]);

  return (
    <div ref={rootRef} className="relative flex flex-col items-center">
      {/* one-shot silver sweep for the peel lift — defined locally, runs once */}
      <style>{`
        @keyframes peelSheen {
          0% { transform: translateX(-130%) skewX(-12deg); opacity: 0; }
          45% { opacity: 0.45; }
          100% { transform: translateX(130%) skewX(-12deg); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .peel-sheen { animation: none !important; opacity: 0 !important; }
        }
      `}</style>

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
            // Press lift — the proof detaches a hair from the machine bed.
            const lifted = isActive && pressed && !reducedMotion;
            const peeling = isActive && peel !== null;
            return (
              <div
                key={id}
                className="relative shrink-0 overflow-hidden bg-paper-bright"
                style={{
                  width: ITEM_W,
                  height: ITEM_W,
                  opacity: peeling ? 0.45 : isActive ? 1 : 0.5,
                  transform: lifted ? "translateY(-6px) scale(0.992)" : "none",
                  boxShadow: lifted ? "0 10px 18px -14px rgba(0,0,0,0.35)" : "none",
                  transition: reducedMotion
                    ? "opacity 140ms linear"
                    : "opacity 260ms ease, transform 200ms cubic-bezier(0.22, 0.61, 0.36, 1), box-shadow 200ms ease",
                }}
              >
                <Portrait seed={id} />
                {lifted && (
                  <span
                    className="peel-sheen pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(100deg, transparent 42%, rgba(255,255,255,0.5) 50%, transparent 58%)",
                      animation: "peelSheen 0.5s ease-out both",
                    }}
                    aria-hidden="true"
                  />
                )}
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

      <button
        type="button"
        onClick={toggleActive}
        aria-pressed={activeSelected}
        aria-label={`${activeSelected ? "Remove" : "Register"} frame ${activeIndex + 1} ${activeSelected ? "from" : "in"} print order`}
        className="press mt-[14px] flex min-h-[60px] w-[660px] items-center justify-between border-y border-[color:var(--color-line)] px-[18px] font-mono uppercase focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--color-ink)]"
        style={{ cursor: "pointer" }}
      >
        <span className="text-[15px] tracking-[0.3em] text-ink">
          {activeSelected ? "Remove from print" : "Register frame"}
        </span>
        <span className="text-[13px] tracking-[0.24em] text-silver-dim tabular-nums">
          {`Frame ${String(activeIndex + 1).padStart(2, "0")}`}
          {activeSelected ? ` / Print ${String(selectedIds.indexOf(frameIds[activeIndex]) + 1).padStart(2, "0")}` : " / Open"}
        </span>
      </button>

      {/* Arc thumbnail rail — parabolic lift from distance-to-active */}
      <div className="mt-[18px] flex items-start justify-center" style={{ gap: 10 }}>
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
              aria-label={`Frame ${i + 1}`}
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

      {/* Peel ghost — a small proof following the finger toward the slots.
          transform/opacity only; unmounts the moment the gesture ends. */}
      {peel && (
        <div
          className="pointer-events-none absolute z-[40] overflow-hidden border border-[color:var(--color-ink)] bg-paper-bright"
          style={{
            width: PEEL_GHOST_W,
            height: PEEL_GHOST_W,
            left: peel.x - PEEL_GHOST_W / 2,
            top: peel.y - PEEL_GHOST_W / 2,
            transform: `rotate(${peel.tilt}deg)`,
            boxShadow: reducedMotion ? "none" : "0 12px 20px -16px rgba(0,0,0,0.4)",
          }}
          aria-hidden="true"
        >
          <Portrait seed={peel.frameId} />
        </div>
      )}
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
