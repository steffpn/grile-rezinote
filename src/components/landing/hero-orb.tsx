"use client"

import { motion, useReducedMotion } from "framer-motion"

/**
 * Pure SVG + CSS animated orb. Zero dependencies.
 * - Concentric rotating rings (different speeds + tilts)
 * - Inner gradient sphere with shimmer
 * - Orbiting particle dots
 * - Soft outer glow
 *
 * Replaces the previous Spline scene which broke prod webpack builds.
 */
export function HeroOrb() {
  const reduce = useReducedMotion()

  const ring = (delay: number, duration: number, reverse = false) => ({
    rotate: reduce ? 0 : reverse ? -360 : 360,
    transition: {
      rotate: {
        duration,
        repeat: reduce ? 0 : Infinity,
        ease: "linear" as const,
        delay,
      },
    },
  })

  return (
    <div className="relative aspect-square w-full">
      {/* Outer glow halo */}
      <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-emerald-500/25 via-teal-500/15 to-transparent blur-3xl" />

      {/* Soft pulsing aura */}
      <motion.div
        aria-hidden
        className="absolute inset-[10%] rounded-full bg-gradient-to-br from-emerald-400/20 to-teal-500/10 blur-2xl"
        animate={
          reduce
            ? undefined
            : { scale: [1, 1.08, 1], opacity: [0.6, 0.85, 0.6] }
        }
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <svg
        viewBox="0 0 400 400"
        className="relative h-full w-full"
        role="img"
        aria-label="Animated orb"
      >
        <defs>
          <radialGradient id="orb-core" cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#10b981" stopOpacity="0.7" />
            <stop offset="75%" stopColor="#0f766e" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#042f2e" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#14b8a6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.2" />
          </linearGradient>

          <filter id="orb-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
        </defs>

        {/* Ring 1 — outermost, slow */}
        <motion.g
          style={{ transformOrigin: "200px 200px" }}
          animate={ring(0, 28).rotate ? { rotate: ring(0, 28).rotate } : undefined}
          transition={ring(0, 28).transition}
        >
          <ellipse
            cx="200"
            cy="200"
            rx="180"
            ry="62"
            fill="none"
            stroke="url(#ring-grad)"
            strokeWidth="1"
            strokeDasharray="2 6"
            opacity="0.55"
          />
        </motion.g>

        {/* Ring 2 — tilted, reverse */}
        <motion.g
          style={{ transformOrigin: "200px 200px", transform: "rotate(35deg)" }}
          animate={ring(0, 22, true).rotate ? { rotate: ring(0, 22, true).rotate } : undefined}
          transition={ring(0, 22, true).transition}
        >
          <ellipse
            cx="200"
            cy="200"
            rx="160"
            ry="48"
            fill="none"
            stroke="url(#ring-grad)"
            strokeWidth="1.2"
            opacity="0.7"
          />
        </motion.g>

        {/* Ring 3 — tighter, faster */}
        <motion.g
          style={{ transformOrigin: "200px 200px", transform: "rotate(-25deg)" }}
          animate={ring(0, 18).rotate ? { rotate: ring(0, 18).rotate } : undefined}
          transition={ring(0, 18).transition}
        >
          <ellipse
            cx="200"
            cy="200"
            rx="140"
            ry="34"
            fill="none"
            stroke="url(#ring-grad)"
            strokeWidth="1.4"
            opacity="0.85"
          />
        </motion.g>

        {/* Core sphere */}
        <circle cx="200" cy="200" r="82" fill="url(#orb-core)" filter="url(#orb-blur)" />
        <circle
          cx="200"
          cy="200"
          r="82"
          fill="none"
          stroke="rgba(167,243,208,0.35)"
          strokeWidth="0.8"
        />

        {/* Inner highlight */}
        <ellipse
          cx="170"
          cy="172"
          rx="34"
          ry="20"
          fill="rgba(255,255,255,0.18)"
          filter="url(#orb-blur)"
        />

        {/* Orbiting particles */}
        {!reduce &&
          [
            { r: 180, ry: 62, dur: 28, size: 4, delay: 0 },
            { r: 160, ry: 48, dur: 22, size: 3.2, delay: 4 },
            { r: 140, ry: 34, dur: 18, size: 2.8, delay: 1.5 },
            { r: 180, ry: 62, dur: 28, size: 2.6, delay: 14 },
          ].map((p, i) => (
            <motion.g
              key={i}
              style={{ transformOrigin: "200px 200px" }}
              animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
              transition={{
                duration: p.dur,
                repeat: Infinity,
                ease: "linear",
                delay: p.delay,
              }}
            >
              <circle
                cx={200 + p.r}
                cy="200"
                r={p.size}
                fill="#6ee7b7"
                opacity="0.95"
              >
                <animate
                  attributeName="opacity"
                  values="0.4;1;0.4"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </circle>
            </motion.g>
          ))}
      </svg>
    </div>
  )
}
