"use client"

import * as React from "react"
import { motion, useInView } from "framer-motion"
import { cn } from "@/lib/utils"

export interface ProgressRingProps {
  /** 0-100. */
  value: number
  size?: number
  strokeWidth?: number
  className?: string
  /** Optional content rendered in the center. */
  children?: React.ReactNode
  /** Track color override. */
  trackClassName?: string
  /** Stroke color override (CSS color). Defaults to emerald gradient. */
  gradientId?: string
}

/**
 * Circular progress ring that animates from 0 -> value when it enters
 * the viewport. Uses an SVG linearGradient stroke (emerald -> teal).
 */
export function ProgressRing({
  value,
  size = 64,
  strokeWidth = 6,
  className,
  children,
  trackClassName,
  gradientId,
}: ProgressRingProps) {
  const id = React.useId()
  const gid = gradientId ?? `pr-grad-${id}`
  const ref = React.useRef<SVGSVGElement>(null)
  const inView = useInView(ref, { once: true, margin: "-40px" })

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, value))
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={cn("stroke-white/[0.08]", trackClassName)}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          stroke={`url(#${gid})`}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: inView ? offset : circumference }}
          transition={{ duration: 1.2, ease: [0.21, 0.47, 0.32, 0.98] }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  )
}
