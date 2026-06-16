import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  DashboardWindow,
  DashboardWindowCell,
  DashboardWindowGrid,
  DataRow,
  DataRowDot,
  Eyebrow,
  MonoLabel,
  PercentBar,
  ScorePill,
  SectionTag,
  Ticker,
} from "@/components/branded"
import { HeroProbeAnimation } from "@/components/landing/hero-probe-animation"
import { ScoreDistribution } from "@/components/exam/ScoreDistribution"
import { mockBellCurve } from "@/components/exam/score-distribution-data"
import { AdmissionGrid } from "@/components/exam/AdmissionGrid"
import { Heatmap } from "@/components/branded/heatmap"
import { LandingPricing } from "@/components/landing/landing-pricing"
import { WaitlistForm } from "@/components/landing/waitlist-form"
import { getTierPricing } from "@/lib/stripe/tier-pricing"
import { getExamDuration } from "@/lib/db/queries/exam"
import { isRegistrationOpen } from "@/lib/launch"
import { cn } from "@/lib/utils"

// ISR — refresh the Stripe-backed pricing hourly instead of calling Stripe on
// every request. Mirrors the /pricing page so both stay in lockstep.
export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const hours = (await getExamDuration()) / 3600
  return {
    title: "grile-ReziNOTE — Examenul tău, simulat exact",
    description: `Simulează examene reale de rezidențiat stomatologie. 200 grile, ${hours} ore. Vezi instant unde ai fi fost admis, pe baza pragurilor reale din ultimii 5 ani.`,
  }
}

// Heat map cells pentru mini-bento — 80 cells (20 cols × 4 rows) cu pattern aleatoriu deterministic
const heatCells = Array.from({ length: 80 }, (_, i) => {
  const r = (i * 23 + 7) % 100
  if (r < 25) return 0
  if (r < 45) return 1
  if (r < 65) return 2
  if (r < 85) return 3
  return 4
})

const admissionEntries = [
  { umf: "UMF Carol Davila", specialty: "Endodonție", threshold: 821, seats: 14, margin: 26 },
  { umf: "UMF Iuliu Hațieganu", specialty: "Pedodonție", threshold: 798, seats: 8, margin: 49 },
  { umf: "UMF Gr. T. Popa", specialty: "Ortodonție", threshold: 834, seats: 11, margin: 13 },
  { umf: "UMF Victor Babeș", specialty: "Protetică", threshold: 756, seats: 12, margin: 91 },
  { umf: "UMF Carol Davila", specialty: "Chirurgie OMF", threshold: 891, seats: 6, margin: -44 },
  { umf: "UMF Tg. Mureș", specialty: "Parodontologie", threshold: 859, seats: 9, margin: -12 },
]

export default async function LandingPage() {
  const distributionCurve = mockBellCurve(720, 80, 500, 950)
  const tiers = await getTierPricing()
  // Single source of truth for the simulation length — same value the real
  // exam uses (configurable, default 4h), so the landing copy can never drift
  // out of sync with the actual cronometru again.
  const durationHours = (await getExamDuration()) / 3600
  const oreLabel = durationHours === 1 ? "oră" : "ore"
  // Pre-launch: account creation is closed, so signup CTAs become the waitlist.
  const registrationOpen = isRegistrationOpen()

  return (
    <main>
      {/* ===== HERO ===== */}
      <section className="relative mx-auto max-w-[1320px] px-10 pt-20 pb-16 text-center">
        <div
          aria-hidden
          className="bg-brand-grid mask-radial-fade pointer-events-none absolute inset-0 opacity-[0.35]"
        />

        <div className="relative">
          <Eyebrow>Sesiunea 2026 · 187 zile rămase</Eyebrow>
        </div>

        <div className="relative">
          <HeroProbeAnimation />
        </div>

        <h1 className="relative mx-auto mt-7 max-w-[1000px] text-balance text-[64px] font-bold leading-[0.95] tracking-[-0.05em] sm:text-[80px] lg:text-[96px]">
          Examenul tău,
          <br />
          <span className="text-neon">simulat exact.</span>
        </h1>

        <p className="relative mx-auto mt-7 max-w-[640px] text-[17px] leading-[1.55] text-fg-dim sm:text-[19px]">
          200 de grile, {durationHours} {oreLabel}, identic cu examenul oficial.
          Vezi instant unde ai fi fost admis, pe baza pragurilor reale din
          ultimii 5 ani.
        </p>

        {registrationOpen ? (
          <>
            <div className="relative mt-9 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/signup?source=landing-hero">
                  Începe simularea →
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="#how">Vezi cum scorăm</Link>
              </Button>
            </div>

            <div className="relative mt-6 flex flex-wrap items-center justify-center gap-7 font-mono text-[12.5px] text-fg-mute">
              <span className="before:mr-1 before:text-neon before:content-['✓_']">
                7 zile gratuit
              </span>
              <span className="before:mr-1 before:text-neon before:content-['✓_']">
                fără card
              </span>
              <span className="before:mr-1 before:text-neon before:content-['✓_']">
                anulezi oricând
              </span>
            </div>
          </>
        ) : (
          <>
            <div id="waitlist" className="relative mt-9 scroll-mt-28">
              <WaitlistForm source="landing-hero" />
            </div>

            <div className="relative mt-5 flex flex-wrap items-center justify-center gap-6 font-mono text-[12.5px] text-fg-mute">
              <span className="before:mr-1 before:text-neon before:content-['✓_']">
                lansare în curând
              </span>
              <span className="before:mr-1 before:text-neon before:content-['✓_']">
                fără spam
              </span>
              <Link
                href="#how"
                className="underline-offset-2 hover:text-fg hover:underline"
              >
                vezi cum funcționează →
              </Link>
            </div>
          </>
        )}
      </section>

      {/* ===== COUNTDOWN PANEL ===== */}
      <section className="mx-auto mt-16 max-w-[1100px] px-10">
        <div className="relative overflow-hidden rounded-[18px] border border-line bg-bg-2 px-10 py-8">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at top right, oklch(0.84 0.21 162 / 0.07), transparent 60%)",
            }}
          />
          <div className="relative grid gap-9 lg:grid-cols-[auto_1fr_auto] lg:items-center">
            <div>
              <MonoLabel size="cell">Timp rămas</MonoLabel>
              <div className="mt-2.5 flex gap-[18px]">
                <CountUnit value="187" label="zile" />
                <CountUnit value="14" label="ore" />
                <CountUnit value="23" label="min" />
              </div>
            </div>

            <div className="border-t border-line pt-6 lg:border-l lg:border-t-0 lg:pl-9 lg:pt-0">
              <h3 className="text-balance text-[22px] font-semibold leading-[1.3] tracking-[-0.02em] text-fg">
                În medie, studenții care intră fac{" "}
                <span className="text-neon">3 simulări complete</span> și 800+
                grile pe capitol.
              </h3>
              <p className="mt-2 text-[14px] leading-[1.5] text-fg-dim">
                Tu cât ai făcut săptămâna asta?
              </p>
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <MonoLabel size="cell">utilizatori activi azi</MonoLabel>
              <span className="font-mono text-[32px] font-semibold leading-none tracking-[-0.03em] text-neon">
                1.247
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== DASHBOARD MOCK ===== */}
      <section className="mx-auto mt-20 max-w-[1320px] px-10">
        <DashboardWindow
          title={
            <span>
              simulare-21oct.tsx ·{" "}
              <span className="text-fg-dim">last attempt</span>
            </span>
          }
          tabs={[
            { id: "result", label: "Rezultat" },
            { id: "chapter", label: "Per capitol" },
            { id: "mistakes", label: "Greșeli" },
            { id: "compare", label: "Comparativ" },
          ]}
          activeTab="result"
          status={
            <>
              <span className="size-1.5 rounded-full bg-neon shadow-[0_0_6px_var(--neon)]" />
              <MonoLabel size="body" tone="accent">
                finalizat 14:23
              </MonoLabel>
            </>
          }
        >
          <DashboardWindowGrid cols={4}>
            <DashboardWindowCell colSpan={2}>
              <MonoLabel size="cell">Scor total · max 950</MonoLabel>
              <div className="mt-3 font-mono text-[80px] font-semibold leading-none tracking-[-0.05em] text-fg sm:text-[96px]">
                847<span className="text-fg-mute">/950</span>
              </div>
              <div className="mt-4 flex items-center gap-5">
                <ScorePill tone="pos" arrow>
                  +62 vs anterior
                </ScorePill>
                <MonoLabel size="body">
                  CS <span className="text-fg">198</span> · CM{" "}
                  <span className="text-fg">649</span>
                </MonoLabel>
              </div>
            </DashboardWindowCell>

            <DashboardWindowCell>
              <MonoLabel size="cell">Percentilă</MonoLabel>
              <div className="mt-3 font-mono text-[44px] font-semibold leading-none tracking-[-0.04em] text-fg">
                87<span className="text-[24px] text-fg-mute">.4</span>
              </div>
              <PercentBar value={87} className="mt-4" />
              <div className="mt-2.5 font-mono text-[10.5px] text-fg-mute">
                2.747 / 3.142 sub tine
              </div>
            </DashboardWindowCell>

            <DashboardWindowCell>
              <MonoLabel size="cell">Timp folosit</MonoLabel>
              <div className="mt-3 font-mono text-[36px] font-medium leading-none tracking-[-0.03em] text-fg">
                2:31<span className="text-[18px] text-fg-mute">/3:00</span>
              </div>
              <div className="mt-4 flex gap-[2px]">
                {Array.from({ length: 10 }).map((_, i) => (
                  <span
                    key={i}
                    aria-hidden
                    className={cn(
                      "h-[18px] flex-1 rounded-[1px]",
                      i < 8 ? "bg-neon-2" : "bg-bg-3",
                    )}
                  />
                ))}
              </div>
              <div className="mt-2.5 font-mono text-[10.5px] text-fg-mute">
                29 min rămase nefolosite
              </div>
            </DashboardWindowCell>

            <DashboardWindowCell colSpan={4}>
              <MonoLabel size="cell">
                Distribuție scoruri · 3.142 utilizatori
              </MonoLabel>
              <div className="mt-3">
                <ScoreDistribution
                  curve={distributionCurve}
                  userScore={847}
                  cohortMean={765}
                  height={180}
                />
              </div>
            </DashboardWindowCell>

            <DashboardWindowCell colSpan={4}>
              <MonoLabel size="cell">
                Admiterea ta · pe baza pragurilor 2025
              </MonoLabel>
              <div className="mt-2">
                <DataRow
                  name={
                    <span className="flex items-center gap-2.5">
                      <DataRowDot active />
                      Endodonție · Carol Davila
                    </span>
                  }
                  meta="prag 821"
                  trail={
                    <ScorePill tone="pos" size="sm">
                      +26
                    </ScorePill>
                  }
                />
                <DataRow
                  name={
                    <span className="flex items-center gap-2.5">
                      <DataRowDot active />
                      Pedodonție · Iuliu Hațieganu
                    </span>
                  }
                  meta="prag 798"
                  trail={
                    <ScorePill tone="pos" size="sm">
                      +49
                    </ScorePill>
                  }
                />
                <DataRow
                  name={
                    <span className="flex items-center gap-2.5">
                      <DataRowDot active />
                      Ortodonție · Gr. T. Popa
                    </span>
                  }
                  meta="prag 834"
                  trail={
                    <ScorePill tone="pos" size="sm">
                      +13
                    </ScorePill>
                  }
                />
                <DataRow
                  muted
                  name={
                    <span className="flex items-center gap-2.5">
                      <DataRowDot active={false} />
                      Chirurgie OMF · Carol Davila
                    </span>
                  }
                  meta="prag 891"
                  trail={
                    <ScorePill tone="danger" size="sm">
                      −44
                    </ScorePill>
                  }
                />
              </div>
            </DashboardWindowCell>
          </DashboardWindowGrid>
        </DashboardWindow>

        {/* Ticker */}
        <div className="mt-[18px]">
          <Ticker
            items={[
              { label: "grile", value: "12.847" },
              { label: "simulări azi", value: "142", trend: "up" },
              { label: "media percentilă", value: "63.2" },
              { label: "cel mai bun scor azi", value: "912" },
              {
                label: "ultima admitere ·",
                value: "Endodonție UMF Tg. Mureș 824",
                accent: true,
              },
            ]}
          />
        </div>
      </section>

      {/* ===== KILLER FEATURE ===== */}
      <section
        id="admission"
        className="mt-[110px] border-y border-line bg-[linear-gradient(180deg,var(--bg-2)_0%,var(--bg)_100%)]"
      >
        <div className="mx-auto grid max-w-[1320px] gap-16 px-10 py-[110px] lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <SectionTag>Killer feature</SectionTag>
            <h2 className="mt-3.5 text-balance text-[48px] font-bold leading-[0.98] tracking-[-0.04em] sm:text-[64px]">
              Endodonție Carol Davila —{" "}
              <span className="text-neon">prag 821.</span>
              <br />
              Tu ai 847.
            </h2>
            <p className="mt-6 max-w-[520px] text-[17px] leading-[1.55] text-fg-dim">
              Pentru fiecare simulare, vezi instant la ce specialități și la
              ce UMF-uri ai fi fost admis — pe baza pragurilor reale publicate
              de Ministerul Sănătății în ultimii 5 ani.
            </p>
            <ul className="mt-8 flex flex-col gap-3.5">
              {[
                "Praguri din **2021–2025**, toate cele 6 UMF-uri din România",
                "Calculul exact al diferenței față de prag — vezi cu cât ai fi **peste sau sub**",
                "Distribuția scorurilor altor utilizatori — **percentilă, ranking**",
                "Recomandări per capitol pentru următoarele **+50 puncte**",
              ].map((text, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3.5 rounded-[10px] bg-bg-3 px-4.5 py-3.5 text-[15px] text-fg-dim"
                >
                  <span className="mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full bg-neon text-[11px] font-bold text-bg">
                    ✓
                  </span>
                  <span dangerouslySetInnerHTML={{ __html: text.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-fg">$1</strong>') }} />
                </li>
              ))}
            </ul>
          </div>

          {/* Killer vis box */}
          <div className="rounded-[18px] border border-line bg-bg p-7 shadow-killer">
            <div className="flex items-baseline justify-between border-b border-dashed border-line pb-4 font-mono text-[11px] uppercase tracking-mono text-fg-mute">
              <span>
                Scorul tău · <strong className="text-neon">847</strong> / 950
              </span>
              <span>simulare 21 oct</span>
            </div>
            {[
              { name: "Endodonție", umf: "Carol Davila · București", thresholdPct: 84, scorePct: 89, delta: 26, tone: "pos" as const },
              { name: "Pedodonție", umf: "Iuliu Hațieganu · Cluj", thresholdPct: 81, scorePct: 89, delta: 49, tone: "pos" as const },
              { name: "Ortodonție", umf: "Gr. T. Popa · Iași", thresholdPct: 86, scorePct: 89, delta: 13, tone: "pos" as const },
              { name: "Protetică", umf: "Victor Babeș · Timișoara", thresholdPct: 76, scorePct: 89, delta: 91, tone: "pos" as const },
              { name: "Chirurgie OMF", umf: "Carol Davila · București", thresholdPct: 92, scorePct: 89, delta: -44, tone: "neg" as const },
            ].map((row) => (
              <div
                key={`${row.name}-${row.umf}`}
                className="grid grid-cols-[1fr_200px_auto] items-center gap-4 border-b border-line py-4 last:border-b-0"
              >
                <div className="min-w-0">
                  <div
                    className={cn(
                      "text-[15px] font-medium",
                      row.tone === "neg" ? "text-fg-mute" : "text-fg",
                    )}
                  >
                    {row.name}
                  </div>
                  <div className="mt-0.5 font-mono text-[12px] text-fg-mute">
                    {row.umf}
                  </div>
                </div>
                <div className="relative h-6 overflow-hidden rounded-[4px] bg-bg-3">
                  <div
                    className="absolute inset-y-[-2px] w-[2px] bg-warm"
                    style={{ left: `${row.thresholdPct}%` }}
                    aria-hidden
                  />
                  <div
                    className="absolute inset-y-0 left-0 rounded-[4px]"
                    style={{
                      width: `${row.scorePct}%`,
                      background:
                        "linear-gradient(90deg, oklch(0.4 0.1 162), var(--neon))",
                    }}
                    aria-hidden
                  />
                </div>
                <div
                  className={cn(
                    "min-w-[40px] text-right font-mono text-[13px] font-semibold",
                    row.tone === "pos" ? "text-neon" : "text-warm",
                  )}
                >
                  {row.delta >= 0 ? `+${row.delta}` : row.delta}
                </div>
              </div>
            ))}
          </div>

          {/* UMF cards full width */}
          <div className="lg:col-span-2 lg:mt-10">
            <AdmissionGrid entries={admissionEntries} year="'25" />
          </div>
        </div>
      </section>

      {/* ===== QUOTE ===== */}
      <section className="mx-auto max-w-[1000px] px-10 py-[110px] text-center">
        <blockquote className="text-balance text-[36px] font-semibold leading-[1.15] tracking-[-0.03em] text-fg sm:text-[44px]">
          Anul trecut, pragul la{" "}
          <span className="italic text-neon">Endodonție Carol Davila</span> a
          fost 821.
          <br />
          Acum un an, era 798. Acum doi, 776.
          <br />
          <span className="italic text-fg-mute">Crește. Tu cât ai făcut azi?</span>
        </blockquote>
        <cite className="mt-7 block font-mono text-[12px] uppercase tracking-mono-wide text-fg-mute not-italic">
          — date oficiale Ministerul Sănătății, 2023–2025
        </cite>
      </section>

      {/* ===== FEATURES ===== */}
      <section
        id="features"
        className="mx-auto max-w-[1320px] px-10 py-[110px]"
      >
        <div className="mx-auto mb-14 max-w-[900px] text-center">
          <SectionTag>Tot ce-ți trebuie</SectionTag>
          <h2 className="mt-3.5 text-balance text-[44px] font-bold leading-[0.98] tracking-[-0.04em] sm:text-[56px]">
            Construită <span className="italic text-neon">de la zero</span>{" "}
            pentru rezidențiat.
          </h2>
        </div>

        {/* 3 alternating feature rows */}
        <FeatureRow
          tag="01 / Simulator oficial"
          title={
            <>
              200 de grile.{" "}
              <span className="italic text-neon">
                {durationHours} {oreLabel}.
              </span>{" "}
              Cronometru oficial.
            </>
          }
          body="Reconstrucție fidelă a examenului real. 50 CS + 150 CM, randomizate din toate capitolele. Scoring identic cu cel oficial — 4p/0p pe CS, partial credit cu anulare pe CM."
          bullets={[
            `Cronometru de ${durationHours} ${oreLabel} care nu poate fi pus pauză`,
            'Navigator între întrebări, marcaj pentru "revin mai târziu"',
            "Submit la sfârșit, scor calculat în timp real",
          ]}
          vis={<TimerVis />}
        />

        <FeatureRow
          flip
          tag="02 / Practică pe capitole"
          title={
            <>
              Antrenament <span className="italic text-neon">țintit.</span>{" "}
              Vezi exact unde ești slab.
            </>
          }
          body="Alege un capitol singur sau mixează tot. Cu sau fără timer. Cu feedback imediat sau doar la final. Tu decizi."
          bullets={[
            "12+ capitole, definite din admin (configurabile)",
            "Filtru pe greșeli — refă doar grilele picate",
            "Statistici per capitol în timp real",
          ]}
          vis={<ExamMockVis />}
        />

        <FeatureRow
          tag="03 / Ranking anonim"
          title={
            <>
              Vezi unde ești. <span className="italic text-neon">Anonim.</span>
            </>
          }
          body="Comparație cu toți ceilalți utilizatori. Percentilă, ranking, distribuție. Fără presiune socială — username-uri anonime, opțional opt-in."
          bullets={[
            "Percentila ta, calculată în timp real",
            "Distribuția completă a scorurilor",
            "Top 100 — cu username anonim",
          ]}
          vis={<RankingVis />}
          last
        />

        {/* Mini bento */}
        <div className="mt-10 grid gap-3 lg:grid-cols-3">
          <MiniBento tag="04 / Streak" title="Heat map zilnic." body="Vezi dintr-o privire în ce zi ai exersat și în ce zi ai sărit.">
            <Heatmap cells={heatCells} cols={20} className="w-full" />
          </MiniBento>

          <MiniBento tag="05 / Diagnostic" title="Radar per disciplină." body="Profilul tău complet de cunoștințe, dintr-o privire.">
            <RadarVis />
          </MiniBento>

          <MiniBento tag="06 / Mobil" title="Instalabilă pe telefon." body="PWA. Învață în pauze, în tramvai, oriunde.">
            <PhoneVis />
          </MiniBento>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section
        id="how"
        className="mx-auto max-w-[1320px] px-10 py-[110px]"
      >
        <div className="mb-14 max-w-[900px]">
          <SectionTag>Workflow</SectionTag>
          <h2 className="mt-3.5 text-balance text-[44px] font-bold leading-[0.98] tracking-[-0.04em] sm:text-[56px]">
            Patru pași până la{" "}
            <span className="italic text-neon">prima ta admitere simulată.</span>
          </h2>
        </div>

        <div className="grid divide-y divide-line overflow-hidden rounded-[14px] border border-line bg-bg-2 lg:grid-cols-4 lg:divide-x lg:divide-y-0">
          {[
            { num: "01", title: "Cont gratuit", body: "Email + parolă. 7 zile trial fără card cerut.", pct: 25 },
            { num: "02", title: "Practica țintit", body: "Începe cu zonele unde ești slab. Feedback la fiecare grilă.", pct: 50 },
            { num: "03", title: "Simulare oficială", body: `200 grile, ${durationHours} ${oreLabel}. Identic cu examenul real.`, pct: 75 },
            { num: "04", title: "Comparație admitere", body: "Vezi instant la ce specialitate ai fi fost admis.", pct: 100 },
          ].map((step) => (
            <div key={step.num} className="px-6 py-7">
              <div className="h-[3px] overflow-hidden rounded-full bg-bg-3">
                <span
                  className="block h-full bg-neon"
                  style={{ width: `${step.pct}%` }}
                />
              </div>
              <div className="mt-4.5 font-mono text-[10px] uppercase tracking-mono-wide text-neon">
                Pas {step.num} / 04
              </div>
              <h4 className="mt-3.5 text-[19px] font-semibold leading-[1.2] tracking-[-0.02em] text-fg">
                {step.title}
              </h4>
              <p className="mt-2.5 text-[13px] leading-[1.5] text-fg-dim">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section
        id="pricing"
        className="mx-auto max-w-[1320px] px-10 py-[110px]"
      >
        <div className="mx-auto mb-14 max-w-[900px] text-center">
          <SectionTag>Preț cinstit</SectionTag>
          <h2 className="mt-3.5 text-balance text-[44px] font-bold leading-[0.98] tracking-[-0.04em] sm:text-[56px]">
            Mai ieftin decât{" "}
            <span className="italic text-neon">o carte de specialitate.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-[560px] text-[17px] leading-[1.55] text-fg-dim">
            7 zile gratuit. Anulezi instant.
          </p>
        </div>

        <LandingPricing tiers={tiers} registrationOpen={registrationOpen} />
      </section>

      {/* ===== FAQ ===== */}
      <section
        id="faq"
        className="mx-auto max-w-[1320px] px-10 py-[110px]"
      >
        <div className="mx-auto mb-14 max-w-[900px] text-center">
          <SectionTag>Răspunsuri</SectionTag>
          <h2 className="mt-3.5 text-balance text-[44px] font-bold leading-[0.98] tracking-[-0.04em] sm:text-[56px]">
            Întrebări <span className="italic text-neon">pe bune.</span>
          </h2>
        </div>

        <div className="mx-auto max-w-[880px]">
          {[
            {
              q: "De unde sunt grilele?",
              a: "Validate manual din bibliografia oficială (Iliescu, Gafar, Mounier-Forrest, etc.) și actualizate cu fiecare ediție nouă.",
            },
            {
              q: "Cum sunt calculate pragurile de admitere?",
              a: "Pragurile oficiale publicate de MS pentru fiecare an din 2021 încoace, pentru fiecare specialitate și UMF.",
            },
            {
              q: "E aceeași formulă de scoring ca la examenul real?",
              a: "Da. CS: 4p corect, 0 greșit. CM: partial credit cu anulare la mai puțin de 2 sau mai mult de 4 selecții. Total max 950.",
            },
            {
              q: "Pot să o folosesc pe telefon?",
              a: "Da, e PWA — o instalezi din browser direct pe home screen.",
            },
            {
              q: "Cât durează un trial?",
              a: "7 zile, acces complet, fără card cerut la început.",
            },
            {
              q: "Cum anulez?",
              a: "Un buton în pagina de Subscription. Anulezi instant.",
            },
          ].map((item) => (
            <details
              key={item.q}
              className="group border-b border-line py-6 last:border-b-0"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-medium tracking-[-0.015em] text-fg [&::-webkit-details-marker]:hidden">
                <span>{item.q}</span>
                <span className="font-mono text-[18px] text-neon transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-2.5 max-w-[720px] text-[14px] leading-[1.6] text-fg-dim">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="relative mx-auto max-w-[1320px] overflow-hidden px-10 py-[130px] text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, oklch(0.84 0.21 162 / 0.08), transparent 60%)",
          }}
        />
        <h2 className="relative mx-auto max-w-[1000px] text-balance text-[60px] font-extrabold leading-[0.95] tracking-[-0.05em] sm:text-[88px]">
          187 zile.
          <br />
          Sau{" "}
          <span className="italic text-neon">primul tău scor real,</span> în{" "}
          {durationHours} {oreLabel}.
        </h2>
        <p className="relative mt-6 text-[17px] leading-[1.55] text-fg-dim">
          {registrationOpen
            ? "7 zile gratuit. Vezi în prima simulare unde te afli."
            : "Fii printre primii care primesc acces la lansare."}
        </p>
        {registrationOpen ? (
          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/signup?source=landing-final">
                Începe simularea →
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/demo-result">Vezi un rezultat exemplu</Link>
            </Button>
          </div>
        ) : (
          <div className="relative mt-8">
            <WaitlistForm source="landing-final" />
            <div className="mt-4 text-center">
              <Link
                href="/demo-result"
                className="font-mono text-[12.5px] text-fg-mute underline-offset-2 hover:text-fg hover:underline"
              >
                Vezi un rezultat exemplu →
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-line bg-[oklch(0.09_0.01_165)]">
        <div className="mx-auto grid max-w-[1320px] gap-12 px-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="grid size-7 place-items-center rounded-lg bg-neon text-[13px] font-extrabold text-bg shadow-logo-glow"
              >
                R
              </span>
              <span className="text-[16px] font-bold tracking-[-0.02em] text-fg">
                grile-ReziNOTE
              </span>
            </div>
            <p className="mt-3.5 max-w-[280px] text-[13px] leading-[1.55] text-fg-mute">
              Platformă de pregătire pentru rezidențiatul în medicină dentară.
              Făcută în România, pentru studenții români.
            </p>
          </div>

          <FooterCol
            title="Produs"
            links={[
              { href: "/#features", label: "Features" },
              { href: "/pricing", label: "Pricing" },
              { href: "/#how", label: "Cum funcționează" },
              { href: "/#faq", label: "FAQ" },
            ]}
          />
          <FooterCol
            title="Cont"
            links={
              registrationOpen
                ? [
                    { href: "/login", label: "Login" },
                    { href: "/signup", label: "Signup" },
                    { href: "/signup", label: "Trial gratuit" },
                  ]
                : [{ href: "/#waitlist", label: "Vreau acces" }]
            }
          />
          <FooterCol
            title="Legal"
            links={[
              { href: "/legal/terms", label: "Termeni" },
              { href: "/legal/privacy", label: "Confidențialitate" },
              { href: "/legal/cookies", label: "Cookies" },
              { href: "mailto:support@rezinote.ro", label: "Contact" },
            ]}
          />
        </div>

        <div className="mx-auto flex max-w-[1320px] flex-col gap-2 border-t border-line px-10 py-5 font-mono text-[11px] tracking-mono-tight text-fg-mute sm:flex-row sm:justify-between">
          <span>© 2026 grile-ReziNOTE · Făcut în Cluj</span>
          <span>v1.0 · build 2026.10.21</span>
        </div>
      </footer>
    </main>
  )
}

/* ===== Helper components ===== */

function CountUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <span className="block font-mono text-[44px] font-semibold leading-none tracking-[-0.04em] text-fg sm:text-[56px]">
        {value}
      </span>
      <span className="mt-1.5 block font-mono text-[10.5px] uppercase tracking-mono-tight text-fg-mute">
        {label}
      </span>
    </div>
  )
}

function FeatureRow({
  tag,
  title,
  body,
  bullets,
  vis,
  flip = false,
  last = false,
}: {
  tag: string
  title: React.ReactNode
  body: string
  bullets: string[]
  vis: React.ReactNode
  flip?: boolean
  last?: boolean
}) {
  return (
    <div
      className={cn(
        "grid gap-16 py-[70px] lg:grid-cols-2 lg:items-center",
        !last && "border-b border-dashed border-line",
      )}
    >
      <div className={cn("min-w-0", flip && "lg:order-2")}>
        <span className="font-mono text-[11px] uppercase tracking-mono-wide text-neon">
          {tag}
        </span>
        <h3 className="mt-3.5 text-balance text-[32px] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[38px]">
          {title}
        </h3>
        <p className="mt-5 max-w-[460px] text-[16px] leading-[1.55] text-fg-dim">
          {body}
        </p>
        <ul className="mt-5.5 flex flex-col gap-2.5 text-[14px] text-fg-dim">
          {bullets.map((b) => (
            <li key={b} className="before:mr-1.5 before:text-neon before:content-['—_']">
              {b}
            </li>
          ))}
        </ul>
      </div>
      <div className={cn("min-w-0", flip && "lg:order-1")}>{vis}</div>
    </div>
  )
}

function MiniBento({
  tag,
  title,
  body,
  children,
}: {
  tag: string
  title: string
  body: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-[220px] flex-col rounded-[14px] border border-line bg-bg-2 p-6">
      <MonoLabel size="cell">{tag}</MonoLabel>
      <h4 className="mt-2.5 text-[18px] font-semibold leading-[1.2] tracking-[-0.02em] text-fg">
        {title}
      </h4>
      <p className="mt-2 text-[13px] leading-[1.5] text-fg-dim">{body}</p>
      <div className="mt-4 flex flex-1 items-center justify-center">{children}</div>
    </div>
  )
}

function FooterCol({
  title,
  links,
}: {
  title: string
  links: { href: string; label: string }[]
}) {
  return (
    <div>
      <h5 className="mb-4 font-mono text-[10px] uppercase tracking-mono text-fg-mute">
        {title}
      </h5>
      <ul className="flex flex-col gap-2.5 text-[13.5px]">
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <Link
              href={link.href}
              className="text-fg-dim transition-colors hover:text-fg"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ===== Vis components for features ===== */

function TimerVis() {
  return (
    <div className="flex min-h-[340px] flex-col items-center justify-center rounded-[16px] border border-line bg-bg-2 p-8 text-center">
      <div className="font-mono text-[72px] font-semibold leading-none tracking-[-0.05em] text-neon sm:text-[92px]">
        02:14:38
      </div>
      <div className="mt-3.5 font-mono text-[11px] uppercase tracking-mono-wide text-fg-mute">
        Timp rămas · întrebare 87 / 200
      </div>
      <div className="mt-7 flex w-full gap-[3px] px-5">
        {Array.from({ length: 20 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-[6px] flex-1 rounded-[1px]",
              i < 9 ? "bg-neon-2" : i === 9 ? "bg-neon shadow-[0_0_8px_var(--neon)]" : "bg-bg-3",
            )}
          />
        ))}
      </div>
      <div className="mt-3 flex w-full justify-between px-5 font-mono text-[11px] text-fg-mute">
        <span>răspunse 84</span>
        <span>marcate 6</span>
        <span>nealese 110</span>
      </div>
    </div>
  )
}

function ExamMockVis() {
  const opts = [
    { l: "A", t: "Dinte cu mobilitate sub gradul II", sel: false },
    { l: "B", t: "Canal radicular permeabil pe toată lungimea", sel: true },
    { l: "C", t: "Suport osos parodontal mai mare de 50%", sel: false },
    { l: "D", t: "Lipsa fracturilor radiculare", sel: true },
    { l: "E", t: "Spațiu protetic suficient pentru reconstrucție", sel: false },
  ]
  return (
    <div className="rounded-[10px] border border-line bg-bg p-4 font-mono text-[12px]">
      <div className="mb-3.5 flex justify-between border-b border-line pb-3 text-[12px]">
        <span className="text-fg-mute">Întrebare 87 / 200</span>
        <span className="text-neon">⏱ 02:14:38</span>
      </div>
      <p className="mb-3.5 font-sans text-[14.5px] leading-[1.4] text-fg">
        Care sunt indicațiile pentru terapia endodontică conservatoare la
        dinții cu pulpă necrotică și parodontită apicală cronică?
      </p>
      {opts.map((o) => (
        <div
          key={o.l}
          className={cn(
            "mb-1.5 grid grid-cols-[24px_1fr_24px] items-center gap-2.5 rounded-[7px] border bg-panel px-3 py-2.5 text-[12.5px]",
            o.sel ? "border-neon bg-neon/8" : "border-line",
          )}
        >
          <span className="text-fg-mute">{o.l}</span>
          <span className={cn("font-sans", o.sel ? "text-fg" : "text-fg-dim")}>
            {o.t}
          </span>
          <span className={o.sel ? "text-neon" : ""}>{o.sel ? "✓" : ""}</span>
        </div>
      ))}
    </div>
  )
}

function RankingVis() {
  const rows = [
    { pos: "#140", name: "anonim.dent", pts: 912 },
    { pos: "#141", name: "maxima.umf", pts: 894 },
    { pos: "#142", name: "studiosa.dmd", pts: 891 },
    { pos: "#143", name: "tu", pts: 847, you: true },
    { pos: "#144", name: "marcus.dmd", pts: 845 },
    { pos: "#145", name: "alexa.um", pts: 841 },
  ]
  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((r) => (
        <div
          key={r.pos}
          className={cn(
            "grid grid-cols-[36px_1fr_auto] items-center gap-3.5 rounded-[10px] border px-4 py-3 text-[14px]",
            r.you
              ? "border-neon/40 bg-neon/10 text-neon"
              : "border-line bg-bg",
          )}
        >
          <span
            className={cn(
              "font-mono text-[12px]",
              r.you ? "font-semibold text-neon" : "text-fg-mute",
            )}
          >
            {r.pos}
          </span>
          <span>{r.name}</span>
          <span className="font-mono">{r.pts}</span>
        </div>
      ))}
    </div>
  )
}

function RadarVis() {
  return (
    <svg viewBox="0 0 200 200" className="h-auto w-full max-w-[160px]">
      <g transform="translate(100,100)">
        {[80, 60, 40, 20].map((r) => {
          const points = [
            [0, -r],
            [r * 0.95, -r * 0.31],
            [r * 0.59, r * 0.81],
            [-r * 0.59, r * 0.81],
            [-r * 0.95, -r * 0.31],
          ]
            .map(([x, y]) => `${x},${y}`)
            .join(" ")
          return (
            <polygon
              key={r}
              points={points}
              fill="none"
              stroke="oklch(0.26 0.018 165)"
              strokeWidth="1"
            />
          )
        })}
        {[
          [0, -80],
          [76, -25],
          [47, 65],
          [-47, 65],
          [-76, -25],
        ].map(([x, y], i) => (
          <line
            key={i}
            x1="0"
            y1="0"
            x2={x}
            y2={y}
            stroke="oklch(0.26 0.018 165)"
          />
        ))}
        <polygon
          points="0,-65 60,-20 28,42 -38,52 -55,-18"
          fill="oklch(0.84 0.21 162 / 0.2)"
          stroke="oklch(0.84 0.21 162)"
          strokeWidth="1.8"
        />
        {[
          [0, -65],
          [60, -20],
          [28, 42],
          [-38, 52],
          [-55, -18],
        ].map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="3"
            fill="oklch(0.84 0.21 162)"
          />
        ))}
      </g>
    </svg>
  )
}

function PhoneVis() {
  return (
    <div className="relative h-[160px] w-[90px] rounded-[18px] border-[3px] border-line-2 bg-bg p-2 shadow-[0_14px_30px_-10px_oklch(0.05_0.01_165/0.7)]">
      <span
        aria-hidden
        className="absolute left-1/2 top-1.5 h-1 w-5.5 -translate-x-1/2 rounded-full bg-bg-2"
      />
      <div className="flex flex-col gap-1 pt-3.5">
        <div className="flex h-7 items-center justify-center rounded-[3px] bg-neon/16 font-mono text-[11px] font-semibold text-neon">
          847
        </div>
        <div className="h-2 rounded-[3px] bg-bg-2" />
        <div className="h-2 w-[70%] rounded-[3px] bg-bg-2" />
        <div className="h-2 rounded-[3px] bg-bg-2" />
        <div className="h-2 w-[60%] rounded-[3px] bg-bg-2" />
        <div className="mt-1.5 h-4 rounded-[3px] bg-bg-2" />
        <div className="h-4 rounded-[3px] bg-bg-2" />
      </div>
    </div>
  )
}
