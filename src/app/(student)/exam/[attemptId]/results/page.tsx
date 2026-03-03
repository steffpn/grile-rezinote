import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/get-user"
import { getExamResults } from "@/lib/db/queries/exam"
import { ExamResults } from "@/components/exam/ExamResults"

export default async function ExamResultsPage({
  params,
}: {
  params: Promise<{ attemptId: string }>
}) {
  const { attemptId } = await params
  const user = await getCurrentUser()

  const data = await getExamResults(attemptId, user.id)

  if (!data) {
    redirect("/exam")
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <ExamResults
        attempt={{
          score: data.attempt.score,
          maxScore: data.attempt.maxScore,
          startedAt: data.attempt.startedAt,
          completedAt: data.attempt.completedAt,
          timeLimit: data.attempt.timeLimit,
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
        chapterBreakdown={data.chapterBreakdown}
      />
    </div>
  )
}
