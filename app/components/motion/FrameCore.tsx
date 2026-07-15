"use client";

import { useEffect, useState } from "react";

/**
 * FRAME CORE — the six-frame registration object shown briefly between
 * Capture and Select. Distinct from ISSUE CORE (which registers a *print*):
 * this one registers the six *captures* into a selectable set. Same silver
 * material language, a different, smaller ritual — never the same motion.
 */
export type FrameCoreState = "unprocessed" | "indexing" | "registering" | "ready";

const STATUS_LABEL: Record<FrameCoreState, string> = {
  unprocessed: "READING FRAMES",
  indexing: "INDEXING",
  registering: "REGISTERING",
  ready: "READY",
};

const FRAGMENT_COUNT = 6;

function fragmentTransform(
  index: number,
  state: FrameCoreState,
  registeredCount: number,
  reducedMotion: boolean,
) {
  const angle = (360 / FRAGMENT_COUNT) * index;
  if (reducedMotion) return `rotate(${angle}deg) translateY(-14px)`;

  if (state === "unprocessed") {
    return `rotate(${angle}deg) translateY(-30px) scale(0.7)`;
  }
  if (state === "indexing") {
    const arrived = index < registeredCount;
    return arrived
      ? `rotate(${angle}deg) translateY(-16px) scale(1)`
      : `rotate(${angle}deg) translateY(-30px) scale(0.7)`;
  }
  // registering + ready — fully drawn in
  return `rotate(${angle}deg) translateY(-14px) scale(1)`;
}

export default function FrameCore({
  state,
  registeredCount = 0,
  size = 84,
  showLabel = true,
  className = "",
}: {
  state: FrameCoreState;
  /** 0..6 — how many captured frames have registered (state === "indexing"). */
  registeredCount?: number;
  size?: number;
  showLabel?: boolean;
  className?: string;
}) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [sweep, setSweep] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reducedMotion || state !== "ready") return;
    setSweep(true);
    const to = setTimeout(() => setSweep(false), 380);
    return () => clearTimeout(to);
  }, [state, reducedMotion]);

  const r = size / 2;

  return (
    <div
      className={`issue-core ${className}`}
      data-state={state}
      role="status"
      aria-live="polite"
      style={{ width: size, height: size + (showLabel ? 22 : 0) }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }} aria-hidden="true">
        <defs>
          <radialGradient id="frameCoreFrag" cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#f6f6f4" />
            <stop offset="55%" stopColor="#c2c0ba" />
            <stop offset="100%" stopColor="#8b8983" />
          </radialGradient>
        </defs>

        <circle cx={r} cy={r} r={r * 0.32} fill="none" stroke="rgba(11,11,11,0.18)" strokeWidth={1} />

        {Array.from({ length: FRAGMENT_COUNT }).map((_, i) => (
          <g
            key={i}
            style={{
              transformOrigin: `${r}px ${r}px`,
              transform: fragmentTransform(i, state, registeredCount, reducedMotion),
              opacity: reducedMotion ? 0.9 : state === "unprocessed" ? 0.45 : 1,
              transition: reducedMotion
                ? "opacity 160ms linear"
                : "transform 220ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity 220ms linear",
            }}
          >
            <circle cx={r} cy={r} r={size * 0.06} fill="url(#frameCoreFrag)" stroke="rgba(11,11,11,0.2)" strokeWidth={0.6} />
          </g>
        ))}

        {sweep && (
          <rect
            x={-size}
            y={0}
            width={size * 0.5}
            height={size}
            fill="rgba(255,255,255,0.55)"
            style={{ mixBlendMode: "screen", animation: "issueCoreSweep 0.38s ease-out both" }}
          />
        )}
      </svg>
      {showLabel && <span className="issue-core__label">{STATUS_LABEL[state]}</span>}
    </div>
  );
}
