"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Stage — renders a fixed 1080×1920 portrait canvas and scales it to fit
 * the actual screen. On the Raspberry Pi touchscreen (native 1080×1920)
 * the scale is ~1; in the desktop preview it shrinks to fit the window.
 */
export default function Stage({ children }: { children: React.ReactNode }) {
  const [scale, setScale] = useState(1);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const fit = () => {
      const s = Math.min(window.innerWidth / 1080, window.innerHeight / 1920);
      setScale(s);
    };
    const onResize = () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(fit);
    };
    fit();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div className="kiosk-viewport">
      <div
        className="kiosk-stage grain vignette"
        style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}
