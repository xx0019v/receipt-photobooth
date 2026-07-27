"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Masthead from "@/app/components/Masthead";
import CapturedPhoto from "@/app/components/CapturedPhoto";
import FrameSelectionCarousel from "@/app/components/FrameSelectionCarousel";
import { TOTAL_SHOTS } from "@/app/lib/edition";
import { useLang } from "@/app/lib/i18n";

/**
 * SELECT YOUR FRAMES — pick TOTAL_SHOTS of the captured frames, in order.
 * capturedFrames never gets reordered; selectedIds is the only ordered list.
 * The strip scrolls sideways natively; tapping the centred proof adds it to
 * the next open PRINT ORDER slot, and tapping a selected proof removes it.
 */
export default function SelectFramesScreen({
  capturedFrames,
  frameSources,
  onConfirm,
  onRetakeAll,
}: {
  capturedFrames: number[];
  frameSources?: Record<number, string>;
  onConfirm: (selected: number[]) => void;
  onRetakeAll: () => void;
}) {
  const { sub } = useLang();
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [fullNotice, setFullNotice] = useState(false);

  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => () => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
  }, []);

  // Quiet one-shot notice when a 4th selection is attempted — no toast, no
  // error styling, just a line that appears once and fades.
  const showFullNotice = useCallback(() => {
    setFullNotice(true);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setFullNotice(false), 2000);
  }, []);

  const toggleSelect = useCallback(
    (id: number) => {
      setSelectedIds((prev) => {
        if (prev.includes(id)) return prev.filter((x) => x !== id);
        if (prev.length >= TOTAL_SHOTS) {
          showFullNotice();
          return prev;
        }
        return [...prev, id];
      });
    },
    [showFullNotice],
  );

  const ready = selectedIds.length === TOTAL_SHOTS;

  return (
    <div className="flex h-full flex-col">
      <Masthead />

      {/* header — the selection count is the screen's second-largest element,
          set as a live counter opposite the title, not a caption under it */}
      <div className="flex items-end justify-between px-[80px] pt-[36px]">
        <div>
          <p className="kicker">Step IV · Select</p>
          <h2 className="mt-[12px] font-display text-[64px] font-semibold leading-[0.92] tracking-[-0.02em]">
            Select your <span className="italic">frames</span>
          </h2>
          {sub && <p className="jp-sub mt-[8px] text-[18px] text-silver-dim">印刷する3枚を選んでください</p>}
        </div>
        <div className="flex flex-col items-end">
          <span className="flex items-baseline gap-[10px]">
            <span className="font-display text-[96px] font-semibold leading-[0.8] tracking-[-0.03em]">
              {selectedIds.length}
            </span>
            <span className="font-display text-[38px] italic text-silver-dim">/ {TOTAL_SHOTS}</span>
          </span>
          <span className="mt-[4px] font-mono text-[13px] uppercase tracking-[0.3em] text-silver-dim">
            {fullNotice ? <span className="text-ink">3 frames already registered</span> : "Selected"}
          </span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-[40px] py-[20px]">
        <FrameSelectionCarousel
          frameIds={capturedFrames}
          frameSources={frameSources}
          activeIndex={activeIndex}
          onActiveChange={setActiveIndex}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          reducedMotion={reducedMotion}
        />
      </div>

      {/* Print order — a thin proof strip, not a card grid */}
      <div className="px-[80px] pb-[18px]">
        <div className="flex items-center justify-between border-t border-[color:var(--color-line)] pt-[18px] font-mono text-[13px] uppercase tracking-[0.28em] text-silver-dim">
          <span>Print order</span>
          {sub && <span className="jp-sub normal-case text-[13px]">印刷順</span>}
        </div>
        <div className="mt-[14px] flex gap-[16px]">
          {Array.from({ length: TOTAL_SHOTS }).map((_, i) => {
            const id = selectedIds[i];
            return (
              <button
                key={i}
                onClick={() => {
                  if (id === undefined) return;
                  const idx = capturedFrames.indexOf(id);
                  if (idx >= 0) setActiveIndex(idx);
                }}
                className="relative h-[88px] w-[88px] shrink-0 overflow-hidden border border-[color:var(--color-line)] bg-paper-bright"
                style={{ cursor: id === undefined ? "default" : "pointer" }}
                disabled={id === undefined}
              >
                {id !== undefined ? (
                  <>
                    <CapturedPhoto src={frameSources?.[id]} seed={id} />
                    <span className="absolute inset-x-0 bottom-0 bg-paper-bright/85 py-[2px] text-center font-mono text-[10px] tracking-[0.2em]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </>
                ) : (
                  <span className="flex h-full items-center justify-center font-mono text-[12px] tracking-[0.2em] text-silver-dim">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_1.6fr] gap-[24px] px-[80px] pb-[80px]">
        <button
          onClick={onRetakeAll}
          className="press flex min-h-[112px] flex-col items-center justify-center gap-[6px] border border-[color:var(--color-ink)] bg-paper-bright px-[28px] py-[24px]"
          style={{ cursor: "pointer" }}
        >
          <span className="font-mono text-[21px] uppercase tracking-[0.26em]">Retake all</span>
          {sub && <span className="jp-sub text-[16px] text-silver-dim">すべて撮り直す</span>}
        </button>
        <button
          onClick={() => ready && onConfirm(selectedIds)}
          disabled={!ready}
          className="press flex min-h-[112px] items-center justify-center border border-[color:var(--color-ink)] bg-ink px-[28px] py-[24px] text-paper disabled:opacity-30"
          style={{ cursor: ready ? "pointer" : "default" }}
        >
          <span className="flex flex-col items-center gap-[4px]">
            <span className="font-mono text-[21px] uppercase tracking-[0.26em]">
              {ready ? "Use these 3" : "Ready to compose"}
            </span>
            {sub && <span className="jp-sub text-[16px] text-paper/60">この3枚を使用</span>}
          </span>
        </button>
      </div>
    </div>
  );
}
