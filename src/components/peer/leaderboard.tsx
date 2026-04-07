"use client"

import { useEffect, useRef } from "react"
import { PeerAvatar } from "./avatar"
import type { PeerRankingEntry } from "@/types/peer"

interface LeaderboardProps {
  rankings: PeerRankingEntry[]
}

export function Leaderboard({ rankings }: LeaderboardProps) {
  const currentUserRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Auto-scroll to current user's position after mount
    if (currentUserRef.current) {
      currentUserRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
    }
  }, [])

  if (rankings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Niciun participant inca. Completeaza o simulare si activeaza
          comparatia!
        </p>
      </div>
    )
  }

  return (
    <div className="max-h-[500px] overflow-auto">
      <div className="space-y-1 min-w-[20rem]">
        {/* Header */}
        <div className="sticky top-0 z-10 grid grid-cols-[2.25rem_2rem_1fr_3.5rem_3rem] sm:grid-cols-[3rem_2.5rem_1fr_5rem_5rem] items-center gap-2 border-b bg-background px-3 py-2 text-xs font-medium text-muted-foreground">
          <span>#</span>
          <span></span>
          <span>Participant</span>
          <span className="text-right">Scor</span>
          <span className="text-right">Top</span>
        </div>

        {/* Rows */}
        {rankings.map((entry) => (
          <div
            key={entry.userId}
            ref={entry.isCurrentUser ? currentUserRef : undefined}
            className={`grid grid-cols-[2.25rem_2rem_1fr_3.5rem_3rem] sm:grid-cols-[3rem_2.5rem_1fr_5rem_5rem] items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
              entry.isCurrentUser
                ? "border-l-2 border-primary bg-primary/10 font-medium"
                : "hover:bg-muted/50"
            }`}
          >
            {/* Rank */}
            <span
              className={`font-mono text-sm ${
                entry.rank <= 3 ? "font-bold" : ""
              }`}
            >
              {entry.rank === 1 && "🥇"}
              {entry.rank === 2 && "🥈"}
              {entry.rank === 3 && "🥉"}
              {entry.rank > 3 && entry.rank}
            </span>

            {/* Avatar */}
            <PeerAvatar seed={entry.userId} size={28} />

            {/* Label */}
            <span className="truncate">
              {entry.isCurrentUser ? (
                <span className="text-primary">Tu</span>
              ) : (
                <span className="text-muted-foreground">
                  Participant #{entry.rank}
                </span>
              )}
            </span>

            {/* Score */}
            <span className="text-right font-mono text-sm">
              {entry.bestScore}
            </span>

            {/* Percentile */}
            <span className="text-right text-xs text-muted-foreground">
              {entry.percentile.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
