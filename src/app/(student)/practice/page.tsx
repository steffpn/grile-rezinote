import { getCurrentUser } from "@/lib/auth/get-user"
import { getChaptersForPractice, getInProgressAttempts } from "@/lib/db/queries/practice"
import { getWrongAnswerStats } from "@/lib/db/queries/wrong-answers"
import { PracticeConfigForm } from "@/components/practice/PracticeConfigForm"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Play } from "lucide-react"

export default async function PracticePage() {
  const user = await getCurrentUser()

  const [chapters, inProgressAttempts, wrongStats] = await Promise.all([
    getChaptersForPractice(),
    getInProgressAttempts(user.id),
    getWrongAnswerStats(user.id),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Teste Practice</h1>
        <p className="mt-1 text-muted-foreground">
          Alege capitolele si configureaza testul
        </p>
      </div>

      {/* In-progress attempts */}
      {inProgressAttempts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Teste in progres</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {inProgressAttempts.map((attempt) => (
              <Card key={attempt.id} className="group border-border/50 transition-all duration-300 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5">
                <CardContent className="flex items-center justify-between pt-6">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="rounded-full text-[11px]">
                        {attempt.type === "practice_chapter"
                          ? "Capitol"
                          : "Amestecat"}
                      </Badge>
                      <Badge variant="secondary" className="rounded-full text-[11px]">
                        {attempt.feedbackMode === "immediate"
                          ? "Imediat"
                          : "La final"}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium">
                      {attempt.answeredCount}/{attempt.totalQuestions} intrebari
                    </p>
                    <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full gradient-primary transition-all"
                        style={{ width: `${(attempt.answeredCount / attempt.totalQuestions) * 100}%` }}
                      />
                    </div>
                  </div>
                  <Button asChild size="sm" className="rounded-full gap-1">
                    <Link href={`/practice/${attempt.id}`}>
                      Continua
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* New test configuration */}
      <PracticeConfigForm
        chapters={chapters}
        wrongAnswerCount={wrongStats.totalUnmastered}
      />
    </div>
  )
}
