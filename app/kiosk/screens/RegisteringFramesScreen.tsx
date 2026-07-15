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
 * A short, one-shot interstitial between Capture and Select. Not a spinner:
 * FRAME CORE indexes the six just-captured frames one by one, then settles —
 * clamped between MIN_MS and MAX_MS regardless of how fast that finishes.
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

  // Play the reflection exactly once, only during "registering". The clip
  // is 63KB (see ORIGINKIT_USAGE.md), so preload="auto" lets the browser
  // fetch/decode it during the ~1s of indexing that precedes "registering"
  // — with preload="none" the fetch wouldn't start until .play() is called,
  // which is too late for a state that only lasts ~500ms. Paused and
  // released on unmount / state change either way.
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

  return (
    <div className="relative flex h-full flex-col items-center justify-center bg-paper">
      {reducedMotion ? (
        state === "registering" || state === "ready" ? (
          <img
            src={POSTER_SRC}
            alt=""
            aria-hidden="true"
            className="absolute h-[220px] w-[220px] opacity-25 grayscale"
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
          className="absolute h-[220px] w-[220px] opacity-0 grayscale transition-opacity duration-300"
          style={{
            mixBlendMode: "multiply",
            opacity: state === "registering" ? 0.3 : 0,
          }}
          aria-hidden="true"
        />
      )}
      <FrameCore state={state} registeredCount={registeredCount} size={140} showLabel={false} />
      <p className="kicker mt-[30px]">REGISTERING FRAMES</p>
      {sub && <p className="jp-sub mt-[8px] text-[15px] text-silver-dim">フレームを登録しています</p>}
    </div>
  );
}
