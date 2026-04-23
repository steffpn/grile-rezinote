import type { Metadata } from "next"
import { getCurrentUser } from "@/lib/auth/get-user"
import { getSpecialties } from "@/lib/db/queries/admission"
import { ProfileForm } from "@/components/profile/ProfileForm"

export const metadata: Metadata = {
  title: "Profilul meu | grile-ReziNOTE",
}

export default async function ProfilePage() {
  const user = await getCurrentUser()
  const specialties = await getSpecialties()

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Profilul meu</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestioneaza detaliile personale, obiectivele si preferintele de
          comunicare.
        </p>
      </div>

      <ProfileForm
        initial={{
          fullName: user.fullName,
          email: user.email,
          yearOfStudy: user.yearOfStudy,
          graduationYear: user.graduationYear,
          targetScore: user.targetScore,
          targetSpecialtyIds: user.targetSpecialtyIds ?? [],
          marketingOptIn: user.marketingOptIn,
          peerOptIn: user.peerOptIn,
        }}
        specialties={specialties.map((s) => ({ id: s.id, name: s.name }))}
      />
    </div>
  )
}
