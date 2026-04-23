import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/get-user"
import { getExamResults } from "@/lib/db/queries/exam"
import { ExamResults } from "@/components/exam/ExamResults"
import { PostTestMessage } from "@/components/motivation/post-test-message"

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

  // Compute accuracy metrics for post-test motivation message
  const testTotal = data.questions.length
  let testCorrect = 0
  for (const [, answer] of data.answers) {
    if (answer.isCorrect) testCorrect++
  }
  const testAccuracy =
    testTotal > 0 ? Math.round((testCorrect / testTotal) * 100) : 0

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Suspense fallback={null}>
        <PostTestMessage
          testAccuracy={testAccuracy}
          testCorrect={testCorrect}
          testTotal={testTotal}
        />
      </Suspense>
      <ExamResults
        attempt={{
          id: data.attempt.id,
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
