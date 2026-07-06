"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Stage from "@/app/components/Stage";
import { serialNo, TOTAL_SHOTS } from "@/app/lib/edition";
import IdleScreen from "./screens/IdleScreen";
import IntroScreen from "./screens/IntroScreen";
import CaptureScreen from "./screens/CaptureScreen";
import ReviewScreen from "./screens/ReviewScreen";
import PrintingScreen from "./screens/PrintingScreen";
import DoneScreen from "./screens/DoneScreen";

export type Phase =
  | "idle"
  | "intro"
  | "capture"
  | "review"
  | "printing"
  | "done";

export { TOTAL_SHOTS };

export default function KioskApp() {
  const [phase, setPhase] = useState<Phase>("idle");
  /** captured frame ids (mock — real camera comes later) */
  const [frames, setFrames] = useState<number[]>([]);
  const [serial, setSerial] = useState("0000-0000");
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const go = useCallback((p: Phase) => setPhase(p), []);

  const startSession = useCallback(() => {
    setFrames([]);
    setPhase("intro");
  }, []);

  const retake = useCallback(() => {
    setFrames([]);
    setPhase("capture");
  }, []);

  const finishCapture = useCallback((captured: number[]) => {
    setFrames(captured);
    setSerial(serialNo());
    setPhase("review");
  }, []);

  const reset = useCallback(() => {
    setFrames([]);
    setPhase("idle");
  }, []);

  // Auto-return to idle if the user walks away mid-session.
  useEffect(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (phase === "intro" || phase === "review") {
      idleTimer.current = setTimeout(reset, 45_000);
    }
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [phase, reset]);

  return (
    <Stage>
      {phase === "idle" && <IdleScreen onStart={startSession} />}
      {phase === "intro" && <IntroScreen onBegin={() => go("capture")} />}
      {phase === "capture" && (
        <CaptureScreen total={TOTAL_SHOTS} onComplete={finishCapture} />
      )}
      {phase === "review" && (
        <ReviewScreen
          frames={frames}
          serial={serial}
          onPrint={() => go("printing")}
          onRetake={retake}
        />
      )}
      {phase === "printing" && (
        <PrintingScreen
          frames={frames}
          serial={serial}
          onDone={() => go("done")}
        />
      )}
      {phase === "done" && <DoneScreen serial={serial} onReset={reset} />}
    </Stage>
  );
}
