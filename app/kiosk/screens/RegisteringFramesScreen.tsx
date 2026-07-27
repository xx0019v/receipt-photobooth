"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CAPTURE_TOTAL } from "@/app/lib/edition";
import { useLang } from "@/app/lib/i18n";

type RegisteringState = "unprocessed" | "indexing" | "registering" | "ready";

// Timeline follows the supplied 6.125s chrome-object film. The six captured
// frames lock first, the object keeps moving while the proof is composed,
// then the ready state lands just before the clip finishes.
const INDEXING_START_MS = 150;
const INDEXING_DURATION_MS = 1_200;
const STEP_MS = INDEXING_DURATION_MS / CAPTURE_TOTAL;
const REGISTERING_START_MS = INDEXING_START_MS + INDEXING_DURATION_MS + 100;
const READY_START_MS = 5_600;
const DONE_MS = 6_250;

// The supplied pc widget clip is the loading object itself. It is re-encoded
// for Raspberry Pi Chromium at 960x960/24fps/~609KB, plays once, and is
// entirely replaced with a still under reduced motion.
const VIDEO_SRC = "/assets/motion/frame-register-core.mp4?v=2";
const POSTER_SRC = "/assets/motion/frame-register-core-poster.jpg?v=2";

/**
 * REGISTERING FRAMES uses the supplied chrome object as the unmistakable
 * loading focus after Capture. The six-frame film locks below it one frame at
 * a time, preserving continuity with Capture and Select without competing
 * with the object.
 */
export default function RegisteringFramesScreen({ onDone }: { onDone: () => void }) {
  const { sub } = useLang();
  const [state, setState] = useState<RegisteringState>("unprocessed");
  const [registeredCount, setRegisteredCount] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const doneRef = useRef(false);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  }, [onDone]);

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
    timers.push(setTimeout(finish, DONE_MS));
    return () => timers.forEach(clearTimeout);
  }, [finish]);

  // Play once for the complete interstitial. The timer above is a fallback
  // when Chromium cannot deliver an ended event.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (reducedMotion) {
      v.pause();
      return;
    }
    v.currentTime = 0;
    v.play().catch(() => {});
    return () => {
      v.pause();
    };
  }, [reducedMotion]);

  const shown = Math.min(registeredCount, CAPTURE_TOTAL);

  return (
    <div className="relative h-full w-full overflow-hidden bg-paper">
      {/* running header — top-left */}
      <p className="absolute left-[64px] top-[96px] font-mono text-[15px] uppercase tracking-[0.4em] text-silver-dim">
        Registering frames…
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
          フレームを登録しています…
        </p>
      )}

      {/* supplied chrome loading object */}
      <div className="absolute inset-x-0 top-[500px] flex justify-center" aria-hidden="true">
        {reducedMotion ? (
          <img
            src={POSTER_SRC}
            alt=""
            width={600}
            height={600}
            className="h-[600px] w-[600px] object-cover"
          />
        ) : (
          <video
            ref={videoRef}
            src={VIDEO_SRC}
            poster={POSTER_SRC}
            width={600}
            height={600}
            muted
            playsInline
            autoPlay
            preload="auto"
            onEnded={finish}
            className="h-[600px] w-[600px] object-cover"
          />
        )}
      </div>

      {/* six captured frames locking into print order */}
      <div className="absolute inset-x-0 top-[1240px] flex justify-center">
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
      <p
        className="absolute bottom-[80px] left-[64px] font-mono text-[14px] uppercase tracking-[0.3em] text-silver-dim"
        role="status"
        aria-live="polite"
      >
        {state === "ready" ? "Registered · composing proof" : "Indexing captured frames…"}
      </p>
    </div>
  );
}
