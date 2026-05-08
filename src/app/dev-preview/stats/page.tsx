/**
 * Dev preview: pagina /dashboard/chapters cu mock data — heatmap, chapter
 * cards sortate ascendent, top forte/slabe.
 */
import {
  AppShell,
  type NavLink,
} from "@/components/shared/app-shell"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { ChapterCard } from "@/components/dashboard/chapter-card"
import { HeatMap } from "@/components/dashboard/heat-map"
import { TrendChart } from "@/components/dashboard/trend-chart"
import {
  Heatmap as BrandHeatmap,
  MonoLabel,
  ScorePill,
  SectionTag,
} from "@/components/branded"
import { Button } from "@/components/ui/button"

const studentLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", requiredTier: "PRO" },
  { href: "/practice", label: "Teste practice", requiredTier: "FREE" },
  { href: "/exam", label: "Simulare", requiredTier: "PRO" },
  { href: "/practice/mistakes", label: "Greșelile mele", requiredTier: "PRO" },
  { href: "/admission", label: "Admitere", requiredTier: "PREMIUM", locked: true },
  { href: "/subscription", label: "Abonament", requiredTier: "FREE" },
]

const mockChapters = [
  { chapterId: "c1", chapterName: "Endodonție", totalQuestions: 200, correctAnswers: 168, totalAnswers: 200, accuracyPct: 84 },
  { chapterId: "c2", chapterName: "Pedodonție", totalQuestions: 180, correctAnswers: 124, totalAnswers: 180, accuracyPct: 69 },
  { chapterId: "c3", chapterName: "Ortodonție", totalQuestions: 160, correctAnswers: 96, totalAnswers: 160, accuracyPct: 60 },
  { chapterId: "c4", chapterName: "Chirurgie OMF", totalQuestions: 140, correctAnswers: 105, totalAnswers: 140, accuracyPct: 75 },
  { chapterId: "c5", chapterName: "Protetică", totalQuestions: 220, correctAnswers: 154, totalAnswers: 220, accuracyPct: 70 },
  { chapterId: "c6", chapterName: "Parodontologie", totalQuestions: 190, correctAnswers: 152, totalAnswers: 190, accuracyPct: 80 },
  { chapterId: "c7", chapterName: "Radiologie dentară", totalQuestions: 95, correctAnswers: 47, totalAnswers: 95, accuracyPct: 49 },
  { chapterId: "c8", chapterName: "Odontoterapie restauratoare", totalQuestions: 165, correctAnswers: 99, totalAnswers: 165, accuracyPct: 60 },
]

// Heatmap: 6 capitole × 30 zile (last month)
const today = new Date()
const dates = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(today)
  d.setDate(d.getDate() - (29 - i))
  return d.toISOString().slice(0, 10)
})
const heatmapData = mockChapters.slice(0, 6).flatMap((ch) =>
  dates.map((date, i) => ({
    chapterId: ch.chapterId,
    chapterName: ch.chapterName,
    date,
    accuracyPct: i % 3 === 0 ? null : Math.round(40 + Math.sin(i / 3) * 30 + Math.random() * 30),
    questionCount: i % 3 === 0 ? 0 : 5 + Math.floor(Math.random() * 15),
  })),
)

const sortedAsc = [...mockChapters].sort((a, b) => a.accuracyPct - b.accuracyPct)
const sortedDesc = [...mockChapters].sort((a, b) => b.accuracyPct - a.accuracyPct)
const topForte = sortedDesc.slice(0, 3)
const topSlabe = sortedAsc.slice(0, 3)

const sparklineMap = new Map<string, { value: number }[]>()
mockChapters.forEach((ch, i) => {
  sparklineMap.set(
    ch.chapterId,
    Array.from({ length: 12 }, (_, j) => ({
      value: Math.max(20, Math.min(100, ch.accuracyPct + Math.sin(j + i) * 15)),
    })),
  )
})

const trends = Array.from({ length: 30 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() - (29 - i))
  return {
    date: d.toISOString().slice(0, 10),
    totalQuestions: 20 + Math.round(Math.sin(i / 3) * 10 + Math.random() * 15),
    correctCount: 15,
    accuracyPct: Math.round(60 + Math.sin(i / 5) * 15 + Math.random() * 8),
  }
})

// Streak heatmap (53 weeks × 7 days)
const streakCells = Array.from({ length: 53 * 7 }, (_, i) => {
  const r = (i * 17 + 7) % 100
  if (r < 35) return 0
  if (r < 55) return 1
  if (r < 75) return 2
  if (r < 90) return 3
  return 4
})

export default function StatsPreview() {
  return (
    <AppShell
      links={studentLinks}
      userEmail="ana.popescu@yahoo.com"
      showMobileTabBar
      context="student"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <DashboardSidebar tier="PREMIUM" />
        <main className="min-w-0 flex-1">
          <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <SectionTag>Per capitol</SectionTag>
                <h1 className="mt-3 text-[34px] font-bold leading-[1.05] tracking-[-0.03em] text-fg">
                  Unde ești puternic, unde nu.
                </h1>
                <p className="mt-3 max-w-[560px] text-[15px] leading-[1.55] text-fg-dim">
                  Capitolele sortate de la cel mai slab la cel mai puternic.
                  Click pentru detalii și sparkline.
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <Button variant="outline" size="sm">7 zile</Button>
                <Button size="sm">30 zile</Button>
                <Button variant="outline" size="sm">Tot</Button>
              </div>
            </div>

            {/* Top forte / slabe */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[14px] border border-line bg-bg-2 p-5">
                <MonoLabel size="cell" tone="accent">Top forte</MonoLabel>
                <ul className="mt-3 space-y-2">
                  {topForte.map((c, i) => (
                    <li key={c.chapterId} className="flex items-center justify-between gap-2 text-[14px]">
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span className="font-mono text-[11px] text-fg-mute">#{i + 1}</span>
                        <span className="truncate text-fg">{c.chapterName}</span>
                      </span>
                      <span className="font-mono text-[13px] font-semibold text-neon">{c.accuracyPct}%</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[14px] border border-line bg-bg-2 p-5">
                <MonoLabel size="cell" tone="danger">Top slabe</MonoLabel>
                <ul className="mt-3 space-y-2">
                  {topSlabe.map((c, i) => (
                    <li key={c.chapterId} className="flex items-center justify-between gap-2 text-[14px]">
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span className="font-mono text-[11px] text-fg-mute">#{i + 1}</span>
                        <span className="truncate text-fg">{c.chapterName}</span>
                      </span>
                      <span className="font-mono text-[13px] font-semibold text-danger">{c.accuracyPct}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Streak heatmap (mini-bento style) */}
            <section className="rounded-[14px] border border-line bg-bg-2 p-5 sm:p-6">
              <div className="mb-4 flex items-baseline justify-between">
                <div>
                  <MonoLabel size="cell">Streak · zilnic</MonoLabel>
                  <h2 className="mt-1.5 text-[18px] font-semibold tracking-[-0.015em] text-fg">
                    Ultimele 53 săptămâni
                  </h2>
                </div>
                <ScorePill tone="pos" size="sm">
                  +12 zile
                </ScorePill>
              </div>
              <BrandHeatmap cells={streakCells} cols={53} />
            </section>

            {/* Trend chart */}
            <section className="rounded-[14px] border border-line bg-bg-2 p-5 sm:p-6">
              <div className="mb-4 flex items-baseline justify-between">
                <div>
                  <MonoLabel size="cell">Trend acuratețe</MonoLabel>
                  <h2 className="mt-1.5 text-[18px] font-semibold tracking-[-0.015em] text-fg">
                    Ultimele 30 zile
                  </h2>
                </div>
                <ScorePill tone="pos" size="sm">68% medie</ScorePill>
              </div>
              <TrendChart data={trends} height={220} />
            </section>

            {/* Chapter cards grid */}
            <section>
              <div className="mb-3">
                <MonoLabel size="cell">Toate capitolele · sortate ascendent</MonoLabel>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {sortedAsc.map((c) => (
                  <ChapterCard
                    key={c.chapterId}
                    chapter={c}
                    sparklineData={sparklineMap.get(c.chapterId)}
                  />
                ))}
              </div>
            </section>

            {/* Heatmap chapter × date */}
            <section className="rounded-[14px] border border-line bg-bg-2 p-5 sm:p-6">
              <div className="mb-4">
                <MonoLabel size="cell">Activitate · capitole × zile</MonoLabel>
                <h2 className="mt-1.5 text-[18px] font-semibold tracking-[-0.015em] text-fg">
                  Hartă de activitate
                </h2>
              </div>
              <HeatMap
                data={heatmapData}
                chapters={mockChapters.slice(0, 6).map((c) => c.chapterName)}
                dates={dates}
              />
            </section>
          </div>
        </main>
      </div>
    </AppShell>
  )
}
