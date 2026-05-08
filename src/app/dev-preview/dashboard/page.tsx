/**
 * Dev preview pentru ecranul Dashboard / Overview cu date mock — pentru
 * visual QA fără o sesiune autentificată. NU folosi pentru screenshot
 * funcțional (folosește /dashboard/overview cu cont real).
 */
import Link from "next/link"
import { ArrowRight, Lock, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  AppShell,
  type NavLink,
} from "@/components/shared/app-shell"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { TrendChart } from "@/components/dashboard/trend-chart"
import { ChapterRadar } from "@/components/dashboard/radar-chart"
import {
  DashboardWindow,
  DashboardWindowCell,
  DashboardWindowGrid,
  MonoLabel,
  PercentBar,
  ScorePill,
  SectionTag,
} from "@/components/branded"

const studentLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", requiredTier: "PRO" },
  { href: "/practice", label: "Teste practice", requiredTier: "FREE" },
  { href: "/exam", label: "Simulare", requiredTier: "PRO" },
  { href: "/practice/mistakes", label: "Greșelile mele", requiredTier: "PRO" },
  { href: "/admission", label: "Admitere", requiredTier: "PREMIUM", locked: true },
  { href: "/subscription", label: "Abonament", requiredTier: "FREE" },
]

const mockOverview = {
  stats: {
    totalTests: 47,
    totalQuestions: 1834,
    correctAnswers: 1342,
    accuracyPct: 73,
  },
  streak: 12,
}

const mockTrends = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10),
  totalQuestions: 20 + Math.round(Math.sin(i / 3) * 10 + Math.random() * 15),
  correctCount: 15 + Math.round(Math.cos(i / 4) * 5 + Math.random() * 10),
  accuracyPct: Math.round(60 + Math.sin(i / 5) * 15 + Math.random() * 10),
}))

const mockChapters = [
  { chapterId: "1", chapterName: "Endodonție", totalQuestions: 200, correctAnswers: 168, totalAnswers: 200, accuracyPct: 84 },
  { chapterId: "2", chapterName: "Pedodonție", totalQuestions: 180, correctAnswers: 124, totalAnswers: 180, accuracyPct: 69 },
  { chapterId: "3", chapterName: "Ortodonție", totalQuestions: 160, correctAnswers: 96, totalAnswers: 160, accuracyPct: 60 },
  { chapterId: "4", chapterName: "Chirurgie", totalQuestions: 140, correctAnswers: 105, totalAnswers: 140, accuracyPct: 75 },
  { chapterId: "5", chapterName: "Protetică", totalQuestions: 220, correctAnswers: 154, totalAnswers: 220, accuracyPct: 70 },
  { chapterId: "6", chapterName: "Parodontologie", totalQuestions: 190, correctAnswers: 152, totalAnswers: 190, accuracyPct: 80 },
]

export default function DashboardPreviewPage() {
  const accuracy = mockOverview.stats.accuracyPct
  const accuracyTone = accuracy >= 70 ? "pos" : accuracy >= 50 ? "neutral" : "neg"
  const days = 30

  return (
    <AppShell
      links={studentLinks}
      userEmail="ana.popescu@yahoo.com"
      showMobileTabBar
      context="student"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <DashboardSidebar tier="PRO" />
        <main className="min-w-0 flex-1">
          <div className="space-y-8">
            {/* Header with filters */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <SectionTag>Dashboard</SectionTag>
                <h1 className="mt-3 text-[38px] font-bold leading-[1.05] tracking-[-0.03em] text-fg">
                  Progresul tău, în clar.
                </h1>
                <p className="mt-3 max-w-[560px] text-[15px] leading-[1.55] text-fg-dim">
                  Cât de mult, cât de des, cât de bine. Filtrează pe interval
                  sau tip de test pentru a izola pattern-uri.
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <Button variant="outline" size="sm">7 zile</Button>
                <Button size="sm">30 zile</Button>
                <Button variant="outline" size="sm">Tot</Button>
              </div>
            </div>

            {/* Hero metric */}
            <DashboardWindow
              title={
                <span>
                  dashboard.tsx ·{" "}
                  <span className="text-fg-dim">last {days} days</span>
                </span>
              }
              status={
                <>
                  <span className="size-1.5 rounded-full bg-neon shadow-[0_0_6px_var(--neon)]" />
                  <MonoLabel size="body" tone="accent">
                    {mockOverview.streak} zile consecutive
                  </MonoLabel>
                </>
              }
            >
              <DashboardWindowGrid cols={4}>
                <DashboardWindowCell colSpan={2}>
                  <MonoLabel size="cell">Acuratețe globală</MonoLabel>
                  <div className="mt-3 font-mono text-[80px] font-semibold leading-none tracking-[-0.05em] text-fg">
                    {accuracy}
                    <span className="text-fg-mute">%</span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <ScorePill tone={accuracyTone}>
                      {mockOverview.stats.correctAnswers} /{" "}
                      {mockOverview.stats.totalQuestions} corecte
                    </ScorePill>
                    <MonoLabel size="body">
                      {mockOverview.stats.totalTests} teste
                    </MonoLabel>
                  </div>
                </DashboardWindowCell>

                <DashboardWindowCell>
                  <MonoLabel size="cell">Serie zile</MonoLabel>
                  <div className="mt-3 font-mono text-[44px] font-semibold leading-none tracking-[-0.04em] text-fg">
                    {mockOverview.streak}
                  </div>
                  <PercentBar
                    value={Math.min(100, (mockOverview.streak / 30) * 100)}
                    className="mt-4"
                  />
                  <div className="mt-2.5 font-mono text-[10.5px] text-fg-mute">
                    mai sunt {30 - mockOverview.streak} zile până la 30
                  </div>
                </DashboardWindowCell>

                <DashboardWindowCell>
                  <MonoLabel size="cell">Întrebări totale</MonoLabel>
                  <div className="mt-3 font-mono text-[44px] font-semibold leading-none tracking-[-0.04em] text-fg">
                    {mockOverview.stats.totalQuestions.toLocaleString("ro-RO")}
                  </div>
                  <div className="mt-4 flex items-center gap-2 font-mono text-[11px] text-fg-mute">
                    <span>medie</span>
                    <span className="text-fg">
                      {Math.round(
                        mockOverview.stats.totalQuestions /
                          mockOverview.stats.totalTests,
                      )}
                    </span>
                    <span>per test</span>
                  </div>
                </DashboardWindowCell>
              </DashboardWindowGrid>
            </DashboardWindow>

            {/* Motivation strip mock */}
            <div className="flex items-center gap-4 rounded-[14px] border border-neon/25 bg-bg-2 px-4 py-3.5">
              <div className="grid size-10 shrink-0 place-items-center rounded-full bg-neon/8 text-neon">
                <Sparkles className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] leading-[1.55] text-fg-dim">
                  <span className="text-fg">
                    12 zile consecutive!
                  </span>{" "}
                  Continuă cu același ritm și ai pune-o pe piață în 18 zile.
                </p>
              </div>
              <span className="shrink-0 rounded-[3px] bg-neon/8 px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-mono-tight text-neon">
                Încurajare
              </span>
            </div>

            {/* Charts grid */}
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[14px] border border-line bg-bg-2 p-6">
                <div className="mb-4 flex items-baseline justify-between">
                  <div>
                    <MonoLabel size="cell">Evoluția acurateței</MonoLabel>
                    <h3 className="mt-1 text-[18px] font-semibold tracking-[-0.02em] text-fg">
                      Ultimele {days} zile
                    </h3>
                  </div>
                  <ScorePill tone={accuracyTone} size="sm">
                    {accuracy}%
                  </ScorePill>
                </div>
                <TrendChart data={mockTrends} height={240} />
              </div>

              <div className="rounded-[14px] border border-line bg-bg-2 p-6">
                <div className="mb-4">
                  <MonoLabel size="cell">Per capitol</MonoLabel>
                  <h3 className="mt-1 text-[18px] font-semibold tracking-[-0.02em] text-fg">
                    Puncte forte vs slabe
                  </h3>
                </div>
                <ChapterRadar data={mockChapters} />
              </div>
            </div>

            {/* CTA row */}
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/practice">
                  Continuă practica
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/exam">Începe simularea</Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link href="/dashboard/chapters">
                  <Lock className="size-4" />
                  Vezi pe capitole
                </Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    </AppShell>
  )
}
