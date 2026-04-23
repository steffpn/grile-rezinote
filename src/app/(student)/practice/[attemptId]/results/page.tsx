import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/get-user"
import { getAttemptResults } from "@/lib/db/queries/practice"
import { DeferredResults } from "@/components/practice/DeferredResults"

interface ResultsPageProps {
  params: Promise<{ attemptId: string }>
}

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { attemptId } = await params
  const user = await getCurrentUser()

  const data = await getAttemptResults(attemptId, user.id)

  if (!data) {
    redirect("/practice")
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Rezultate Test</h1>
      <DeferredResults
        attempt={{
          id: data.attempt.id,
          score: data.attempt.score,
          maxScore: data.attempt.maxScore,
          completedAt: data.attempt.completedAt,
        }}
        questions={data.questions.map((q) => ({
          id: q.id,
          text: q.text,
          type: q.type,
          sourceBook: q.sourceBook,
          sourcePage: q.sourcePage,
          options: q.options.map((o) => ({ label: o.label, text: o.text })),
        }))}
        answers={data.answers}
        correctOptions={data.correctOptions}
      />
    </div>
  )
}
