"use client";

import { useEffect, useRef, useState } from "react";
import FrameCore, { type FrameCoreState } from "@/app/components/motion/FrameCore";
import { CAPTURE_TOTAL } from "@/app/lib/edition";
import { useLang } from "@/app/lib/i18n";

// Timeline (monotonically increasing, no clamp arithmetic that can
// re-order two states): unprocessed -> indexing (6 steps) -> registering
// -> ready -> onDone. Total lands at 1780ms, inside the 1.2-1.8s brief.
const INDEXING_START_MS = 100;
const INDEXING_DURATION_MS = 900;
const STEP_MS = INDEXING_DURATION_MS / CAPTURE_TOTAL;
const REGISTERING_START_MS = INDEXING_START_MS + INDEXING_DURATION_MS + 80;
const REGISTERING_DURATION_MS = 500;
const READY_START_MS = REGISTERING_START_MS + REGISTERING_DURATION_MS;
const DONE_MS = READY_START_MS + 200;

// A single one-shot reflection pass behind FRAME CORE during "registering" —
// sourced from the supplied pc widget clip, re-encoded 2880x2880/32fps/8.5Mbps
// -> 640x640/24fps/~63KB/1.6s (see docs/ORIGINKIT_USAGE.md for the full
// audit). Only shown for the brief "registering" window, never looped, and
// entirely skipped under reduced-motion (poster only).
const VIDEO_SRC = "/assets/motion/frame-register-core.mp4";
const POSTER_SRC = "/assets/motion/frame-register-core-poster.jpg";

/**
 * REGISTERING FRAMES — a registration bed, not a centered loader. The FRAME
 * CORE is a fixed registration head straddling a vertical rule on the left;
 * the six captured frames run as a horizontal film to its right and lock into
 * alignment one at a time (left → right) as each is indexed. Continuous with
 * Capture's contact-sheet language and Select's proof language on either side.
 */
export default function RegisteringFramesScreen({ onDone }: { onDone: () => void }) {
  const { sub } = useLang();
  const [state, setState] = useState<FrameCoreState>("unprocessed");
  const [registeredCount, setRegisteredCount] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setState("indexing"), INDEXING_START_MS));
    for (let i = 1; i <= CAPTURE_TOTAL; i++) {
      timers.push(setTimeout(() => setRegisteredCount(i), INDEXING_START_MS + i * STEP_MS));
    }
    timers.push(setTimeout(() => setState("registering"), REGISTERING_START_MS));
    timers.push(setTimeout(() => setState("ready"), READY_START_MS));
    timers.push(setTimeout(onDone, DONE_MS));
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  // Play the reflection exactly once, only during "registering". Paused and
  // released on unmount / state change either way. (See ORIGINKIT_USAGE.md.)
  useEffect(() => {
    const v = videoRef.current;
    if (!v || reducedMotion) return;
    if (state === "registering") {
      v.currentTime = 0;
      v.play().catch(() => {});
    } else {
      v.pause();
    }
    return () => {
      v.pause();
    };
  }, [state, reducedMotion]);

  const shown = Math.min(registeredCount, CAPTURE_TOTAL);

  return (
    <div className="relative h-full w-full overflow-hidden bg-paper">
      {/* running header — top-left */}
      <p className="absolute left-[64px] top-[96px] font-mono text-[15px] uppercase tracking-[0.4em] text-silver-dim">
        Registering frames
      </p>

      {/* oversized count anchor, upper-left */}
      <div className="absolute left-[56px] top-[150px] flex items-baseline gap-[16px]">
        <span className="font-display font-semibold leading-[0.78] tracking-[-0.04em]" style={{ fontSize: 190 }}>
          {String(shown).padStart(2, "0")}
        </span>
        <span className="mb-[24px] font-display text-[46px] italic text-silver-dim">/ {String(CAPTURE_TOTAL).padStart(2, "0")}</span>
      </div>
      {sub && (
        <p className="absolute left-[64px] top-[400px] jp-sub text-[16px] text-silver-dim">
          フレームを登録しています
        </p>
      )}

      {/* registration bed — vertical rule + FRAME CORE head + horizontal film */}
      <div className="absolute inset-x-0 top-[900px] flex items-center pl-[56px]">
        {/* the registration head: FRAME CORE straddling a vertical rule */}
        <div className="relative flex h-[380px] w-[360px] shrink-0 items-center justify-center">
          <span className="absolute right-[6px] top-1/2 h-[264px] w-px -translate-y-1/2 bg-[color:var(--color-ink)]" aria-hidden="true" />
          {reducedMotion ? (
            state === "registering" || state === "ready" ? (
              <img
                src={POSTER_SRC}
                alt=""
                aria-hidden="true"
                className="absolute h-[280px] w-[280px] opacity-25 grayscale"
                style={{ mixBlendMode: "multiply" }}
              />
            ) : null
          ) : (
            <video
              ref={videoRef}
              src={VIDEO_SRC}
              poster={POSTER_SRC}
              muted
              playsInline
              preload="auto"
              className="absolute h-[280px] w-[280px] grayscale transition-opacity duration-300"
              style={{ mixBlendMode: "multiply", opacity: state === "registering" ? 0.3 : 0 }}
              aria-hidden="true"
            />
          )}
          <FrameCore state={state} registeredCount={registeredCount} size={280} showLabel={false} />
        </div>

        {/* the film: six frames feeding past the head, locking left → right */}
        <div className="flex items-center gap-[16px]" aria-hidden="true">
          {Array.from({ length: CAPTURE_TOTAL }).map((_, i) => {
            const locked = i < shown;
            return (
              <div
                key={i}
                className="relative h-[88px] w-[88px] shrink-0 border"
                style={{
                  borderColor: locked ? "var(--color-ink)" : "var(--color-line)",
                  transform: reducedMotion ? "none" : locked ? "translateY(0)" : "translateY(22px)",
                  opacity: locked ? 1 : 0.32,
                  transition: reducedMotion
                    ? "opacity 140ms linear"
                    : "transform 220ms cubic-bezier(0.22,0.61,0.36,1), opacity 220ms linear, border-color 220ms linear",
                }}
              >
                {locked && (
                  <>
                    <span className="absolute left-[6px] top-[6px] h-[14px] w-[14px] border-l-2 border-t-2 border-[color:var(--color-ink)]" />
                    <span className="absolute bottom-[6px] right-[6px] h-[14px] w-[14px] rotate-180 border-l-2 border-t-2 border-[color:var(--color-ink)]" />
                  </>
                )}
                <span
                  className="absolute inset-0 flex items-center justify-center font-mono text-[15px] tracking-[0.2em]"
                  style={{ color: locked ? "var(--color-ink)" : "var(--color-silver-dim)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* status line along the bottom edge */}
      <p className="absolute bottom-[80px] left-[64px] font-mono text-[14px] uppercase tracking-[0.3em] text-silver-dim">
        {state === "ready" ? "Registered · composing proof" : "Indexing captured frames"}
      </p>
    </div>
  );
}
