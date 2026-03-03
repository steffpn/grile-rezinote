import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, BookOpen, Shield, Save } from "lucide-react"
import Link from "next/link"
import { getCurrentUser } from "@/lib/auth/get-user"
import { getExamDuration, getInProgressExam } from "@/lib/db/queries/exam"
import { createExamAttempt } from "@/lib/actions/exam"

export default async function ExamStartPage() {
  const user = await getCurrentUser()
  const durationSeconds = await getExamDuration()
  const durationHours = durationSeconds / 3600
  const inProgressExam = await getInProgressExam(user.id)

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Simulare Examen</h1>
          <p className="mt-2 text-muted-foreground">
            Testeaza-te in conditii reale de examen
          </p>
        </div>

        {/* In-progress exam banner */}
        {inProgressExam && (
          <Card className="border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  Ai o simulare in curs
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {inProgressExam.questionCount} intrebari
                </p>
              </div>
              <Button asChild>
                <Link href={`/exam/${inProgressExam.id}`}>
                  Continua simularea
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Exam info card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Format Examen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <BookOpen className="mt-0.5 h-5 w-5 text-teal-600" />
                <div>
                  <p className="font-medium">200 intrebari</p>
                  <p className="text-sm text-muted-foreground">
                    50 CS (complement simplu) + 150 CM (complement multiplu)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border p-3">
                <Clock className="mt-0.5 h-5 w-5 text-teal-600" />
                <div>
                  <p className="font-medium">
                    {durationHours} {durationHours === 1 ? "ora" : "ore"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Timer countdown cu auto-submit la expirare
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border p-3">
                <Shield className="mt-0.5 h-5 w-5 text-teal-600" />
                <div>
                  <p className="font-medium">Rezultate la final</p>
                  <p className="text-sm text-muted-foreground">
                    Fara feedback pe parcurs — ca la examenul real
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border p-3">
                <Save className="mt-0.5 h-5 w-5 text-teal-600" />
                <div>
                  <p className="font-medium">Salvare automata</p>
                  <p className="text-sm text-muted-foreground">
                    Raspunsurile se salveaza automat la fiecare 30 secunde
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 rounded-lg bg-muted/50 p-4">
              <p className="text-sm font-medium">Scoring oficial:</p>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="border-teal-500 text-teal-700 dark:text-teal-300"
                >
                  CS: 4 puncte / intrebare
                </Badge>
                <Badge
                  variant="outline"
                  className="border-purple-500 text-purple-700 dark:text-purple-300"
                >
                  CM: 1 punct / optiune corecta
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Punctaj maxim: 950 (200 CS + 750 CM). Formula oficiala
                romaneasca cu anulare la sub 2 sau peste 4 selectii CM.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Start button */}
        <div className="text-center">
          <form action={async () => {
            "use server"
            await createExamAttempt()
          }}>
            <Button size="lg" className="text-lg px-8 py-6">
              Incepe simularea
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
