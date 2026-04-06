"use client"

import { motion, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"

interface AnimatedBeamProps {
  className?: string
  /** "horizontal" beam connects 3 step icons across the row */
  variant?: "horizontal"
}

/**
 * SVG beam that draws itself on scroll, used to visually connect
 * the 3 steps in HowItWorks. Pure SVG + framer-motion path animation.
 */
export function AnimatedBeam({ className, variant = "horizontal" }: AnimatedBeamProps) {
  const reduce = useReducedMotion()

  if (variant === "horizontal") {
    // Path: gentle wavy line spanning full width
    const d = "M 20 50 Q 200 10, 400 50 T 780 50"

    return (
      <svg
        className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
        viewBox="0 0 800 100"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="beam-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
            <stop offset="20%" stopColor="#10b981" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#2dd4bf" stopOpacity="1" />
            <stop offset="80%" stopColor="#06b6d4" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="beam-gradient-bg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Background dashed track */}
        <path
          d={d}
          stroke="url(#beam-gradient-bg)"
          strokeWidth="1.5"
          strokeDasharray="4 6"
          strokeLinecap="round"
        />

        {/* Animated drawn beam */}
        <motion.path
          d={d}
          stroke="url(#beam-gradient)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.8, ease: [0.21, 0.47, 0.32, 0.98] }}
          style={{ filter: "drop-shadow(0 0 8px rgba(16,185,129,0.4))" }}
        />
      </svg>
    )
  }

  return null
}
