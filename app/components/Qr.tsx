/**
 * Deterministic decorative QR placeholder. Swap for a real encoder
 * (e.g. `qrcode`) once the share URL exists — keep the same box size.
 */
export default function Qr({
  cell = 12,
  seed = 7,
}: {
  cell?: number;
  seed?: number;
}) {
  const n = 21;
  const cells: boolean[] = [];
  let s = seed || 7;
  for (let i = 0; i < n * n; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    cells.push((s >> 16) % 2 === 0);
  }
  const inFinder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);

  const finderOn = (r: number, c: number) => {
    const local = (rr: number, cc: number) =>
      rr === 0 ||
      rr === 6 ||
      cc === 0 ||
      cc === 6 ||
      (rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4);
    if (r < 7 && c < 7) return local(r, c);
    if (r < 7 && c >= n - 7) return local(r, c - (n - 7));
    if (r >= n - 7 && c < 7) return local(r - (n - 7), c);
    return false;
  };

  return (
    <div
      className="grid bg-paper-bright"
      style={{
        gridTemplateColumns: `repeat(${n}, ${cell}px)`,
        gridTemplateRows: `repeat(${n}, ${cell}px)`,
      }}
    >
      {cells.map((on, i) => {
        const r = Math.floor(i / n);
        const c = i % n;
        const filled = inFinder(r, c) ? finderOn(r, c) : on;
        return (
          <span
            key={i}
            style={{ background: filled ? "var(--color-ink)" : "transparent" }}
          />
        );
      })}
    </div>
  );
}
