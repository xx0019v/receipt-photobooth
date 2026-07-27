"use client";

import { useCallback, useEffect, useState } from "react";
import { ARTWORK, printGeometry, type PrintStyleId } from "@/app/lib/printArtifact";
import { rasterizeSpec, type RasterResult } from "@/app/lib/printRaster";
import { getHealth, thermalizePreview, type ThermalPreview } from "@/app/lib/api";
import { FIXTURE, fixtureScent, fixtureSpec } from "@/app/lib/printFixture";
import { CHROME_ASSETS } from "@/app/lib/chromeAssets";
import { QUOTES } from "@/app/lib/quotes";

type Panel = {
  source: RasterResult | null;
  thermal: ThermalPreview | null;
  error: string | null;
  busy: boolean;
};

const EMPTY: Panel = { source: null, thermal: null, error: null, busy: false };

/**
 * The inspector renders BOTH artefacts off-screen, rasterises each on demand,
 * and lays the numbers next to the pixels so a mismatch is visible rather than
 * asserted. Zoom steps (1x/2x/4x/8x) exist because thermal legibility lives at
 * the dot level — a hairline that survives on screen can vanish on paper.
 */
/**
 * Reachable when NOT a hardware kiosk, OR when a staff flag is explicitly set.
 * A guest-facing kiosk in hardware mode has no URL bar, but the guard makes
 * the intent unambiguous: this is not a guest screen.
 */
const INSPECTOR_ENABLED =
  process.env.NEXT_PUBLIC_BOOTH_MODE !== "hardware" ||
  process.env.NEXT_PUBLIC_ENABLE_INSPECTOR === "1";

export default function PrintInspector() {
  if (!INSPECTOR_ENABLED) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#111",
          color: "#777",
          fontFamily: "ui-monospace, monospace",
          fontSize: 13,
          letterSpacing: "0.2em",
        }}
      >
        INSPECTOR DISABLED ON HARDWARE KIOSK
      </main>
    );
  }
  return <PrintInspectorInner />;
}

function PrintInspectorInner() {
  const [pass, setPass] = useState<Panel>(EMPTY);
  const [film, setFilm] = useState<Panel>(EMPTY);
  const [widthDots, setWidthDots] = useState(384);
  const [backendUp, setBackendUp] = useState<boolean | null>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    getHealth()
      .then((h) => {
        setWidthDots(h.artifact.width_dots);
        setBackendUp(true);
      })
      .catch(() => setBackendUp(false));
  }, []);

  // Dev-only hook: lets a script rasterise a fixture spec and drive a real
  // backend print, so the saved bundle can seed the golden fixtures. Guarded
  // by INSPECTOR_ENABLED (this whole page) — never present on a hardware kiosk.
  useEffect(() => {
    (window as unknown as { __rasterizeFixture?: unknown }).__rasterizeFixture = (
      style: PrintStyleId,
      serial: string,
      w: number,
    ) => {
      const spec = { ...fixtureSpec(style), serial };
      return rasterizeSpec(spec, w);
    };
  }, []);

  const run = useCallback(
    async (style: PrintStyleId, set: (p: Panel) => void) => {
      set({ ...EMPTY, busy: true });
      try {
        const spec = fixtureSpec(style);
        const source = await rasterizeSpec(spec, widthDots);
        let thermal: ThermalPreview | null = null;
        if (backendUp) thermal = await thermalizePreview(style, source.blob);
        set({ source, thermal, error: null, busy: false });
      } catch (err) {
        set({ ...EMPTY, error: err instanceof Error ? err.message : String(err) });
      }
    },
    [widthDots, backendUp],
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#111",
        color: "#eee",
        fontFamily: "ui-monospace, monospace",
        padding: "28px 32px 80px",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 18,
          borderBottom: "1px solid #333",
          paddingBottom: 14,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <h1 style={{ fontSize: 15, letterSpacing: "0.24em", margin: 0 }}>
          PRINT ARTIFACT INSPECTOR
        </h1>
        <span style={{ fontSize: 12, color: "#888" }}>
          staff / development only — not a guest screen
        </span>
        <span
          style={{
            fontSize: 12,
            marginLeft: "auto",
            color: backendUp ? "#7ec87e" : "#c87e7e",
          }}
        >
          backend:{" "}
          {backendUp === null
            ? "checking…"
            : backendUp
              ? `up · ${widthDots} dots`
              : "down (thermal preview unavailable)"}
        </span>
      </header>

      <div style={{ display: "flex", gap: 16, marginBottom: 22, flexWrap: "wrap" }}>
        <button style={btn} onClick={() => run("pass", setPass)}>
          RASTERISE PASS
        </button>
        <button style={btn} onClick={() => run("cover", setFilm)}>
          RASTERISE FILM
        </button>
        <label style={{ fontSize: 12, color: "#aaa", alignSelf: "center" }}>
          zoom{" "}
          {[1, 2, 4, 8].map((z) => (
            <button
              key={z}
              style={{ ...btn, padding: "3px 9px", marginLeft: 6, background: zoom === z ? "#2a4" : "#222" }}
              onClick={() => setZoom(z)}
            >
              {z}×
            </button>
          ))}
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
        <ArtifactColumn title="PASS · Boarding Pass" style="pass" panel={pass} zoom={zoom} />
        <ArtifactColumn title="FILM · Photo Film" style="cover" panel={film} zoom={zoom} />
      </div>
    </main>
  );
}

function ArtifactColumn({
  title,
  style,
  panel,
  zoom,
}: {
  title: string;
  style: PrintStyleId;
  panel: Panel;
  zoom: number;
}) {
  const art = ARTWORK[style];
  const spec = fixtureSpec(style);
  const geometry = printGeometry(spec, panel.source?.widthDots ?? 384);
  const quote = style === "cover" ? QUOTES[FIXTURE.quoteIndex] : null;

  return (
    <section style={{ border: "1px solid #333", borderRadius: 6, overflow: "hidden" }}>
      <h2 style={{ fontSize: 13, letterSpacing: "0.2em", margin: 0, padding: "12px 14px", background: "#1a1a1a" }}>
        {title}
      </h2>

      <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 14px", fontSize: 12, padding: "14px", margin: 0, color: "#bbb" }}>
        <Row k="artwork">{art.width} × {art.height} ({art.orientation})</Row>
        <Row k="print canvas">{art.canvas.width} × {art.canvas.height}</Row>
        <Row k="rotated in DOM">{art.rotatedInDom ? "yes (once)" : "no"}</Row>
        <Row k="serial">{FIXTURE.serial}</Row>
        <Row k="issue">{FIXTURE.issueDate} · {FIXTURE.issueTime}</Row>
        <Row k="edition">{FIXTURE.edition}</Row>
        <Row k="frame order">[{FIXTURE.frameOrder.join(", ")}] (print order)</Row>
        <Row k="scent">{fixtureScent().code} · {fixtureScent().name}</Row>
        <Row k="motif">{CHROME_ASSETS[FIXTURE.motifId].id}</Row>
        <Row k="quote">{quote ? `"${quote.text}"` : "— (PASS has none)"}</Row>
        <Row k="QR">{style === "pass" ? "yes (real /p/serial)" : "none (FILM has no QR)"}</Row>
        {panel.source && (
          <>
            <Row k="source raster">{panel.source.widthDots} × {panel.source.heightDots} dots</Row>
            <Row k="physical">{geometry.physicalWidthMm} × {geometry.physicalLengthMm} mm @ {geometry.dpi} dpi</Row>
            <Row k="source sha256">{panel.source.sha256.slice(0, 16)}…</Row>
          </>
        )}
        {panel.thermal && (
          <>
            <Row k="thermal raster">{panel.thermal.widthDots} × {panel.thermal.heightDots} dots (1-bit)</Row>
            <Row k="black ratio">{(panel.thermal.blackRatio * 100).toFixed(1)}%</Row>
          </>
        )}
      </dl>

      {panel.busy && <p style={{ padding: 14, color: "#888" }}>rasterising…</p>}
      {panel.error && <p style={{ padding: 14, color: "#e88" }} data-error>{panel.error}</p>}

      {panel.source && (
        <div style={{ display: "flex", gap: 18, padding: 14, overflowX: "auto", background: "#0c0c0c" }}>
          <figure style={{ margin: 0 }}>
            <figcaption style={cap}>SOURCE (canonical raster)</figcaption>
            <img
              src={panel.source.dataUrl}
              alt={`${style} source raster`}
              data-source-raster={style}
              style={{ width: panel.source.widthDots * zoom, imageRendering: zoom > 1 ? "pixelated" : "auto", border: "1px solid #333", background: "#fff" }}
            />
          </figure>
          {panel.thermal && (
            <figure style={{ margin: 0 }}>
              <figcaption style={cap}>THERMAL (1-bit, what the head burns)</figcaption>
              <img
                src={panel.thermal.url}
                alt={`${style} thermal raster`}
                data-thermal-raster={style}
                style={{ width: panel.thermal.widthDots * zoom, imageRendering: "pixelated", border: "1px solid #333", background: "#fff" }}
              />
            </figure>
          )}
        </div>
      )}
    </section>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <>
      <dt style={{ color: "#777" }}>{k}</dt>
      <dd style={{ margin: 0, color: "#ddd" }}>{children}</dd>
    </>
  );
}

const btn: React.CSSProperties = {
  background: "#222",
  color: "#eee",
  border: "1px solid #444",
  borderRadius: 4,
  padding: "8px 14px",
  fontFamily: "inherit",
  fontSize: 12,
  letterSpacing: "0.1em",
  cursor: "pointer",
};

const cap: React.CSSProperties = { fontSize: 11, color: "#888", marginBottom: 6, letterSpacing: "0.14em" };
