"use client";

import { useCallback, useRef, useState } from "react";

const HOLD_MS = 3000;
const PIN = process.env.NEXT_PUBLIC_STAFF_PIN ?? "";

export type LastJob = {
  serial: string;
  edition: string;
  issuedDate: string;
} | null;

/**
 * Hidden Staff Mode — a 96px invisible corner hotspot (bottom-left of the
 * stage), a 3s hold, then a 4-digit PIN. Disabled entirely in any
 * environment where NEXT_PUBLIC_STAFF_PIN is unset, so it is inert unless a
 * deployment explicitly configures one.
 */
export default function StaffMode({
  lastJob,
  onReturnIdle,
  onClearSession,
  onTestPrintFailure,
}: {
  lastJob: LastJob;
  onReturnIdle: () => void;
  onClearSession: () => void;
  onTestPrintFailure: () => void;
}) {
  const [stage, setStage] = useState<"hidden" | "pin" | "panel">("hidden");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startHold = useCallback(() => {
    if (!PIN) return;
    holdTimer.current = setTimeout(() => setStage("pin"), HOLD_MS);
  }, []);
  const cancelHold = useCallback(() => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
  }, []);

  const submitDigit = useCallback((d: string) => {
    setPinError(false);
    setPin((p) => {
      const next = (p + d).slice(0, 4);
      if (next.length === 4) {
        setTimeout(() => {
          if (next === PIN) {
            setStage("panel");
          } else {
            setPinError(true);
          }
          setPin("");
        }, 80);
      }
      return next;
    });
  }, []);

  const close = useCallback(() => {
    setStage("hidden");
    setPin("");
    setPinError(false);
  }, []);

  if (!PIN) return null;

  return (
    <>
      {/* invisible trigger — bottom-left corner, present on every screen */}
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onPointerDown={startHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        onPointerCancel={cancelHold}
        className="absolute bottom-0 left-0 z-[100] h-[96px] w-[96px] opacity-0"
        style={{ cursor: "default" }}
      />

      {stage === "pin" && (
        <div className="kiosk-overlay">
          <div className="flex w-[520px] flex-col items-center border border-[color:var(--color-ink)] bg-paper-bright px-[48px] py-[56px]">
            <p className="kicker">STAFF MODE</p>
            <div className="mt-[24px] flex gap-[16px]">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="h-[16px] w-[16px] rounded-full border border-[color:var(--color-ink)]"
                  style={{ background: i < pin.length ? "var(--color-ink)" : "transparent" }}
                />
              ))}
            </div>
            {pinError && (
              <p className="mt-[14px] font-mono text-[13px] uppercase tracking-[0.2em] text-ink">
                Incorrect PIN
              </p>
            )}
            <div className="mt-[28px] grid grid-cols-3 gap-[14px]">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", ""].map((d, i) =>
                d ? (
                  <button
                    key={i}
                    onClick={() => submitDigit(d)}
                    className="press flex h-[72px] w-[72px] items-center justify-center border border-[color:var(--color-line)] font-mono text-[22px]"
                    style={{ cursor: "pointer" }}
                  >
                    {d}
                  </button>
                ) : (
                  <span key={i} />
                ),
              )}
            </div>
            <button
              onClick={close}
              className="mt-[26px] font-mono text-[13px] uppercase tracking-[0.24em] text-silver-dim"
              style={{ cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {stage === "panel" && (
        <div className="kiosk-overlay">
          <div className="flex w-[820px] flex-col border border-[color:var(--color-ink)] bg-paper-bright px-[56px] py-[56px]">
            <p className="kicker">STAFF MODE</p>
            <h3 className="mt-[10px] font-display text-[34px] font-semibold">Machine status</h3>

            <div className="mt-[28px] grid grid-cols-3 gap-[16px] font-mono text-[13px] uppercase tracking-[0.16em]">
              <StatusRow label="Camera" value="Not connected" />
              <StatusRow label="Printer" value="Not connected" />
              <StatusRow label="Paper" value="Not connected" />
            </div>

            <div className="mt-[32px] grid grid-cols-2 gap-[14px]">
              <ActionButton disabled label="Test camera" note="No camera backend wired" />
              <ActionButton
                label="Test print (simulate failure)"
                note="Runs one issuing cycle, then triggers PRINT FAILED"
                onClick={() => {
                  onTestPrintFailure();
                  close();
                }}
              />
              <ActionButton
                disabled={!lastJob}
                label={lastJob ? `Reprint ${lastJob.serial}` : "Reprint last job"}
                note={lastJob ? "No printer backend wired" : "No completed job this session"}
              />
              <ActionButton
                label="Clear current session"
                onClick={() => {
                  onClearSession();
                  close();
                }}
              />
            </div>

            <div className="mt-[36px] flex items-center justify-between border-t border-[color:var(--color-line)] pt-[24px]">
              <button
                onClick={() => {
                  onReturnIdle();
                  close();
                }}
                className="press font-mono text-[14px] uppercase tracking-[0.24em]"
                style={{ cursor: "pointer" }}
              >
                Return to idle
              </button>
              <button
                onClick={close}
                className="press border border-[color:var(--color-ink)] bg-ink px-[24px] py-[14px] font-mono text-[14px] uppercase tracking-[0.24em] text-paper"
                style={{ cursor: "pointer" }}
              >
                Exit staff mode
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[color:var(--color-line)] px-[14px] py-[12px]">
      <div className="text-silver-dim">{label}</div>
      <div className="mt-[4px] text-ink">{value}</div>
    </div>
  );
}

function ActionButton({
  label,
  note,
  onClick,
  disabled,
}: {
  label: string;
  note?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || !onClick}
      className="press flex min-h-[72px] flex-col items-start justify-center gap-[2px] border border-[color:var(--color-line)] px-[16px] py-[12px] text-left disabled:opacity-40"
      style={{ cursor: disabled || !onClick ? "default" : "pointer" }}
    >
      <span className="font-mono text-[14px] uppercase tracking-[0.18em]">{label}</span>
      {note && <span className="font-mono text-[11px] tracking-[0.1em] text-silver-dim">{note}</span>}
    </button>
  );
}
