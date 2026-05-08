import Link from "next/link"
import { ArrowRight, BookOpen, Clock, Save, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"
import { MonoLabel, SectionTag } from "@/components/branded"
import { getCurrentUser } from "@/lib/auth/get-user"
import { getExamDuration, getInProgressExam } from "@/lib/db/queries/exam"
import { createExamAttempt } from "@/lib/actions/exam"
import { checkSubscriptionAccess } from "@/lib/subscription/check"
import { canAccessSimulations } from "@/lib/subscription/gating"
import { UpgradeBlocker } from "@/components/subscription/UpgradeBlocker"

export default async function ExamStartPage() {
  const user = await getCurrentUser()
  const access = await checkSubscriptionAccess(user.id)

  if (!canAccessSimulations(access.tier)) {
    return (
      <div className="mx-auto max-w-2xl">
        <UpgradeBlocker
          requiredTier="PRO"
          title="Simulări de examen"
          description="Testează-te în condiții reale — 200 de întrebări, cronometru, fără feedback pe parcurs. Exact ca la examenul oficial."
          benefits={[
            "Simulări nelimitate în condiții identice cu examenul",
            "Cronometru oficial cu auto-submit la expirare",
            "Scoring românesc cu anulare CM la sub 2 sau peste 4 selecții",
            "Rezultate detaliate la final + istoric complet al simulărilor",
          ]}
          alternativeAction={{
            href: "/practice",
            label: "Începe un test practic",
          }}
          showStartTrial={access.trialAvailable}
        />
      </div>
    )
  }

  const durationSeconds = await getExamDuration()
  const durationHours = durationSeconds / 3600
  const inProgressExam = await getInProgressExam(user.id)

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <SectionTag>Simulare oficială</SectionTag>
        <h1 className="mt-3 text-[38px] font-bold leading-[1.05] tracking-[-0.03em] text-fg">
          200 grile.{" "}
          <span className="text-neon">{durationHours} ore.</span> Fără feedback.
        </h1>
        <p className="mt-3 max-w-[520px] text-[15px] leading-[1.55] text-fg-dim">
          Testează-te în condiții identice cu examenul oficial. Cronometru
          oficial cu auto-submit la expirare. Vezi rezultatele la final.
        </p>
      </div>

      {/* In-progress banner */}
      {inProgressExam && (
        <div className="flex flex-col gap-3 rounded-[14px] border border-neon/30 bg-neon/8 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <MonoLabel size="cell" tone="accent">
              Simulare în progres
            </MonoLabel>
            <p className="mt-1.5 text-[14px] text-fg-dim">
              <span className="text-fg">{inProgressExam.questionCount}</span>{" "}
              întrebări · poți continua de unde ai rămas
            </p>
          </div>
          <Button asChild size="lg" className="shrink-0">
            <Link href={`/exam/${inProgressExam.id}`}>
              Continuă simularea
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      )}

      {/* Format card */}
      <section className="rounded-[14px] border border-line bg-bg-2 p-5 sm:p-6">
        <MonoLabel size="cell">Format examen</MonoLabel>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <FormatTile
            icon={<BookOpen className="size-[18px]" />}
            title="200 întrebări"
            sub="50 CS · 150 CM"
          />
          <FormatTile
            icon={<Clock className="size-[18px]" />}
            title={`${durationHours} ${durationHours === 1 ? "oră" : "ore"}`}
            sub="auto-submit la expirare"
          />
          <FormatTile
            icon={<Shield className="size-[18px]" />}
            title="Rezultate la final"
            sub="fără feedback pe parcurs"
          />
          <FormatTile
            icon={<Save className="size-[18px]" />}
            title="Salvare automată"
            sub="la fiecare 30 secunde"
          />
        </div>

        <div className="mt-5 rounded-[10px] border border-line bg-bg-3 p-4">
          <MonoLabel size="cell">Scoring oficial</MonoLabel>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <span className="rounded-[3px] bg-neon/12 px-1.5 py-0.5 font-mono text-[10.5px] uppercase tracking-mono-tight text-neon">
              CS · 4p / întrebare
            </span>
            <span className="rounded-[3px] bg-warm/12 px-1.5 py-0.5 font-mono text-[10.5px] uppercase tracking-mono-tight text-warm">
              CM · 1p / opțiune
            </span>
            <span className="rounded-[3px] bg-bg-2 px-1.5 py-0.5 font-mono text-[10.5px] uppercase tracking-mono-tight text-fg-mute">
              Max 950
            </span>
          </div>
          <p className="mt-3 text-[12.5px] leading-[1.55] text-fg-dim">
            Punctaj maxim:{" "}
            <span className="text-fg">950</span> (200 CS + 750 CM). Formula
            oficială cu anulare CM la sub 2 sau peste 4 selecții.
          </p>
        </div>
      </section>

      {/* Start CTA */}
      <form
        action={async () => {
          "use server"
          await createExamAttempt()
        }}
      >
        <Button type="submit" size="lg" className="w-full">
          Începe simularea
          <ArrowRight className="size-4" />
        </Button>
      </form>
    </div>
  )
}

function FormatTile({
  icon,
  title,
  sub,
}: {
  icon: React.ReactNode
  title: string
  sub: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-[10px] border border-line bg-bg-3 p-3.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-[8px] bg-neon/12 text-neon">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-[14px] font-medium text-fg">{title}</div>
        <div className="mt-0.5 font-mono text-[11px] tracking-mono-tight text-fg-mute">
          {sub}
        </div>
      </div>
    </div>
  )
}
