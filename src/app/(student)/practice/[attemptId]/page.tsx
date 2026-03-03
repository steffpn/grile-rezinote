import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/get-user"
import { getAttemptWithQuestions } from "@/lib/db/queries/practice"
import { QuizContainer } from "@/components/practice/QuizContainer"

interface QuizPageProps {
  params: Promise<{ attemptId: string }>
}

export default async function QuizPage({ params }: QuizPageProps) {
  const { attemptId } = await params
  const user = await getCurrentUser()

  const data = await getAttemptWithQuestions(attemptId, user.id)

  if (!data) {
    redirect("/practice")
  }

  if (data.attempt.status === "completed") {
    redirect(`/practice/${attemptId}/results`)
  }

  return (
    <div>
      <QuizContainer
        attemptId={attemptId}
        questions={data.questions.map((q) => ({
          id: q.id,
          text: q.text,
          type: q.type,
          sourceBook: q.sourceBook,
          sourcePage: q.sourcePage,
          options: q.options.map((o) => ({ label: o.label, text: o.text })),
        }))}
        feedbackMode={(data.attempt.feedbackMode as "immediate" | "deferred") ?? "deferred"}
        initialAnswers={data.answers}
      />
    </div>
  )
}
