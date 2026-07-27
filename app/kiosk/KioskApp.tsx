"use client";

import { useCallback, useMemo, useState } from "react";
import Stage from "@/app/components/Stage";
import LangToggle from "@/app/components/LangToggle";
import InactivityWarning from "@/app/components/InactivityWarning";
import StaffMode, { type LastJob } from "@/app/components/StaffMode";
import { LangProvider } from "@/app/lib/i18n";
import { PrintStyleProvider } from "@/app/lib/printStyle";
import { useInactivity } from "@/app/lib/inactivity";
import { type ErrorKind } from "@/app/lib/errors";
import { CAPTURE_TOTAL, editionDate, editionTime, issueNo, scentById, serialNo, TOTAL_SHOTS, type Scent } from "@/app/lib/edition";
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
import RegisteringFramesScreen from "./screens/RegisteringFramesScreen";
import SelectFramesScreen from "./screens/SelectFramesScreen";
import PrintingScreen from "./screens/PrintingScreen";
import DoneScreen from "./screens/DoneScreen";
import ErrorScreen from "./screens/ErrorScreen";

export type Phase =
  | "idle"
  | "scent"
  | "format"
  | "pose"
  | "capture"
  | "registeringFrames"
  | "selectFrames"
  | "printing"
  | "error"
  | "done";

// Inactivity durations per phase family (ms). Printing and error recovery
// are excluded entirely — see useInactivity(active=false) below.
const SELECT_TIMEOUT = 60_000;

export { TOTAL_SHOTS };

export default function KioskApp({
  selectedScent: externalSelectedScent,
}: {
  selectedScent?: SelectedScentInput;
} = {}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [frames, setFrames] = useState<number[]>([]);
  // The 6 raw captures for the current session; never reordered. `frames`
  // (above) becomes the 3 selected from this set, in the guest's chosen
  // print order, once Select confirms.
  const [capturedFrames, setCapturedFrames] = useState<number[]>([]);
  const [selectedScent, setSelectedScent] = useState<Scent>(() => scentById("nocturne"));
  const [serial, setSerial] = useState("0000-0000");
  const [issuedDate, setIssuedDate] = useState("");
  const [issuedTime, setIssuedTime] = useState("");
  const [edition, setEdition] = useState("");
  const [selectedQuote, setSelectedQuote] = useState<Quote>(QUOTES[0]);
  const [selectedChromeMotif, setSelectedChromeMotif] = useState<ChromeAsset>(COVER_MOTIF_ASSETS[0]);
  const [errorKind, setErrorKind] = useState<ErrorKind | null>(null);
  const [errorReturnPhase, setErrorReturnPhase] = useState<Phase>("printing");
  const [lastJob, setLastJob] = useState<LastJob>(null);
  const [staffForceFailure, setStaffForceFailure] = useState(false);
  // Forces PrintingScreen to remount (and its internal ritual stage to reset
  // to "review") on every fresh attempt — including a Staff Mode retry
  // triggered while already on the printing phase, where `phase` alone
  // wouldn't change and React would otherwise reuse the mounted instance.
  const [printAttempt, setPrintAttempt] = useState(0);

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

  // RETAKE ALL — from Proof or from Select: back to Capture for a fresh set
  // of 6, discarding whatever was captured/selected before. Edition, format,
  // serial, and issueDate are session-level and stay untouched.
  const retakeAll = useCallback(() => {
    setFrames([]);
    setCapturedFrames([]);
    setPhase("capture");
  }, []);

  // Capture finishes with 6 raw frames — no serial/print state is touched
  // yet; that only happens once Select confirms 3 of them.
  const finishCapture = useCallback((captured: number[]) => {
    setCapturedFrames(captured);
    setPhase("registeringFrames");
  }, []);

  const framesRegistered = useCallback(() => {
    setPhase("selectFrames");
  }, []);

  const confirmSelectedFrames = useCallback((selected: number[]) => {
    setFrames(selected);
    if (serial === "0000-0000") {
      const issuedAt = new Date();
      setSerial(serialNo());
      setIssuedDate(editionDate(issuedAt));
      setIssuedTime(editionTime(issuedAt));
      setEdition(issueNo(issuedAt));
    }
    setPrintAttempt((n) => n + 1);
    setPhase("printing");
  }, [serial]);

  const reset = useCallback(() => {
    setFrames([]);
    setCapturedFrames([]);
    setSelectedScent(scentById("nocturne"));
    setSerial("0000-0000");
    setIssuedDate("");
    setIssuedTime("");
    setEdition("");
    setSelectedQuote(QUOTES[0]);
    setSelectedChromeMotif(COVER_MOTIF_ASSETS[0]);
    setErrorKind(null);
    setStaffForceFailure(false);
    setPhase("idle");
  }, []);

  // Printing failed (real or Staff Mode simulated) — session data (frames,
  // serial, edition, issueDate, quote) is untouched, so retry resumes the
  // exact same job instead of regenerating identity.
  const handlePrintError = useCallback((kind: ErrorKind) => {
    setErrorReturnPhase("printing");
    setErrorKind(kind);
    setPhase("error");
  }, []);

  const retryFromError = useCallback(() => {
    setErrorKind(null);
    setStaffForceFailure(false);
    setPrintAttempt((n) => n + 1);
    setPhase(errorReturnPhase);
  }, [errorReturnPhase]);

  const returnToProofFromError = useCallback(() => {
    setErrorKind(null);
    setStaffForceFailure(false);
    setPhase("printing");
  }, []);

  const claim = useCallback(() => {
    setLastJob({ serial, edition, issuedDate });
    go("done");
  }, [serial, edition, issuedDate, go]);

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

  // Auto-return to idle if the guest walks away mid-session. Printing and
  // error recovery are excluded (active=false) so a job in flight or a
  // guest working through a recovery screen is never auto-reset; Capture
  // runs its own fixed countdown loop and is excluded too.
  const inactivityActive = phase === "scent" || phase === "format" || phase === "pose";
  const { warning: inactivityWarning, poke } = useInactivity(inactivityActive, SELECT_TIMEOUT, reset);

  return (
    <LangProvider>
      <PrintStyleProvider resetKey={phase === "idle" ? "idle" : undefined}>
      <ChromeArtworkProvider motif={selectedChromeMotif}>
      <Stage>
        <div className="absolute inset-0" onPointerDown={poke}>
        <LangToggle />
        <div key={phase} className="screen-swap">
        {phase === "idle" && <IdleScreen onStart={startSession} />}
        {phase === "scent" && <ScentScreen onSelect={chooseScent} />}
        {phase === "format" && (
          <FormatSelectScreen scent={selectedScent} filmProps={filmProps} onContinue={() => go("pose")} />
        )}
        {phase === "pose" && (
          <PoseScreen scent={selectedScent} onBegin={() => go("capture")} />
        )}
        {phase === "capture" && (
          <CaptureScreen
            total={CAPTURE_TOTAL}
            scent={selectedScent}
            onComplete={finishCapture}
          />
        )}
        {phase === "registeringFrames" && (
          <RegisteringFramesScreen onDone={framesRegistered} />
        )}
        {phase === "selectFrames" && (
          <SelectFramesScreen
            capturedFrames={capturedFrames}
            onConfirm={confirmSelectedFrames}
            onRetakeAll={retakeAll}
          />
        )}
        {phase === "printing" && (
          <PrintingScreen
            key={printAttempt}
            frames={frames}
            scent={selectedScent}
            serial={serial}
            issuedDate={issuedDate}
            issuedTime={issuedTime}
            filmProps={filmProps}
            onRetake={retakeAll}
            onClaim={claim}
            onPrintError={handlePrintError}
            simulateFailure={staffForceFailure ? "print-failed" : null}
          />
        )}
        {phase === "error" && errorKind && (
          <ErrorScreen
            kind={errorKind}
            onPrimary={errorKind === "paper-empty" ? returnToProofFromError : retryFromError}
            onSecondary={errorKind === "camera" ? reset : returnToProofFromError}
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
        {inactivityWarning && (
          <InactivityWarning onContinue={poke} onEnd={reset} />
        )}
        <StaffMode
          lastJob={lastJob}
          onReturnIdle={reset}
          onClearSession={reset}
          onTestPrintFailure={() => {
            setStaffForceFailure(true);
            setFrames(frames.length ? frames : [1, 2, 3]);
            if (serial === "0000-0000") {
              const issuedAt = new Date();
              setSerial(serialNo());
              setIssuedDate(editionDate(issuedAt));
              setIssuedTime(editionTime(issuedAt));
              setEdition(issueNo(issuedAt));
            }
            setPrintAttempt((n) => n + 1);
            setPhase("printing");
          }}
        />
        </div>
      </Stage>
      </ChromeArtworkProvider>
      </PrintStyleProvider>
    </LangProvider>
  );
}
