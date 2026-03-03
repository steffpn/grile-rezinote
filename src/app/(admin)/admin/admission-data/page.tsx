import { getAdmissionData, getSpecialties } from "@/lib/db/queries/admission"
import { AdmissionDataTable } from "@/components/admin/admission-data-table"
import { AdmissionDataImport } from "@/components/admin/admission-data-import"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function AdmissionDataPage() {
  const [entries, specialties] = await Promise.all([
    getAdmissionData(),
    getSpecialties(),
  ])

  const specialtyOptions = specialties.map((s) => ({
    id: s.id,
    name: s.name,
  }))

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Date Istorice de Admitere
        </h1>
        <p className="text-muted-foreground">
          Gestioneaza pragurile de admitere per specialitate si an.
        </p>
      </div>

      <Tabs defaultValue="table">
        <TabsList>
          <TabsTrigger value="table">Date</TabsTrigger>
          <TabsTrigger value="import">Import / Export</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="mt-4">
          <AdmissionDataTable
            entries={entries}
            specialties={specialtyOptions}
          />
        </TabsContent>

        <TabsContent value="import" className="mt-4">
          <AdmissionDataImport specialties={specialtyOptions} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
