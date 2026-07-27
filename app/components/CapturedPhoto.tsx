"use client";

import Portrait from "./Portrait";

/**
 * One visual contract for a captured frame.
 *
 * Hardware sessions pass the backend JPEG URL all the way from Capture to
 * proof, PASS/FILM and Done. Mock sessions deliberately keep the editorial
 * placeholder so the UI remains usable without a camera.
 */
export default function CapturedPhoto({
  src,
  seed = 0,
  print = false,
  className = "",
}: {
  src?: string;
  seed?: number;
  print?: boolean;
  className?: string;
}) {
  if (!src) {
    return <Portrait seed={seed} print={print} className={className} />;
  }

  return (
    <img
      src={src}
      width={1200}
      height={1600}
      alt=""
      aria-hidden="true"
      className={className}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        objectFit: "cover",
        filter: print ? "grayscale(1) contrast(1.08)" : "grayscale(1)",
      }}
    />
  );
}
