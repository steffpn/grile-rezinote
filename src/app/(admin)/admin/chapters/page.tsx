import { getChaptersWithStats } from "@/lib/actions/chapters"
import { ChapterList } from "@/components/admin/chapter-list"
import { SectionTag } from "@/components/branded"

export default async function ChaptersPage() {
  const chapters = await getChaptersWithStats()

  return (
    <div className="space-y-8">
      <div>
        <SectionTag>Capitole</SectionTag>
        <h1 className="mt-3 text-[34px] font-bold leading-[1.05] tracking-[-0.03em] text-fg">
          Coloana vertebrală a băncii.
        </h1>
        <p className="mt-3 max-w-[520px] text-[15px] leading-[1.55] text-fg-dim">
          Gestionează capitolele de întrebări. Trage de mâner pentru a
          reordona.
        </p>
      </div>

      <ChapterList chapters={chapters} />
    </div>
  )
}
