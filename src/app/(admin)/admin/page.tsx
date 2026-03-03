import { db } from "@/lib/db"
import { chapters, questions } from "@/lib/db/schema"
import { isNull, eq, count, and } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, HelpCircle, CheckCircle2, ListChecks } from "lucide-react"

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

const statCards = [
  { key: "chapters" as const, label: "Capitole", icon: BookOpen },
  {
    key: "totalQuestions" as const,
    label: "Total Intrebari",
    icon: HelpCircle,
  },
  { key: "csQuestions" as const, label: "Intrebari CS", icon: CheckCircle2 },
  { key: "cmQuestions" as const, label: "Intrebari CM", icon: ListChecks },
]

export default async function AdminDashboardPage() {
  const stats = await getAdminStats()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Panou Admin</h1>
      <p className="mt-1 text-muted-foreground">
        Gestioneaza continutul platformei.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.key}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats[card.key]}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
