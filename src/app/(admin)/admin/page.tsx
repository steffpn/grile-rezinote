import { and, count, eq, isNull } from "drizzle-orm"
import { BookOpen, CheckCircle2, HelpCircle, ListChecks, type LucideIcon } from "lucide-react"

import { db } from "@/lib/db"
import { chapters, questions } from "@/lib/db/schema"
import { MonoLabel, SectionTag } from "@/components/branded"

async function getAdminStats() {
  const [chapterCount] = await db
    .select({ value: count() })
    .from(chapters)
    .where(isNull(chapters.archivedAt))

  const [totalQuestions] = await db
    .select({ value: count() })
    .from(questions)
    .where(isNull(questions.archivedAt))

  const [csQuestions] = await db
    .select({ value: count() })
    .from(questions)
    .where(and(isNull(questions.archivedAt), eq(questions.type, "CS")))

  const [cmQuestions] = await db
    .select({ value: count() })
    .from(questions)
    .where(and(isNull(questions.archivedAt), eq(questions.type, "CM")))

  return {
    chapters: chapterCount?.value ?? 0,
    totalQuestions: totalQuestions?.value ?? 0,
    csQuestions: csQuestions?.value ?? 0,
    cmQuestions: cmQuestions?.value ?? 0,
  }
}

const statCards: {
  key: "chapters" | "totalQuestions" | "csQuestions" | "cmQuestions"
  label: string
  sub: string
  icon: LucideIcon
  tone: "default" | "accent" | "warm"
}[] = [
  {
    key: "chapters",
    label: "Capitole",
    sub: "active · publice",
    icon: BookOpen,
    tone: "accent",
  },
  {
    key: "totalQuestions",
    label: "Total întrebări",
    sub: "active",
    icon: HelpCircle,
    tone: "default",
  },
  {
    key: "csQuestions",
    label: "Complement simplu",
    sub: "1 răspuns corect",
    icon: CheckCircle2,
    tone: "accent",
  },
  {
    key: "cmQuestions",
    label: "Complement multiplu",
    sub: "2-4 răspunsuri",
    icon: ListChecks,
    tone: "warm",
  },
]

export default async function AdminDashboardPage() {
  const stats = await getAdminStats()

  return (
    <div className="space-y-8">
      <div>
        <SectionTag>Admin · sumar</SectionTag>
        <h1 className="mt-3 text-[34px] font-bold leading-[1.05] tracking-[-0.03em] text-fg">
          Conținutul platformei.
        </h1>
        <p className="mt-3 max-w-[520px] text-[15px] leading-[1.55] text-fg-dim">
          Capitole, întrebări, praguri de admitere — tot ce alimentează
          platforma trece prin pagina aceasta.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.key}
              className="rounded-[12px] border border-line bg-bg-2 p-5"
            >
              <div className="flex items-center justify-between">
                <MonoLabel size="cell">{card.label}</MonoLabel>
                <span
                  className={
                    card.tone === "accent"
                      ? "text-neon"
                      : card.tone === "warm"
                        ? "text-warm"
                        : "text-fg-mute"
                  }
                >
                  <Icon className="size-4" />
                </span>
              </div>
              <div className="mt-3 font-mono text-[36px] font-semibold leading-none tracking-[-0.04em] text-fg">
                {stats[card.key].toLocaleString("ro-RO")}
              </div>
              <div className="mt-2 font-mono text-[10.5px] tracking-mono-tight text-fg-mute">
                {card.sub}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
