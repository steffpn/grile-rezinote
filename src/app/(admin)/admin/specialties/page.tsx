import { getAllSpecialties } from "@/lib/db/queries/admission"
import { SpecialtyManager } from "@/components/admin/specialty-manager"
import { SectionTag } from "@/components/branded"

export default async function SpecialtiesPage() {
  const specialties = await getAllSpecialties()

  return (
    <div className="space-y-8">
      <div>
        <SectionTag>Specialități</SectionTag>
        <h1 className="mt-3 text-[34px] font-bold leading-[1.05] tracking-[-0.03em] text-fg">
          Gestionare specialități.
        </h1>
        <p className="mt-3 max-w-[520px] text-[15px] leading-[1.55] text-fg-dim">
          Adaugă și gestionează specialitățile dentare folosite la datele de
          admitere.
        </p>
      </div>

      <SpecialtyManager specialties={specialties} />
    </div>
  )
}
