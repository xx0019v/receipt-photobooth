"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Stage from "@/app/components/Stage";
import LangToggle from "@/app/components/LangToggle";
import { LangProvider } from "@/app/lib/i18n";
import { PrintStyleProvider } from "@/app/lib/printStyle";
import { scentById, serialNo, TOTAL_SHOTS, type Scent } from "@/app/lib/edition";
import { pickQuote, QUOTES, type Quote } from "@/app/lib/quotes";
import { COVER_MOTIF_ASSETS, pickChromeMotif, type ChromeAsset } from "@/app/lib/chromeAssets";
import { ChromeArtworkProvider } from "@/app/lib/chromeArtwork";
import IdleScreen from "./screens/IdleScreen";
import ScentScreen from "./screens/ScentScreen";
import FormatSelectScreen from "./screens/FormatSelectScreen";
import PoseScreen from "./screens/PoseScreen";
import CaptureScreen from "./screens/CaptureScreen";
import PrintingScreen from "./screens/PrintingScreen";
import DoneScreen from "./screens/DoneScreen";

export type Phase =
  | "idle"
  | "scent"
  | "format"
  | "pose"
  | "capture"
  | "printing"
  | "done";

export { TOTAL_SHOTS };

export default function KioskApp() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [frames, setFrames] = useState<number[]>([]);
  const [scent, setScent] = useState<Scent>(() => scentById("nocturne"));
  const [serial, setSerial] = useState("0000-0000");
  const [quote, setQuote] = useState<Quote>(QUOTES[0]);
  const [chromeMotif, setChromeMotif] = useState<ChromeAsset>(COVER_MOTIF_ASSETS[0]);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const go = useCallback((p: Phase) => setPhase(p), []);

  const startSession = useCallback(() => {
    setFrames([]);
    setSerial("0000-0000");
    setScent(scentById("nocturne"));
    setQuote(pickQuote());
    setChromeMotif(pickChromeMotif());
    setPhase("scent");
  }, []);

  const chooseScent = useCallback((s: Scent) => {
    setScent(s);
    setPhase("format");
  }, []);

  const retake = useCallback(() => {
    setFrames([]);
    setPhase("pose");
  }, []);

  const finishCapture = useCallback((captured: number[]) => {
    setFrames(captured);
    setSerial((current) => current === "0000-0000" ? serialNo() : current);
    setPhase("printing");
  }, []);

  const reset = useCallback(() => {
    setFrames([]);
    setPhase("idle");
  }, []);

  // Auto-return to idle if the guest walks away mid-session.
  useEffect(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (phase === "scent" || phase === "format" || phase === "pose") {
      idleTimer.current = setTimeout(reset, 60_000);
    }
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [phase, reset]);

  return (
    <LangProvider>
      <PrintStyleProvider>
      <ChromeArtworkProvider motif={chromeMotif}>
      <Stage>
        <LangToggle />
        <div key={phase} className="screen-swap">
        {phase === "idle" && <IdleScreen onStart={startSession} />}
        {phase === "scent" && <ScentScreen onSelect={chooseScent} />}
        {phase === "format" && (
          <FormatSelectScreen onContinue={() => go("pose")} />
        )}
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
        {phase === "printing" && (
          <PrintingScreen
            frames={frames}
            scent={scent}
            serial={serial}
            quote={quote}
            onRetake={retake}
            onClaim={() => go("done")}
          />
        )}
        {phase === "done" && (
          <DoneScreen frames={frames} scent={scent} serial={serial} quote={quote} onReset={reset} />
        )}
        </div>
      </Stage>
      </ChromeArtworkProvider>
      </PrintStyleProvider>
    </LangProvider>
  );
}
