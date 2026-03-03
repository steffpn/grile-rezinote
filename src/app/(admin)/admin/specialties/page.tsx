import { getAllSpecialties } from "@/lib/db/queries/admission"
import { SpecialtyManager } from "@/components/admin/specialty-manager"

export default async function SpecialtiesPage() {
  const specialties = await getAllSpecialties()

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Gestionare Specialitati
        </h1>
        <p className="text-muted-foreground">
          Adauga si gestioneaza specialitatile dentare pentru datele de admitere.
        </p>
      </div>

      <SpecialtyManager specialties={specialties} />
    </div>
  )
}
