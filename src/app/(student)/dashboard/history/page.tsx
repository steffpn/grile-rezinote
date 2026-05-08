import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, History } from "lucide-react"

import { Button } from "@/components/ui/button"
import { AnswerHistoryTable } from "@/components/dashboard/answer-history-table"
import { MonoLabel, SectionTag } from "@/components/branded"
import {
  fetchAnswerHistory,
  fetchChapters,
} from "@/lib/actions/dashboard"

export const metadata: Metadata = {
  title: "Istoric răspunsuri | Dashboard | grile-ReziNOTE",
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const page =
    typeof params.page === "string" ? parseInt(params.page, 10) || 1 : 1
  const search = typeof params.q === "string" ? params.q : undefined
  const chapterId =
    typeof params.chapter === "string" && params.chapter !== "all"
      ? params.chapter
      : undefined
  const correct =
    typeof params.correct === "string" && params.correct !== "all"
      ? params.correct
      : undefined
  const typeFilter = typeof params.type === "string" ? params.type : undefined

  const [historyData, chapters] = await Promise.all([
    fetchAnswerHistory(
      page,
      20,
      search,
      chapterId,
      correct,
      undefined,
      undefined,
      typeFilter,
    ),
    fetchChapters(),
  ])

  const hasAnyData =
    historyData.total > 0 || search || chapterId || correct

  return (
    <div className="space-y-8">
      <div>
        <SectionTag>Răspunsuri</SectionTag>
        <h1 className="mt-3 text-[34px] font-bold leading-[1.05] tracking-[-0.03em] text-fg">
          Fiecare grilă, în context.
        </h1>
        <p className="mt-3 max-w-[520px] text-[15px] leading-[1.55] text-fg-dim">
          Filtrează pe capitol, pe rezultat sau pe text. Click pentru a vedea
          opțiunea corectă și sursa bibliografică.
        </p>
      </div>

      {!hasAnyData ? (
        <div className="rounded-[14px] border border-dashed border-line-2 bg-bg-2/40 p-12 text-center">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-neon/12 text-neon">
            <History className="size-6" />
          </div>
          <h2 className="text-[18px] font-semibold tracking-[-0.015em] text-fg">
            Niciun răspuns încă.
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-[14px] leading-[1.55] text-fg-dim">
            Începe un test de practică pentru a-ți construi istoricul.
          </p>
          <Button asChild className="mt-6">
            <Link href="/practice">
              Începe un test
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <Suspense>
          <AnswerHistoryTable data={historyData} chapters={chapters} />
        </Suspense>
      )}

      {historyData.total > 0 && (
        <p className="text-center">
          <MonoLabel size="body" tone="dim">
            Total · {historyData.total} răspunsuri
          </MonoLabel>
        </p>
      )}
    </div>
  )
}
