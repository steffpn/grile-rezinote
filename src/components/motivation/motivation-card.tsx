import {
  Trophy,
  Flame,
  Star,
  TrendingUp,
  Award,
  BookOpen,
  Target,
  Lightbulb,
  RefreshCw,
  Zap,
  Info,
  BarChart3,
  PieChart,
  GraduationCap,
  Sparkles,
  Brain,
  Clock,
  BookMarked,
  PartyPopper,
  Medal,
  Crown,
  Calendar,
  CalendarCheck,
  Rocket,
  Gem,
  ThumbsUp,
  RotateCcw,
  Scale,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { fetchDailyMotivation } from "@/lib/actions/motivation"
import type { MessageType } from "@/lib/motivation/types"

const iconMap: Record<string, LucideIcon> = {
  Trophy,
  Flame,
  Star,
  TrendingUp,
  Award,
  BookOpen,
  Target,
  Lightbulb,
  RefreshCw,
  Zap,
  Info,
  BarChart3,
  PieChart,
  GraduationCap,
  Sparkles,
  Brain,
  Clock,
  BookMarked,
  PartyPopper,
  Medal,
  Crown,
  Calendar,
  CalendarCheck,
  Rocket,
  Gem,
  ThumbsUp,
  RotateCcw,
  Scale,
}

const typeLabels: Record<MessageType, string> = {
  encouragement: "Încurajare",
  guidance: "Sfat",
  didYouKnow: "Știai că?",
  milestone: "Reper",
}

/**
 * Tone-uri vizuale per tip de mesaj — toate folosind paleta brand
 * (`--neon` pentru încurajări, `--warm` pentru sfaturi, etc.).
 */
const typeAccent: Record<MessageType, { bg: string; text: string; ring: string }> = {
  encouragement: {
    bg: "bg-neon/8",
    text: "text-neon",
    ring: "border-neon/25",
  },
  guidance: {
    bg: "bg-warm/8",
    text: "text-warm",
    ring: "border-warm/25",
  },
  didYouKnow: {
    bg: "bg-[oklch(0.18_0.04_200)]",
    text: "text-[oklch(0.78_0.14_200)]",
    ring: "border-[oklch(0.40_0.10_200)]/40",
  },
  milestone: {
    bg: "bg-[oklch(0.20_0.06_280)]",
    text: "text-[oklch(0.78_0.14_280)]",
    ring: "border-[oklch(0.42_0.12_280)]/40",
  },
}

/**
 * Server Component that fetches and displays a daily motivational message.
 * Renders on the dashboard overview page.
 */
export async function MotivationCard() {
  const message = await fetchDailyMotivation()

  if (!message) return null

  const Icon = iconMap[message.icon] ?? Sparkles
  const accent = typeAccent[message.type]

  return (
    <div
      className={`flex items-center gap-4 rounded-[14px] border bg-bg-2 px-4 py-3.5 ${accent.ring}`}
    >
      <div
        className={`grid size-10 shrink-0 place-items-center rounded-full ${accent.bg} ${accent.text}`}
      >
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] leading-[1.55] text-fg-dim">
          <span className="text-fg">{message.text}</span>
        </p>
      </div>
      <span
        className={`shrink-0 rounded-[3px] px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-mono-tight ${accent.bg} ${accent.text}`}
      >
        {typeLabels[message.type]}
      </span>
    </div>
  )
}
