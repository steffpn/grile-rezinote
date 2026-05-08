/**
 * Dev preview: ExamResults cu mock complet (200 grile, scor 847/950, 6 UMF
 * admitere mock — visual conform spec § 3.6).
 */
import {
  AppShell,
  type NavLink,
} from "@/components/shared/app-shell"
import { ExamResults } from "@/components/exam/ExamResults"
import { AdmissionGrid } from "@/components/exam/AdmissionGrid"
import { SectionTag } from "@/components/branded"

const studentLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", requiredTier: "PRO" },
  { href: "/practice", label: "Teste practice", requiredTier: "FREE" },
  { href: "/exam", label: "Simulare", requiredTier: "PRO" },
  { href: "/practice/mistakes", label: "Greșelile mele", requiredTier: "PRO" },
  { href: "/admission", label: "Admitere", requiredTier: "PREMIUM" },
  { href: "/subscription", label: "Abonament", requiredTier: "FREE" },
]

// Mock 200 questions cu un pattern realist 50/150 CS/CM
function buildMockQuestions(): {
  id: string
  text: string
  type: "CS" | "CM"
  sourceBook: string | null
  sourcePage: string | null
  options: { label: string; text: string }[]
}[] {
  return Array.from({ length: 200 }, (_, i) => ({
    id: `q-${i + 1}`,
    text:
      i === 86
        ? "Care dintre următoarele caracteristici este specifică unei pulpite acute purulente focale?"
        : `Întrebarea de demonstrație ${i + 1} — text reprezentativ.`,
    type: i < 50 ? ("CS" as const) : ("CM" as const),
    sourceBook: "Iliescu, Endodonție",
    sourcePage: "234",
    options: ["A", "B", "C", "D", "E"].map((label) => ({
      label,
      text: `Opțiunea ${label} — descriere ipotetică ce poate fi corectă sau greșită.`,
    })),
  }))
}

const mockQuestions = buildMockQuestions()

// 87% corecte → ~174 corecte din 200
const mockAnswers = new Map<
  string,
  { selectedOptions: string[]; isCorrect: boolean | null; score: number | null }
>()
const mockCorrectOptions = new Map<string, string[]>()

mockQuestions.forEach((q, i) => {
  const correctSet = q.type === "CS" ? ["B"] : ["A", "C"]
  mockCorrectOptions.set(q.id, correctSet)

  // 87% rate cu pattern aleatoriu deterministic
  const isCorrect = (i * 7 + 3) % 10 < 9 // ~87% rate aproximativ
  const score = isCorrect ? (q.type === "CS" ? 4 : 3) : 0
  mockAnswers.set(q.id, {
    selectedOptions: isCorrect
      ? correctSet
      : q.type === "CS"
        ? ["A"]
        : ["A", "D"],
    isCorrect: i % 23 === 0 ? null : isCorrect,
    score: i % 23 === 0 ? null : score,
  })
})

const mockChapterBreakdown = [
  {
    chapterId: "1",
    chapterName: "Endodonție",
    totalQuestions: 40,
    correctCount: 34,
    score: 102,
    maxScore: 120,
    percentage: 85,
  },
  {
    chapterId: "2",
    chapterName: "Pedodonție",
    totalQuestions: 35,
    correctCount: 23,
    score: 65,
    maxScore: 105,
    percentage: 66,
  },
  {
    chapterId: "3",
    chapterName: "Ortodonție",
    totalQuestions: 30,
    correctCount: 18,
    score: 50,
    maxScore: 90,
    percentage: 60,
  },
  {
    chapterId: "4",
    chapterName: "Chirurgie OMF",
    totalQuestions: 35,
    correctCount: 28,
    score: 80,
    maxScore: 105,
    percentage: 80,
  },
  {
    chapterId: "5",
    chapterName: "Protetică dentară",
    totalQuestions: 30,
    correctCount: 21,
    score: 60,
    maxScore: 90,
    percentage: 70,
  },
  {
    chapterId: "6",
    chapterName: "Parodontologie",
    totalQuestions: 30,
    correctCount: 26,
    score: 75,
    maxScore: 90,
    percentage: 87,
  },
]

const mockAdmissionEntries = [
  {
    umf: "UMF Carol Davila",
    specialty: "Endodonție",
    threshold: 821,
    seats: 12,
    margin: 26,
  },
  {
    umf: "UMF Iuliu Hațieganu",
    specialty: "Pedodonție",
    threshold: 798,
    seats: 8,
    margin: 49,
  },
  {
    umf: "UMF Gr. T. Popa",
    specialty: "Ortodonție",
    threshold: 834,
    seats: 6,
    margin: 13,
  },
  {
    umf: "UMF Carol Davila",
    specialty: "Chirurgie OMF",
    threshold: 891,
    seats: 4,
    margin: -44,
  },
  {
    umf: "UMF Vasile Goldiș",
    specialty: "Protetică",
    threshold: 740,
    seats: 10,
    margin: 107,
  },
  {
    umf: "UMF Tg. Mureș",
    specialty: "Parodontologie",
    threshold: 776,
    seats: 7,
    margin: 71,
  },
]

export default function ExamResultsPreview() {
  // Override admitere section pentru preview cu date reale
  const startedAt = new Date("2025-10-21T13:52:00")
  const completedAt = new Date("2025-10-21T16:23:00")

  return (
    <AppShell
      links={studentLinks}
      userEmail="ana.popescu@yahoo.com"
      showMobileTabBar
      context="student"
    >
      <ExamResults
        attempt={{
          id: "demo-attempt",
          score: 847,
          maxScore: 950,
          startedAt,
          completedAt,
          timeLimit: 10800, // 3h
        }}
        questions={mockQuestions}
        answers={mockAnswers}
        correctOptions={mockCorrectOptions}
        chapterBreakdown={mockChapterBreakdown}
      />

      {/* Admiterea (PREVIEW MOCK — în producție gating PREMIUM) */}
      <section className="mt-6">
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <div>
            <SectionTag>Admiterea ta · preview cu date 2025</SectionTag>
            <p className="mt-1.5 text-[14px] text-fg-dim">
              Praguri reale 2025 din MS · 6 UMF-uri din România.
            </p>
          </div>
        </div>
        <AdmissionGrid entries={mockAdmissionEntries} year="'25" />
      </section>
    </AppShell>
  )
}
