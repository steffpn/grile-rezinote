// Dashboard data types for Phase 7: Dashboard & Analytics

export interface DateRange {
  from: Date
  to: Date
}

export type AttemptTypeFilter =
  | "practice_chapter"
  | "practice_mixed"
  | "simulation"
  | "all"

export interface OverallStats {
  totalTests: number
  totalQuestions: number
  correctAnswers: number
  accuracyPct: number
}

export interface ChapterStats {
  chapterId: string
  chapterName: string
  totalQuestions: number
  correctAnswers: number
  totalAnswers: number
  accuracyPct: number
}

export interface DailyTrend {
  date: string
  totalQuestions: number
  correctCount: number
  accuracyPct: number
}

export interface HeatmapCell {
  chapterId: string
  chapterName: string
  date: string
  accuracyPct: number | null
  questionCount: number
}

export interface AnswerHistoryRow {
  answerId: string
  questionText: string
  questionType: "CS" | "CM"
  chapterName: string
  chapterId: string
  selectedOptions: string[]
  correctOptions: string[]
  isCorrect: boolean | null
  score: number | null
  answeredAt: string // ISO string for serialization
  attemptType: string
}

export interface AnswerHistoryResult {
  rows: AnswerHistoryRow[]
  total: number
  page: number
  pageSize: number
}

export interface DashboardOverview {
  stats: OverallStats
  streak: number
}
