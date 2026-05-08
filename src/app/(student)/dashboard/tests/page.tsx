import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, ClipboardList } from "lucide-react"

import { Button } from "@/components/ui/button"
import { TestHistoryTable } from "@/components/dashboard/test-history-table"
import { MonoLabel, SectionTag } from "@/components/branded"
import { fetchTestHistory } from "@/lib/actions/dashboard"

export const metadata: Metadata = {
  title: "Istoric teste | Dashboard | grile-ReziNOTE",
}

export default async function TestsHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const page =
    typeof params.page === "string" ? parseInt(params.page, 10) || 1 : 1
  const typeFilter = typeof params.type === "string" ? params.type : undefined

  const data = await fetchTestHistory(page, 20, typeFilter)
  const hasAnyData = data.total > 0 || typeFilter

  return (
    <div className="space-y-8">
      <div>
        <SectionTag>Istoric teste</SectionTag>
        <h1 className="mt-3 text-[34px] font-bold leading-[1.05] tracking-[-0.03em] text-fg">
          Toate testele tale.
        </h1>
        <p className="mt-3 max-w-[520px] text-[15px] leading-[1.55] text-fg-dim">
          Revezi practica și simulările anterioare. Click pentru detalii pe
          fiecare.
        </p>
      </div>

      {!hasAnyData ? (
        <div className="rounded-[14px] border border-dashed border-line-2 bg-bg-2/40 p-12 text-center">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-neon/12 text-neon">
            <ClipboardList className="size-6" />
          </div>
          <h2 className="text-[18px] font-semibold tracking-[-0.015em] text-fg">
            Niciun test încă.
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-[14px] leading-[1.55] text-fg-dim">
            Începe un test de practică sau o simulare pentru a-ți construi
            istoricul.
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
          <TestHistoryTable data={data} />
        </Suspense>
      )}

      {data.total > 0 && (
        <p className="text-center font-mono text-[11.5px] uppercase tracking-mono text-fg-mute">
          <MonoLabel size="body" tone="dim">
            Total · {data.total} teste completate
          </MonoLabel>
        </p>
      )}
    </div>
  )
}
