"use client";

import { useEffect, useState } from "react";

/**
 * ISSUE CORE — the machine's signature object. Four thin metal blades that
 * register into a seal as a print job progresses. Not a spinner: its shape
 * only ever advances in step with real printer state (calibrate → register →
 * issue → release), driven entirely by props, never by an internal loop.
 */
export type IssueCoreState = "calibrate" | "register" | "issue" | "release";

const STATUS_LABEL: Record<IssueCoreState, string> = {
  calibrate: "CALIBRATING",
  register: "REGISTERED",
  issue: "ISSUING EDITION",
  release: "READY TO COLLECT",
};

// Deterministic per-blade scatter for CALIBRATE — a small, intentional
// mis-registration, not randomness re-rolled on every render.
const CALIBRATE_OFFSET = [
  { rotate: 4, out: 7 },
  { rotate: -3, out: 9 },
  { rotate: 5, out: 5 },
  { rotate: -6, out: 8 },
] as const;

function bladeTransform(
  index: number,
  state: IssueCoreState,
  progress: number,
  reducedMotion: boolean,
) {
  const baseAngle = index * 90;
  if (reducedMotion) {
    // Static, fully registered — text/opacity carry the state instead.
    return `rotate(${baseAngle}deg) translateY(0px)`;
  }
  if (state === "calibrate") {
    const { rotate, out } = CALIBRATE_OFFSET[index];
    return `rotate(${baseAngle + rotate}deg) translateY(-${out}px)`;
  }
  if (state === "register") {
    return `rotate(${baseAngle}deg) translateY(0px)`;
  }
  if (state === "issue") {
    // Blades splay a hair to let the paper "pass through"; the whole
    // assembly advances less than a full turn, strictly tied to feed pct.
    const splay = 3 + 2.4 * Math.sin(progress * Math.PI * 3);
    const sweep = progress * 78;
    return `rotate(${baseAngle + sweep}deg) translateY(-${splay}px)`;
  }
  // release — closed, settled
  return `rotate(${baseAngle}deg) translateY(0px)`;
}

export default function IssueCore({
  state,
  progress = 0,
  size = 108,
  showLabel = true,
  className = "",
}: {
  state: IssueCoreState;
  /** 0..1 — feed progress, only meaningful while state === "issue" */
  progress?: number;
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

  // One-time highlight sweep at the start of CALIBRATE and once at RELEASE.
  useEffect(() => {
    if (reducedMotion) return;
    if (state === "calibrate" || state === "release") {
      setSweep(true);
      const to = setTimeout(() => setSweep(false), 420);
      return () => clearTimeout(to);
    }
  }, [state, reducedMotion]);

  const r = size / 2;
  const bladeLen = r * 0.86;
  const bladeW = size * 0.1;

  return (
    <div
      className={`issue-core ${className}`}
      data-state={state}
      role="status"
      aria-live="polite"
      style={{ width: size, height: size + (showLabel ? 22 : 0) }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ overflow: "visible" }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="issueCoreBlade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f4f4f2" />
            <stop offset="45%" stopColor="#b9b8b3" />
            <stop offset="60%" stopColor="#dedcd7" />
            <stop offset="100%" stopColor="#84827c" />
          </linearGradient>
        </defs>

        <circle
          cx={r}
          cy={r}
          r={r - 2}
          fill="none"
          stroke="rgba(11,11,11,0.14)"
          strokeWidth={1}
        />

        {[0, 1, 2, 3].map((i) => (
          <g
            key={i}
            style={{
              transformOrigin: `${r}px ${r}px`,
              transform: bladeTransform(i, state, progress, reducedMotion),
              transition: reducedMotion
                ? "opacity 160ms linear"
                : state === "calibrate"
                  ? "transform 300ms cubic-bezier(0.22, 0.61, 0.36, 1)"
                  : state === "register"
                    ? "transform 360ms cubic-bezier(0.22, 1.06, 0.36, 1)"
                    : state === "release"
                      ? "transform 260ms cubic-bezier(0.22, 0.61, 0.36, 1)"
                      : "transform 60ms linear",
            }}
          >
            <rect
              x={r - bladeW / 2}
              y={r - bladeLen}
              width={bladeW}
              height={bladeLen - r * 0.14}
              rx={bladeW / 2}
              fill="url(#issueCoreBlade)"
              stroke="rgba(11,11,11,0.22)"
              strokeWidth={0.75}
            />
          </g>
        ))}

        {/* registration cross — the seal's fixed centre mark */}
        <g stroke="rgba(11,11,11,0.5)" strokeWidth={1}>
          <line x1={r - 5} y1={r} x2={r + 5} y2={r} />
          <line x1={r} y1={r - 5} x2={r} y2={r + 5} />
        </g>

        {sweep && (
          <rect
            x={-size}
            y={0}
            width={size * 0.5}
            height={size}
            fill="rgba(255,255,255,0.55)"
            style={{
              mixBlendMode: "screen",
              animation: "issueCoreSweep 0.42s ease-out both",
            }}
          />
        )}
      </svg>
      {showLabel && (
        <span className="issue-core__label">{STATUS_LABEL[state]}</span>
      )}
    </div>
  );
}
