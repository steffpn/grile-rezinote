"use client"

import { useEffect, useRef } from "react"

/**
 * HeroProbeAnimation — sondă dentară care scanează un dinte stilizat,
 * lăsând în urmă o linie ECG cu spike-uri. SVG inline cu RAF + reduced-motion
 * fallback (oprește la frame final).
 *
 * Spec § Animations → animația sondei.
 *
 * - Durată: 4200ms per ciclu, 800ms pauză, apoi reia
 * - X path: 60 → 480, Y: 178
 * - ECG path revealed via stroke-dashoffset
 * - Counter "00.0% → 100.0%" în mono
 */
export function HeroProbeAnimation() {
  const probeRef = useRef<SVGGElement | null>(null)
  const ecgRef = useRef<SVGPathElement | null>(null)
  const pctRef = useRef<SVGTextElement | null>(null)

  useEffect(() => {
    const probe = probeRef.current
    const ecg = ecgRef.current
    const pct = pctRef.current
    if (!probe || !ecg || !pct) return

    const totalLen = ecg.getTotalLength()
    ecg.setAttribute("stroke-dasharray", String(totalLen))
    ecg.setAttribute("stroke-dashoffset", String(totalLen))

    const startX = 60
    const endX = 480
    const y = 178
    const dur = 4200
    const pause = 800

    // Reduced-motion: desenează frame final și oprește.
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (reduced) {
      probe.setAttribute("transform", `translate(${endX}, ${y})`)
      ecg.setAttribute("stroke-dashoffset", "0")
      pct.textContent = "100.0%"
      return
    }

    let rafId = 0
    let t0: number | null = null

    const frame = (ts: number) => {
      if (t0 === null) t0 = ts
      let p = ((ts - t0) % (dur + pause)) / dur
      if (p > 1) p = 1
      const x = startX + (endX - startX) * p
      probe.setAttribute("transform", `translate(${x}, ${y})`)
      ecg.setAttribute("stroke-dashoffset", String(totalLen * (1 - p)))
      pct.textContent = (p * 100).toFixed(1).padStart(4, "0") + "%"
      rafId = requestAnimationFrame(frame)
    }

    rafId = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafId)
  }, [])

  return (
    <div className="mx-auto mt-9 h-[280px] w-[540px] max-w-full">
      <svg
        viewBox="0 0 540 280"
        className="block h-full w-full overflow-visible"
        aria-label="Sondă dentară scanează un dinte stilizat"
      >
        <defs>
          <linearGradient id="probeShaft" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="oklch(0.45 0.02 165)" />
            <stop offset="50%" stopColor="oklch(0.78 0.02 165)" />
            <stop offset="100%" stopColor="oklch(0.55 0.02 165)" />
          </linearGradient>
          <linearGradient id="probeTip" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="oklch(0.78 0.02 165)" />
            <stop offset="100%" stopColor="oklch(0.95 0.01 165)" />
          </linearGradient>
          <radialGradient id="probeGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="oklch(0.84 0.21 162 / 0.7)" />
            <stop offset="100%" stopColor="oklch(0.84 0.21 162 / 0)" />
          </radialGradient>
          <clipPath id="ecgClip">
            <rect x="0" y="0" width="540" height="280" />
          </clipPath>
        </defs>

        {/* Baseline scan track (faint) */}
        <line
          x1="60"
          y1="200"
          x2="480"
          y2="200"
          stroke="oklch(0.26 0.018 165)"
          strokeDasharray="2 4"
          strokeWidth="1"
        />

        {/* TOOTH stylized (molar) */}
        <g
          transform="translate(270, 140)"
          stroke="oklch(0.55 0.015 95)"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M -42 -18 C -54 -36, -42 -52, -28 -50 C -22 -58, -8 -58, 0 -50 C 8 -58, 22 -58, 28 -50 C 42 -52, 54 -36, 42 -18 L 38 12 L -38 12 Z" />
          <path
            d="M -28 -50 L -22 -32 M 0 -50 L 0 -30 M 28 -50 L 22 -32"
            stroke="oklch(0.42 0.018 165)"
            strokeWidth="1"
          />
          <path
            d="M -22 -32 Q 0 -22 22 -32"
            stroke="oklch(0.42 0.018 165)"
            strokeWidth="1"
          />
          <path d="M -38 12 L -32 56 Q -28 64 -20 56 L -16 16" />
          <path d="M 16 16 L 20 56 Q 28 64 32 56 L 38 12" />
          <line
            x1="-50"
            y1="14"
            x2="50"
            y2="14"
            stroke="oklch(0.42 0.018 165)"
            strokeWidth="1"
          />
        </g>

        {/* ECG path — revealed by probe via dashoffset */}
        <g clipPath="url(#ecgClip)">
          <path
            ref={ecgRef}
            d="M 60 200 L 130 200 L 150 200 L 165 188 L 175 212 L 185 168 L 195 232 L 205 200 L 230 200 L 245 195 L 260 205 L 275 175 L 285 220 L 295 195 L 305 200 L 340 200 L 360 192 L 370 208 L 380 200 L 480 200"
            fill="none"
            stroke="oklch(0.84 0.21 162)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter:
                "drop-shadow(0 0 6px oklch(0.84 0.21 162 / 0.6))",
            }}
          />
        </g>

        {/* Probe instrument */}
        <g ref={probeRef}>
          {/* handle (knurled) */}
          <rect
            x="-90"
            y="-7"
            width="80"
            height="14"
            rx="3"
            fill="url(#probeShaft)"
          />
          {Array.from({ length: 9 }).map((_, i) => (
            <line
              key={i}
              x1={-80 + i * 8}
              y1="-5"
              x2={-80 + i * 8}
              y2="5"
              stroke="oklch(0.30 0.018 165)"
            />
          ))}
          <rect
            x="-12"
            y="-9"
            width="8"
            height="18"
            rx="2"
            fill="oklch(0.40 0.02 165)"
          />
          <rect x="-4" y="-3" width="32" height="6" rx="1" fill="url(#probeTip)" />
          <path
            d="M 28 0 Q 36 0, 38 6 L 40 14"
            stroke="url(#probeTip)"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <line
            x1="40"
            y1="14"
            x2="42"
            y2="22"
            stroke="oklch(0.95 0.01 165)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="42" cy="22" r="10" fill="url(#probeGlow)" />
          <circle
            cx="42"
            cy="22"
            r="2.5"
            fill="oklch(0.95 0.21 162)"
            style={{
              filter: "drop-shadow(0 0 4px oklch(0.84 0.21 162))",
            }}
          />
        </g>

        {/* Scan readout corners */}
        <g
          fontFamily="var(--font-mono)"
          fontSize="9"
          fill="oklch(0.55 0.015 95)"
          letterSpacing="0.1em"
        >
          <text x="60" y="80" style={{ textTransform: "uppercase" }}>
            ▸ scan in progress
          </text>
          <text
            ref={pctRef}
            x="60"
            y="94"
            fill="oklch(0.84 0.21 162)"
          >
            00.0%
          </text>
          <text
            x="430"
            y="80"
            textAnchor="end"
            style={{ textTransform: "uppercase" }}
          >
            conf · 99.7
          </text>
          <text x="430" y="94" textAnchor="end">
            3.142 utilizatori
          </text>
        </g>

        {/* Crosshair frame */}
        <g
          stroke="oklch(0.84 0.21 162 / 0.4)"
          strokeWidth="1"
          fill="none"
        >
          <path d="M 50 60 L 50 75 M 50 60 L 65 60" />
          <path d="M 490 60 L 490 75 M 490 60 L 475 60" />
          <path d="M 50 230 L 50 245 M 50 245 L 65 245" />
          <path d="M 490 230 L 490 245 M 490 245 L 475 245" />
        </g>
      </svg>
    </div>
  )
}
