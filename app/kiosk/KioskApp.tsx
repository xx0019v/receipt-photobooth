"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Stage from "@/app/components/Stage";
import LangToggle from "@/app/components/LangToggle";
import { LangProvider } from "@/app/lib/i18n";
import { PrintStyleProvider } from "@/app/lib/printStyle";
import { editionDate, editionTime, issueNo, scentById, serialNo, TOTAL_SHOTS, type Scent } from "@/app/lib/edition";
import { QUOTES, type Quote } from "@/app/lib/quotes";
import { COVER_MOTIF_ASSETS, type ChromeAsset } from "@/app/lib/chromeAssets";
import { ChromeArtworkProvider } from "@/app/lib/chromeArtwork";
import { createFilmArtifactProps } from "@/app/lib/film";
import {
  initializeSession,
  motifForScent,
  type SelectedScentInput,
} from "@/app/lib/session";
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

export default function KioskApp({
  selectedScent: externalSelectedScent,
}: {
  selectedScent?: SelectedScentInput;
} = {}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [frames, setFrames] = useState<number[]>([]);
  const [selectedScent, setSelectedScent] = useState<Scent>(() => scentById("nocturne"));
  const [serial, setSerial] = useState("0000-0000");
  const [issuedDate, setIssuedDate] = useState("");
  const [issuedTime, setIssuedTime] = useState("");
  const [edition, setEdition] = useState("");
  const [selectedQuote, setSelectedQuote] = useState<Quote>(QUOTES[0]);
  const [selectedChromeMotif, setSelectedChromeMotif] = useState<ChromeAsset>(COVER_MOTIF_ASSETS[0]);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const go = useCallback((p: Phase) => setPhase(p), []);
  // The guest scrolls the scent chapters and confirms one; that scent and its
  // silver motif become fixed for the whole session, then we move to Format.
  const chooseScent = useCallback((scent: Scent) => {
    setSelectedScent(scent);
    setSelectedChromeMotif(motifForScent(scent));
    setPhase("format");
  }, []);

  const startSession = useCallback(() => {
    const session = initializeSession(externalSelectedScent);
    setFrames(session.frames);
    setSerial(session.serial);
    setIssuedDate(session.issueDate);
    setIssuedTime(session.issueTime);
    setEdition(session.edition);
    setSelectedScent(session.identity.selectedScent);
    setSelectedQuote(session.identity.selectedQuote);
    setSelectedChromeMotif(session.identity.selectedChromeMotif);
    setPhase("scent");
  }, [externalSelectedScent]);

  const retake = useCallback(() => {
    setFrames([]);
    setPhase("pose");
  }, []);

  const finishCapture = useCallback((captured: number[]) => {
    setFrames(captured);
    if (serial === "0000-0000") {
      const issuedAt = new Date();
      setSerial(serialNo());
      setIssuedDate(editionDate(issuedAt));
      setIssuedTime(editionTime(issuedAt));
      setEdition(issueNo(issuedAt));
    }
    setPhase("printing");
  }, [serial]);

  const reset = useCallback(() => {
    setFrames([]);
    setSelectedScent(scentById("nocturne"));
    setSerial("0000-0000");
    setIssuedDate("");
    setIssuedTime("");
    setEdition("");
    setSelectedQuote(QUOTES[0]);
    setSelectedChromeMotif(COVER_MOTIF_ASSETS[0]);
    setPhase("idle");
  }, []);

  const filmProps = useMemo(
    () =>
      createFilmArtifactProps({
        frames,
        selectedQuote,
        selectedChromeMotif,
        selectedScent,
        serial,
        issueDate: issuedDate,
        edition,
      }),
    [
      edition,
      frames,
      issuedDate,
      selectedChromeMotif,
      selectedQuote,
      selectedScent,
      serial,
    ],
  );

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
      <PrintStyleProvider resetKey={phase === "idle" ? "idle" : undefined}>
      <ChromeArtworkProvider motif={selectedChromeMotif}>
      <Stage>
        <LangToggle />
        <div key={phase} className="screen-swap">
        {phase === "idle" && <IdleScreen onStart={startSession} />}
        {phase === "scent" && <ScentScreen onSelect={chooseScent} />}
        {phase === "format" && (
          <FormatSelectScreen onContinue={() => go("pose")} />
        )}
        {phase === "pose" && (
          <PoseScreen scent={selectedScent} onBegin={() => go("capture")} />
        )}
        {phase === "capture" && (
          <CaptureScreen
            total={TOTAL_SHOTS}
            scent={selectedScent}
            onComplete={finishCapture}
          />
        )}
        {phase === "printing" && (
          <PrintingScreen
            frames={frames}
            scent={selectedScent}
            serial={serial}
            issuedDate={issuedDate}
            issuedTime={issuedTime}
            filmProps={filmProps}
            onRetake={retake}
            onClaim={() => go("done")}
          />
        )}
        {phase === "done" && (
          <DoneScreen
            frames={frames}
            scent={selectedScent}
            serial={serial}
            issuedDate={issuedDate}
            issuedTime={issuedTime}
            filmProps={filmProps}
            onReset={reset}
          />
        )}
        </div>
      </Stage>
      </ChromeArtworkProvider>
      </PrintStyleProvider>
    </LangProvider>
  );
}
