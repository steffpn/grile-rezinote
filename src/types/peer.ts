// Peer comparison types for Phase 8: Peer Comparison & Motivation

export interface PeerRankingEntry {
  userId: string // used as avatar seed only — no PII
  bestScore: number
  maxPossible: number
  rank: number
  totalParticipants: number
  percentile: number // e.g., 85.5 means top 14.5%
  isCurrentUser: boolean
}

export interface PeerAggregateStats {
  meanScore: number
  medianScore: number
  totalParticipants: number
  userBestScore: number | null
  userRank: number | null
  userPercentile: number | null
}

export interface ScoreDistributionBin {
  bin: string // e.g., "0-10%", "10-20%", etc.
  binIndex: number // 0-9 for sorting
  count: number
  isUserBin: boolean
}

export interface PeerComparisonData {
  rankings: PeerRankingEntry[]
  stats: PeerAggregateStats
  distribution: ScoreDistributionBin[]
  userOptedIn: boolean
}
