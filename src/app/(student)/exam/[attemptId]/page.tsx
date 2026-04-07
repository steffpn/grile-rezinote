import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/get-user"
import { getExamAttemptWithQuestions } from "@/lib/db/queries/exam"
import { submitExam } from "@/lib/actions/exam"
import { ExamContainer } from "@/components/exam/ExamContainer"

/**
 * Seeded PRNG for deterministic option shuffling.
 * Uses a simple mulberry32 algorithm.
 */
function seededRandom(seed: number): () => number {
  let s = seed | 0
  return function () {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Fisher-Yates shuffle with seeded PRNG.
 */
function seededShuffle<T>(array: T[], seed: number): T[] {
  const arr = [...array]
  const random = seededRandom(seed)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Simple hash for combining seed with question ID.
 */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash + char) | 0
  }
  return hash
}

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

  // Shuffle options per question using seed
  const shuffleSeed = data.attempt.shuffleSeed ?? 0
  const questionsWithShuffledOptions = data.questions.map((q) => {
    const questionSeed = (shuffleSeed ^ hashString(q.id)) >>> 0
    const shuffledOptions = seededShuffle(
      q.options.map((o) => ({ label: o.label, text: o.text })),
      questionSeed
    )
    return {
      id: q.id,
      text: q.text,
      type: q.type,
      subchapter: q.subchapter,
      options: shuffledOptions,
    }
  })

  // Build initial answers map for the client
  const initialAnswers = new Map<string, { selectedOptions: string[] }>()
  for (const [qId, ans] of data.answers) {
    initialAnswers.set(qId, { selectedOptions: ans.selectedOptions })
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-4">
      <ExamContainer
        attemptId={attemptId}
        questions={questionsWithShuffledOptions}
        deadline={data.deadline}
        initialAnswers={initialAnswers}
      />
    </div>
  )
}
