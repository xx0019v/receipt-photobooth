"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Stage from "@/app/components/Stage";
import { scentById, serialNo, TOTAL_SHOTS, type Scent } from "@/app/lib/edition";
import IdleScreen from "./screens/IdleScreen";
import ScentScreen from "./screens/ScentScreen";
import PoseScreen from "./screens/PoseScreen";
import CaptureScreen from "./screens/CaptureScreen";
import ReviewScreen from "./screens/ReviewScreen";
import PrintingScreen from "./screens/PrintingScreen";
import DoneScreen from "./screens/DoneScreen";

export type Phase =
  | "idle"
  | "scent"
  | "pose"
  | "capture"
  | "review"
  | "printing"
  | "done";

export { TOTAL_SHOTS };

export default function KioskApp() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [frames, setFrames] = useState<number[]>([]);
  const [scent, setScent] = useState<Scent>(() => scentById("nocturne"));
  const [serial, setSerial] = useState("0000-0000");
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const go = useCallback((p: Phase) => setPhase(p), []);

  const startSession = useCallback(() => {
    setFrames([]);
    setPhase("scent");
  }, []);

  const chooseScent = useCallback((s: Scent) => {
    setScent(s);
    setPhase("pose");
  }, []);

  const retake = useCallback(() => {
    setFrames([]);
    setPhase("pose");
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

  // Auto-return to idle if the guest walks away mid-session.
  useEffect(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (phase === "scent" || phase === "pose" || phase === "review") {
      idleTimer.current = setTimeout(reset, 60_000);
    }
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [phase, reset]);

  return (
    <Stage>
      {phase === "idle" && <IdleScreen onStart={startSession} />}
      {phase === "scent" && <ScentScreen onSelect={chooseScent} />}
      {phase === "pose" && (
        <PoseScreen scent={scent} onBegin={() => go("capture")} />
      )}
      {phase === "capture" && (
        <CaptureScreen
          total={TOTAL_SHOTS}
          scent={scent}
          onComplete={finishCapture}
        />
      )}
      {phase === "review" && (
        <ReviewScreen
          frames={frames}
          scent={scent}
          serial={serial}
          onPrint={() => go("printing")}
          onRetake={retake}
        />
      )}
      {phase === "printing" && (
        <PrintingScreen
          frames={frames}
          scent={scent}
          serial={serial}
          onDone={() => go("done")}
        />
      )}
      {phase === "done" && (
        <DoneScreen scent={scent} serial={serial} onReset={reset} />
      )}
    </Stage>
  );
}
