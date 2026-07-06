"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Stage from "@/app/components/Stage";
import { serialNo, TOTAL_SHOTS } from "@/app/lib/edition";
import {
  BoothSession,
  createSession,
  Frame,
} from "@/app/lib/api";
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
  const [frames, setFrames] = useState<Frame[]>([]);
  const [serial, setSerial] = useState("0000-0000");
  /** Backend session; null = offline/mock mode (UI still fully works). */
  const [session, setSession] = useState<BoothSession | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const go = useCallback((p: Phase) => setPhase(p), []);

  // The backend prints every frame stored in a session, so each capture run
  // (initial or retake) gets a fresh session. Failure -> mock mode.
  const openSession = useCallback(async () => {
    setSession(null);
    try {
      const s = await createSession();
      setSession(s);
      setSerial(s.serial);
    } catch {
      setSerial(serialNo());
    }
  }, []);

  const startSession = useCallback(() => {
    setFrames([]);
    setPhase("intro");
    void openSession();
  }, [openSession]);

  const retake = useCallback(() => {
    setFrames([]);
    setPhase("capture");
    void openSession();
  }, [openSession]);

  const finishCapture = useCallback((captured: Frame[]) => {
    setFrames(captured);
    setPhase("review");
  }, []);

  const reset = useCallback(() => {
    setFrames([]);
    setSession(null);
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
        <CaptureScreen
          total={TOTAL_SHOTS}
          session={session}
          onComplete={finishCapture}
        />
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
          session={session}
          onDone={() => go("done")}
        />
      )}
      {phase === "done" && <DoneScreen serial={serial} onReset={reset} />}
    </Stage>
  );
}
