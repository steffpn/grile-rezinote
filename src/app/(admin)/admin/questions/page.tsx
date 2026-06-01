import {
  getQuestions,
  getChaptersForSelect,
  getDistinctSubchapters,
  getDistinctSourceBooks,
  type QuestionSortBy,
  type SortDir,
} from "@/lib/actions/questions"
import { QuestionTable } from "@/components/admin/question-table"
import { SectionTag } from "@/components/branded"

interface Props {
  searchParams: Promise<{
    chapterId?: string
    subchapter?: string
    type?: string
    sourceBook?: string
    search?: string
    status?: string
    reviewed?: string
    sortBy?: string
    sortDir?: string
    page?: string
    pageSize?: string
  }>
}

const VALID_SORT: QuestionSortBy[] = [
  "createdAt",
  "updatedAt",
  "chapter",
  "subchapter",
  "type",
  "sourceBook",
  "text",
]

export default async function QuestionsPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Math.max(parseInt(params.page ?? "1", 10) || 1, 1)
  const pageSize = Math.min(
    Math.max(parseInt(params.pageSize ?? "20", 10) || 20, 5),
    200,
  )

  const sortBy = (VALID_SORT as readonly string[]).includes(
    params.sortBy ?? "",
  )
    ? (params.sortBy as QuestionSortBy)
    : ("createdAt" as QuestionSortBy)
  const sortDir: SortDir = params.sortDir === "asc" ? "asc" : "desc"
  const statusParam: "active" | "archived" | "all" =
    params.status === "archived" || params.status === "all"
      ? params.status
      : "active"
  const reviewedParam: "yes" | "no" | undefined =
    params.reviewed === "yes" || params.reviewed === "no"
      ? params.reviewed
      : undefined

  const filters = {
    chapterId: params.chapterId,
    subchapter: params.subchapter,
    type: params.type as "CS" | "CM" | undefined,
    sourceBook: params.sourceBook,
    search: params.search,
    status: statusParam,
    reviewed: reviewedParam,
    sortBy,
    sortDir,
    page,
    pageSize,
  }

  const [data, chapters, subchapters, sourceBooks] = await Promise.all([
    getQuestions(filters),
    getChaptersForSelect(),
    getDistinctSubchapters(params.chapterId),
    getDistinctSourceBooks(),
  ])

  return (
    <div className="space-y-8">
      <div>
        <SectionTag>Întrebări</SectionTag>
        <h1 className="mt-3 text-[34px] font-bold leading-[1.05] tracking-[-0.03em] text-fg">
          Banca de întrebări.
        </h1>
        <p className="mt-3 max-w-[560px] text-[15px] leading-[1.55] text-fg-dim">
          Caută, filtrează, sortează, selectează în lot. Click pe o linie ca să
          vezi opțiunile fără să intri în editor.
        </p>
      </div>

      <QuestionTable
        questions={data.questions}
        total={data.total}
        page={data.page}
        pageSize={data.pageSize}
        chapters={chapters}
        subchapters={subchapters}
        sourceBooks={sourceBooks}
        filters={{
          chapterId: params.chapterId,
          subchapter: params.subchapter,
          type: params.type,
          sourceBook: params.sourceBook,
          search: params.search,
          status: statusParam,
          reviewed: reviewedParam,
          sortBy,
          sortDir,
        }}
      />
    </div>
  )
}
