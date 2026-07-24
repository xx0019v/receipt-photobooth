/**
 * Portrait — an editorial monochrome stand-in for a captured photo until the
 * real camera feed is wired in. Off-centre, studio-lit, film-grained; `seed`
 * varies the composition across the three frames. `print` renders the
 * high-contrast, halftoned thermal-receipt version.
 *
 * When `src` is given (a real backend-captured frame), it renders that photo
 * — grayscaled to match the strict monochrome design — instead of the mock
 * silhouette, keeping the exact same box.
 */
export default function Portrait({
  seed = 0,
  print = false,
  className = "",
  src,
}: {
  seed?: number;
  print?: boolean;
  className?: string;
  src?: string | null;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className={className}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: print
            ? "grayscale(1) contrast(1.08)"
            : "grayscale(1) contrast(1.05) brightness(0.94)",
        }}
      />
    );
  }

  const turn = [-7, 4, -3][seed % 3];
  const shiftX = [-14, 16, 4][seed % 3];
  const scale = [1.02, 1.08, 1.0][seed % 3];
  const lightX = [34, 66, 50][seed % 3];
  const gid = `pt${seed}${print ? "p" : ""}`;

  return (
    <svg
      viewBox="0 0 300 400"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
    >
      <defs>
        <radialGradient id={`${gid}-bg`} cx={`${lightX}%`} cy="30%" r="85%">
          {print ? (
            <>
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#eceae3" />
              <stop offset="100%" stopColor="#cfccc4" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#eeebe4" />
              <stop offset="45%" stopColor="#b3b0a8" />
              <stop offset="100%" stopColor="#4c4a46" />
            </>
          )}
        </radialGradient>

        <linearGradient
          id={`${gid}-fig`}
          x1={`${lightX}%`}
          y1="18%"
          x2="60%"
          y2="100%"
        >
          {print ? (
            <>
              <stop offset="0%" stopColor="#0d0d0d" />
              <stop offset="100%" stopColor="#0d0d0d" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#39373300" />
              <stop offset="0%" stopColor="#3a3833" />
              <stop offset="55%" stopColor="#191817" />
              <stop offset="100%" stopColor="#070707" />
            </>
          )}
        </linearGradient>

        <linearGradient id={`${gid}-rim`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f4f1e9" stopOpacity={print ? "0" : "0.5"} />
          <stop offset="35%" stopColor="#f4f1e9" stopOpacity="0" />
        </linearGradient>

        <pattern id={`${gid}-dots`} width="3" height="3" patternUnits="userSpaceOnUse">
          <rect width="3" height="3" fill="#f4f1e9" />
          <circle cx="1.5" cy="1.5" r="0.9" fill="#0d0d0d" />
        </pattern>

        <filter id={`${gid}-grain`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>

        <clipPath id={`${gid}-clip`}>
          <rect width="300" height="400" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${gid}-clip)`}>
        <rect width="300" height="400" fill={`url(#${gid}-bg)`} />

        <g
          transform={`translate(${shiftX} 8) rotate(${turn} 150 210) scale(${scale})`}
          style={{ transformOrigin: "150px 210px" }}
        >
          {/* shoulders / torso */}
          <path
            d="M18 400 C 34 296, 96 262, 150 262 C 204 262, 266 296, 282 400 Z"
            fill={`url(#${gid}-fig)`}
          />
          {/* neck */}
          <path
            d="M128 234 C 128 266, 172 266, 172 234 L 172 208 L 128 208 Z"
            fill={`url(#${gid}-fig)`}
          />
          {/* head — full crown, drawn solid so nothing shows through the hair */}
          <path
            d="M150 88 C 204 88, 216 132, 212 176 C 208 218, 184 248, 150 248 C 116 248, 92 218, 88 176 C 84 132, 96 88, 150 88 Z"
            fill={`url(#${gid}-fig)`}
          />
          {/* hair — a solid cap (no interior hole), merges with the head */}
          <path
            d="M92 142 C 82 92, 110 68, 150 68 C 190 68, 218 92, 208 142 C 190 160, 110 160, 92 142 Z"
            fill={`url(#${gid}-fig)`}
          />
        </g>

        {/* halftone for print, film grain for screen */}
        {print ? (
          <rect
            width="300"
            height="400"
            fill={`url(#${gid}-dots)`}
            opacity="0.16"
            style={{ mixBlendMode: "multiply" }}
          />
        ) : (
          <rect
            width="300"
            height="400"
            filter={`url(#${gid}-grain)`}
            opacity="0.09"
            style={{ mixBlendMode: "overlay" }}
          />
        )}

        {/* soft vignette */}
        <rect
          width="300"
          height="400"
          fill="url(#vig)"
          opacity={print ? "0" : "0.5"}
        />
      </g>

      <radialGradient id="vig" cx="50%" cy="42%" r="70%">
        <stop offset="60%" stopColor="#000000" stopOpacity="0" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0.45" />
      </radialGradient>
    </svg>
  );
}
