import { Card, CardContent } from "@/components/ui/card"
import { fetchDailyMotivation } from "@/lib/actions/motivation"
import type { MessageType } from "@/lib/motivation/types"
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
  encouragement: "Incurajare",
  guidance: "Sfat",
  didYouKnow: "Stiai ca?",
  milestone: "Reper",
}

const typeGradients: Record<MessageType, string> = {
  encouragement:
    "bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-950/20 dark:to-transparent border-emerald-200/50 dark:border-emerald-800/30",
  guidance:
    "bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-950/20 dark:to-transparent border-amber-200/50 dark:border-amber-800/30",
  didYouKnow:
    "bg-gradient-to-r from-primary-50 to-transparent dark:from-primary-950/20 dark:to-transparent border-primary-200/50 dark:border-primary-800/30",
  milestone:
    "bg-gradient-to-r from-violet-50 to-transparent dark:from-violet-950/20 dark:to-transparent border-violet-200/50 dark:border-violet-800/30",
}

/**
 * Server Component that fetches and displays a daily motivational message.
 * Renders on the dashboard overview page.
 */
export async function MotivationCard() {
  const message = await fetchDailyMotivation()

  if (!message) return null

  const Icon = iconMap[message.icon] ?? Sparkles

  return (
    <Card className={`overflow-hidden ${typeGradients[message.type]}`}>
      <CardContent className="flex items-center gap-4 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background/80">
          <Icon className="h-5 w-5 text-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-relaxed">{message.text}</p>
        </div>
        <span className="shrink-0 rounded-full bg-background/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {typeLabels[message.type]}
        </span>
      </CardContent>
    </Card>
  )
}
