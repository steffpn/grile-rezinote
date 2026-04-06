"use client"

import { useEffect, useRef, useState } from "react"
import {
  useInView,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "framer-motion"

interface NumberTickerProps {
  value: number
  duration?: number
  className?: string
}

export function NumberTicker({
  value,
  duration = 1.8,
  className,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
  const reduced = useReducedMotion()
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, {
    damping: 30,
    stiffness: 90,
    duration: duration * 1000,
  })
  const [display, setDisplay] = useState("0")

  useEffect(() => {
    if (!inView) return
    if (reduced) {
      setDisplay(value.toLocaleString("ro-RO"))
      return
    }
    motionValue.set(value)
  }, [inView, value, motionValue, reduced])

  useEffect(() => {
    if (reduced) return
    const unsub = spring.on("change", (latest) => {
      setDisplay(Math.round(latest).toLocaleString("ro-RO"))
    })
    return () => unsub()
  }, [spring, reduced])

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  )
}
