"use client"

import { useState, useEffect, useCallback } from "react"

import { cn } from "@/lib/utils"

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, "0")}:${m
    .toString()
    .padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

interface ExamTimerProps {
  deadline: Date
  onTimeUp: () => void
}

/**
 * ExamTimer — countdown HH:MM:SS în mono mare, central în topbar.
 *
 * Spec § 3.5 Simulator: timer mare mono 36px `--neon` în top center, devine
 * `--warm` la <5 min și `--danger` la <1 min.
 */
export function ExamTimer({ deadline, onTimeUp }: ExamTimerProps) {
  const computeRemaining = useCallback(
    () => Math.max(0, Math.floor((deadline.getTime() - Date.now()) / 1000)),
    [deadline],
  )

  const [remaining, setRemaining] = useState(computeRemaining)

  useEffect(() => {
    const interval = setInterval(() => {
      const left = computeRemaining()
      setRemaining(left)
      if (left === 0) {
        clearInterval(interval)
        onTimeUp()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [computeRemaining, onTimeUp])

  const isLow = remaining < 300 // last 5 minutes
  const isCritical = remaining < 60 // last minute

  return (
    <div
      className={cn(
        "font-mono text-[36px] font-medium leading-none tabular-nums tracking-[-0.03em]",
        isCritical
          ? "animate-pulse text-danger"
          : isLow
            ? "text-warm"
            : "text-neon",
      )}
    >
      {formatTime(remaining)}
    </div>
  )
}
