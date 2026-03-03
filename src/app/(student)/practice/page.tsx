import { getCurrentUser } from "@/lib/auth/get-user"
import { getChaptersForPractice, getInProgressAttempts } from "@/lib/db/queries/practice"
import { PracticeConfigForm } from "@/components/practice/PracticeConfigForm"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function PracticePage() {
  const user = await getCurrentUser()

  const [chapters, inProgressAttempts] = await Promise.all([
    getChaptersForPractice(),
    getInProgressAttempts(user.id),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Teste Practice</h1>
        <p className="mt-1 text-muted-foreground">
          Alege capitolele si configureaza testul
        </p>
      </div>

      {/* In-progress attempts */}
      {inProgressAttempts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Teste in progres</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {inProgressAttempts.map((attempt) => (
              <Card key={attempt.id}>
                <CardContent className="flex items-center justify-between pt-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {attempt.type === "practice_chapter"
                          ? "Capitol"
                          : "Amestecat"}
                      </Badge>
                      <Badge variant="secondary">
                        {attempt.feedbackMode === "immediate"
                          ? "Imediat"
                          : "La final"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {attempt.answeredCount}/{attempt.totalQuestions} intrebari
                      raspunse
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Inceput:{" "}
                      {new Date(attempt.startedAt).toLocaleDateString("ro-RO")}
                    </p>
                  </div>
                  <Button asChild size="sm">
                    <Link href={`/practice/${attempt.id}`}>Continua</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* New test configuration */}
      <PracticeConfigForm chapters={chapters} />
    </div>
  )
}
