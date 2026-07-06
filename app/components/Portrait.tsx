/**
 * Portrait — an editorial monochrome placeholder standing in for a captured
 * photo until the real camera feed is wired in. `seed` varies the composition
 * so the three frames differ. `print` renders the high-contrast, halftoned
 * "thermal receipt" version.
 */
export default function Portrait({
  seed = 0,
  print = false,
  className = "",
}: {
  seed?: number;
  print?: boolean;
  className?: string;
}) {
  const tilt = [-4, 0, 5][seed % 3];
  const shift = [-18, 6, 22][seed % 3];
  const gid = `pg${seed}${print ? "p" : ""}`;

  return (
    <svg
      viewBox="0 0 300 400"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
    >
      <defs>
        <radialGradient id={`${gid}-bg`} cx="50%" cy="34%" r="75%">
          {print ? (
            <>
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#d9d6cf" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#e9e6df" />
              <stop offset="55%" stopColor="#b9b6ae" />
              <stop offset="100%" stopColor="#6f6d67" />
            </>
          )}
        </radialGradient>
        <linearGradient id={`${gid}-fig`} x1="0" y1="0" x2="0" y2="1">
          {print ? (
            <>
              <stop offset="0%" stopColor="#101010" />
              <stop offset="100%" stopColor="#101010" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#2a2926" />
              <stop offset="100%" stopColor="#0d0d0c" />
            </>
          )}
        </linearGradient>
        <pattern
          id={`${gid}-dots`}
          width="4"
          height="4"
          patternUnits="userSpaceOnUse"
        >
          <rect width="4" height="4" fill="#f4f1e9" />
          <circle cx="2" cy="2" r="1.15" fill="#101010" />
        </pattern>
      </defs>

      <rect width="300" height="400" fill={`url(#${gid}-bg)`} />

      <g transform={`translate(${shift} 0) rotate(${tilt} 150 220)`}>
        {/* shoulders */}
        <path
          d="M40 400 C 55 300, 110 268, 150 268 C 190 268, 245 300, 260 400 Z"
          fill={`url(#${gid}-fig)`}
        />
        {/* neck */}
        <rect x="132" y="232" width="36" height="52" fill={`url(#${gid}-fig)`} />
        {/* head */}
        <ellipse cx="150" cy="176" rx="58" ry="70" fill={`url(#${gid}-fig)`} />
        {/* hair mass */}
        <path
          d="M92 176 C 88 108, 212 108, 208 176 C 214 150, 206 96, 150 96 C 94 96, 86 150, 92 176 Z"
          fill={`url(#${gid}-fig)`}
        />
      </g>

      {print && (
        <rect
          width="300"
          height="400"
          fill={`url(#${gid}-dots)`}
          opacity="0.22"
          style={{ mixBlendMode: "multiply" }}
        />
      )}
    </svg>
  );
}
