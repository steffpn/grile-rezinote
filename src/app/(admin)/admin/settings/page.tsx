import { ExamSettingsForm } from "@/components/admin/ExamSettingsForm"
import { getExamSettings } from "@/lib/actions/admin-settings"
import { MonoLabel, SectionTag } from "@/components/branded"

export default async function SettingsPage() {
  const settings = await getExamSettings()

  return (
    <div className="space-y-8">
      <div>
        <SectionTag>Setări</SectionTag>
        <h1 className="mt-3 text-[34px] font-bold leading-[1.05] tracking-[-0.03em] text-fg">
          Configurare platformă.
        </h1>
        <p className="mt-3 max-w-[520px] text-[15px] leading-[1.55] text-fg-dim">
          Parametri globali — durata simulării, plafoane, alte switch-uri
          tehnice.
        </p>
      </div>

      <section className="rounded-[14px] border border-line bg-bg-2 p-5 sm:p-6">
        <MonoLabel size="cell">Simulare examen</MonoLabel>
        <h2 className="mt-1.5 text-[18px] font-semibold tracking-[-0.015em] text-fg">
          Durată cronometru
        </h2>
        <div className="mt-5">
          <ExamSettingsForm currentDurationSeconds={settings.durationSeconds} />
        </div>
      </section>
    </div>
  )
}
