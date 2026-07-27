import PrintInspector from "./PrintInspector";

/**
 * PRINT ARTIFACT INSPECTOR — staff / development only.
 *
 * Not linked from the guest flow. It exists to prove one thing: the pixels
 * that reach the thermal head are the pixels the guest approved. It mounts
 * the real PASS and FILM components at print-canvas size, rasterises them
 * with the same code the kiosk uses, and (when the backend is up) shows the
 * exact 1-bit image the printer would burn.
 */
export const metadata = { title: "THE RECEIPT — Print Artifact Inspector" };

export default function Page() {
  return <PrintInspector />;
}
