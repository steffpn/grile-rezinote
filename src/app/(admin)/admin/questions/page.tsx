import { getQuestions, getChaptersForSelect } from "@/lib/actions/questions"
import { QuestionTable } from "@/components/admin/question-table"
import { SectionTag } from "@/components/branded"

interface Props {
  searchParams: Promise<{
    chapterId?: string
    type?: string
    search?: string
    page?: string
  }>
}

export default async function QuestionsPage({ searchParams }: Props) {
  const params = await searchParams
  const page = parseInt(params.page ?? "1", 10)
  const filters = {
    chapterId: params.chapterId,
    type: params.type as "CS" | "CM" | undefined,
    search: params.search,
    page,
  }

  const [data, chapters] = await Promise.all([
    getQuestions(filters),
    getChaptersForSelect(),
  ])

  return (
    <div className="space-y-8">
      <div>
        <SectionTag>Întrebări</SectionTag>
        <h1 className="mt-3 text-[34px] font-bold leading-[1.05] tracking-[-0.03em] text-fg">
          Banca de întrebări.
        </h1>
        <p className="mt-3 max-w-[520px] text-[15px] leading-[1.55] text-fg-dim">
          Caută, filtrează, editează. Sursele bibliografice sunt sub fiecare
          întrebare.
        </p>
      </div>

      <QuestionTable
        questions={data.questions}
        total={data.total}
        page={data.page}
        pageSize={data.pageSize}
        chapters={chapters}
        filters={{
          chapterId: params.chapterId,
          type: params.type,
          search: params.search,
        }}
      />
    </div>
  )
}
