import { getChaptersForSelect } from "@/lib/actions/questions"
import { ImportUpload } from "@/components/admin/import-upload"
import { ExportControls } from "@/components/admin/export-controls"
import { MonoLabel, SectionTag } from "@/components/branded"

export default async function ImportExportPage() {
  const chapters = await getChaptersForSelect()

  return (
    <div className="space-y-8">
      <div>
        <SectionTag>Import / Export</SectionTag>
        <h1 className="mt-3 text-[34px] font-bold leading-[1.05] tracking-[-0.03em] text-fg">
          Bulk operations.
        </h1>
        <p className="mt-3 max-w-[520px] text-[15px] leading-[1.55] text-fg-dim">
          Adaugă întrebări în lot din CSV/Excel sau exportă banca pentru
          backup.
        </p>
      </div>

      <section className="rounded-[14px] border border-line bg-bg-2 p-5 sm:p-6">
        <MonoLabel size="cell">01 / Import</MonoLabel>
        <h2 className="mt-1.5 text-[18px] font-semibold tracking-[-0.015em] text-fg">
          Adaugă întrebări în lot
        </h2>
        <div className="mt-5">
          <ImportUpload />
        </div>
      </section>

      <section className="rounded-[14px] border border-line bg-bg-2 p-5 sm:p-6">
        <MonoLabel size="cell">02 / Export</MonoLabel>
        <h2 className="mt-1.5 text-[18px] font-semibold tracking-[-0.015em] text-fg">
          Descarcă banca de întrebări
        </h2>
        <div className="mt-5">
          <ExportControls chapters={chapters} />
        </div>
      </section>
    </div>
  )
}
