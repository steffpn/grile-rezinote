import { getAdmissionData, getSpecialties } from "@/lib/db/queries/admission"
import { AdmissionDataTable } from "@/components/admin/admission-data-table"
import { AdmissionDataImport } from "@/components/admin/admission-data-import"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SectionTag } from "@/components/branded"

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
    <div className="space-y-8">
      <div>
        <SectionTag>Date admitere</SectionTag>
        <h1 className="mt-3 text-[34px] font-bold leading-[1.05] tracking-[-0.03em] text-fg">
          Praguri istorice.
        </h1>
        <p className="mt-3 max-w-[520px] text-[15px] leading-[1.55] text-fg-dim">
          Pragurile oficiale de admitere per specialitate, UMF și an. Sursa
          tot ce face killer feature-ul să meargă.
        </p>
      </div>

      <Tabs defaultValue="table">
        <TabsList variant="line" className="border-b border-line">
          <TabsTrigger value="table">Date</TabsTrigger>
          <TabsTrigger value="import">Import / Export</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="pt-6">
          <AdmissionDataTable
            // INNER JOIN on specialty in the query guarantees specialtyId is set.
            entries={entries.map((e) => ({
              ...e,
              specialtyId: e.specialtyId!,
            }))}
            specialties={specialtyOptions}
          />
        </TabsContent>

        <TabsContent value="import" className="pt-6">
          <AdmissionDataImport specialties={specialtyOptions} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
