"use client";

import { useEffect, useState } from "react";
import FrameCore, { type FrameCoreState } from "@/app/components/motion/FrameCore";
import { CAPTURE_TOTAL } from "@/app/lib/edition";
import { useLang } from "@/app/lib/i18n";

const MIN_MS = 1200;
const MAX_MS = 1800;
const INDEX_STEP_MS = (MAX_MS - 300) / CAPTURE_TOTAL;

/**
 * A short, one-shot interstitial between Capture and Select. Not a spinner:
 * FRAME CORE indexes the six just-captured frames one by one, then settles —
 * clamped between MIN_MS and MAX_MS regardless of how fast that finishes.
 */
export default function RegisteringFramesScreen({ onDone }: { onDone: () => void }) {
  const { sub } = useLang();
  const [state, setState] = useState<FrameCoreState>("unprocessed");
  const [registeredCount, setRegisteredCount] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setState("indexing"), 120));
    for (let i = 1; i <= CAPTURE_TOTAL; i++) {
      timers.push(setTimeout(() => setRegisteredCount(i), 120 + i * INDEX_STEP_MS));
    }
    timers.push(setTimeout(() => setState("registering"), 120 + CAPTURE_TOTAL * INDEX_STEP_MS + 60));
    timers.push(setTimeout(() => setState("ready"), MAX_MS - 220));
    timers.push(setTimeout(onDone, Math.max(MIN_MS, MAX_MS)));
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  return (
    <div className="flex h-full flex-col items-center justify-center bg-paper">
      <FrameCore state={state} registeredCount={registeredCount} size={140} showLabel={false} />
      <p className="kicker mt-[30px]">REGISTERING FRAMES</p>
      {sub && <p className="jp-sub mt-[8px] text-[15px] text-silver-dim">フレームを登録しています</p>}
    </div>
  );
}
