"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLang } from "@/app/lib/i18n";
import { CHROME_ASSETS } from "@/app/lib/chromeAssets";

const LIQUID_STRANDS = [
  { left: "0%", width: "18%", delay: "0ms", depth: "78%" },
  { left: "17%", width: "17%", delay: "45ms", depth: "70%" },
  { left: "33%", width: "18%", delay: "15ms", depth: "84%" },
  { left: "50%", width: "17%", delay: "60ms", depth: "74%" },
  { left: "66%", width: "18%", delay: "25ms", depth: "82%" },
  { left: "83%", width: "17%", delay: "50ms", depth: "72%" },
] as const;

export default function IdleScreen({ onStart }: { onStart: () => void }) {
  const { sub } = useLang();
  const [entering, setEntering] = useState(false);
  const idleLips = CHROME_ASSETS.lips.path;
  const idleVideo = CHROME_ASSETS.silverLipsMotion.path;
  const [videoFailed, setVideoFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const begin = useCallback(() => {
    if (entering) return;
    setEntering(true);
    timer.current = setTimeout(onStart, 1050);
  }, [entering, onStart]);

  return (
    <main className={`idle-ritual${entering ? " is-entering" : ""}`}>
      <header className="idle-ritual__header" aria-hidden={entering}>
        <p>THE RECEIPT · PRINT STUDIO</p>
        <span>ACUSE / TOKYO</span>
      </header>

      <div className="idle-ritual__index" aria-hidden="true">
        <span>RITUAL No. 01</span>
        <span>LIQUID / MEMORY / SILVER</span>
      </div>

      <button
        type="button"
        className="idle-ritual__trigger"
        onClick={begin}
        disabled={entering}
        aria-label={sub ? "はじめる — 銀の唇をタップ" : "Tap the silver lips to begin"}
      >
        <span className="idle-ritual__tap">TOUCH THE SILVER</span>
        <span className="idle-ritual__lips">
          <img
            className="idle-ritual__fallback"
            src={idleLips}
            width={850}
            height={600}
            alt=""
            aria-hidden="true"
          />
          <video
            className={`idle-ritual__video${videoFailed ? " is-unavailable" : ""}`}
            src={idleVideo}
            poster={idleLips}
            width={850}
            height={600}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
            onError={() => setVideoFailed(true)}
          />
        </span>
        <span className="idle-ritual__instruction">
          <em>はじめる</em>
        </span>
      </button>

      <footer className="idle-ritual__footer" aria-hidden={entering}>
        <p>SILVER<br />LIQUID<br />RITUAL</p>
        <div>
          <span>01</span>
          <i />
          <span>∞</span>
        </div>
        <p className="idle-ritual__footer-jp">
          {sub ? "一瞬を、発行する" : "A MOMENT, ISSUED"}
        </p>
      </footer>

      <div className="liquid-transition" aria-hidden="true">
        {LIQUID_STRANDS.map((strand, index) => (
          <i
            key={index}
            style={{
              left: strand.left,
              width: strand.width,
              animationDelay: strand.delay,
              "--liquid-depth": strand.depth,
            } as React.CSSProperties}
          />
        ))}
        <span />
      </div>
      <div className="idle-ritual__wash" aria-hidden="true" />
    </main>
  );
}
