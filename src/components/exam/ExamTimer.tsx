"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

interface ExamTimerProps {
  deadline: Date
  onTimeUp: () => void
}

export function ExamTimer({ deadline, onTimeUp }: ExamTimerProps) {
  const computeRemaining = useCallback(
    () => Math.max(0, Math.floor((deadline.getTime() - Date.now()) / 1000)),
    [deadline]
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
        "font-mono text-lg font-bold tabular-nums",
        isCritical
          ? "text-red-700 dark:text-red-400 animate-pulse font-extrabold"
          : isLow
            ? "text-red-600 dark:text-red-400 animate-pulse"
            : "text-foreground"
      )}
    >
      {formatTime(remaining)}
    </div>
  )
}
