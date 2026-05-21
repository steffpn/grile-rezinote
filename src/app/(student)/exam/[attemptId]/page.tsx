import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/get-user"
import { getExamAttemptWithQuestions } from "@/lib/db/queries/exam"
import { submitExam } from "@/lib/actions/exam"
import { ExamContainer } from "@/components/exam/ExamContainer"

export default async function ExamAttemptPage({
  params,
}: {
  params: Promise<{ attemptId: string }>
}) {
  const { attemptId } = await params
  const user = await getCurrentUser()

  const data = await getExamAttemptWithQuestions(attemptId, user.id)

  if (!data) {
    redirect("/exam")
  }

  // If completed, go to results
  if (data.attempt.status === "completed") {
    redirect(`/exam/${attemptId}/results`)
  }

  // Check if deadline + grace has passed
  const graceDeadline = new Date(data.deadline.getTime() + 60_000)
  if (new Date() > graceDeadline) {
    // Auto-submit and redirect
    await submitExam(attemptId)
    redirect(`/exam/${attemptId}/results`)
  }

  // Options come pre-sorted A-E from the query; defensive client-side sort below
  const examQuestions = data.questions.map((q) => ({
    id: q.id,
    text: q.text,
    type: q.type,
    chapterName: q.chapterName,
    subchapter: q.subchapter,
    options: [...q.options]
      .sort((a, b) => a.label.localeCompare(b.label))
      .map((o) => ({ label: o.label, text: o.text })),
  }))

  // Build initial answers map for the client
  const initialAnswers = new Map<string, { selectedOptions: string[] }>()
  for (const [qId, ans] of data.answers) {
    initialAnswers.set(qId, { selectedOptions: ans.selectedOptions })
  }

  return (
    <ExamContainer
      attemptId={attemptId}
      questions={examQuestions}
      deadline={data.deadline}
      initialAnswers={initialAnswers}
    />
  )
}
