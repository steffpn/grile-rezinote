"use client"

import * as React from "react"
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion"
import { cn } from "@/lib/utils"

export interface AnimatedCounterProps {
  /** Final numeric value. */
  value: number
  /** Optional suffix (e.g. "%", " zile"). */
  suffix?: string
  /** Optional prefix. */
  prefix?: string
  /** Decimal places (default 0). */
  decimals?: number
  /** Spring duration in ms (default 1400). */
  duration?: number
  className?: string
}

/**
 * Animated counter that counts up from 0 -> value the first time it
 * enters the viewport. Uses framer-motion useMotionValue + useSpring,
 * so the animation is interpolated frame-by-frame on the GPU thread.
 */
export function AnimatedCounter({
  value,
  suffix,
  prefix,
  decimals = 0,
  duration = 1400,
  className,
}: AnimatedCounterProps) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-40px" })

  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, {
    duration,
    bounce: 0,
  })
  const display = useTransform(spring, (latest) => {
    const fixed = latest.toFixed(decimals)
    return `${prefix ?? ""}${fixed}${suffix ?? ""}`
  })

  React.useEffect(() => {
    if (isInView) {
      motionValue.set(value)
    }
  }, [isInView, motionValue, value])

  return (
    <motion.span ref={ref} className={cn("tabular-nums", className)}>
      {display}
    </motion.span>
  )
}
