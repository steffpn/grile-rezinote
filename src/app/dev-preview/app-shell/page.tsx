import {
  AppShell,
  type NavLink,
} from "@/components/shared/app-shell"
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

const studentLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", requiredTier: "PRO" },
  { href: "/practice", label: "Teste practice", requiredTier: "FREE" },
  { href: "/exam", label: "Simulare", requiredTier: "PRO" },
  { href: "/practice/mistakes", label: "Greșelile mele", requiredTier: "PRO" },
  { href: "/admission", label: "Admitere", requiredTier: "PREMIUM", locked: true },
  { href: "/subscription", label: "Abonament", requiredTier: "FREE" },
]

export default function AppShellPreviewPage() {
  return (
    <AppShell
      links={studentLinks}
      userEmail="ana.popescu@yahoo.com"
      showMobileTabBar
      context="student"
    >
      <div className="space-y-8">
        <div>
          <SectionTag>Visual preview</SectionTag>
          <h1 className="mt-3 text-[38px] font-bold leading-[1.05] tracking-[-0.03em] text-fg">
            App shell · paletă brand
          </h1>
          <p className="mt-3 max-w-[560px] text-[15px] leading-[1.55] text-fg-dim">
            Pagina aceasta randa toate componentele branded peste shell-ul nou
            (sidebar + topbar). Folosită pentru QA vizual în dev — nu apare în
            producție.
          </p>
        </div>

        <Eyebrow>Sesiunea 2026 · 187 zile rămase</Eyebrow>

        <DashboardWindow
          title="simulare-21oct.tsx · last attempt"
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
              <div className="mt-3 font-mono text-[80px] font-semibold leading-none tracking-[-0.05em] text-fg">
                847
                <span className="text-fg-mute">/950</span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <ScorePill tone="pos" arrow>
                  +62 vs anterior
                </ScorePill>
                <MonoLabel size="body">CS 198 · CM 649</MonoLabel>
              </div>
            </DashboardWindowCell>

            <DashboardWindowCell>
              <MonoLabel size="cell">Percentilă</MonoLabel>
              <div className="mt-3 font-mono text-[44px] font-semibold leading-none tracking-[-0.04em] text-fg">
                87.4
              </div>
              <PercentBar value={87} className="mt-4" />
              <div className="mt-2.5 font-mono text-[10.5px] text-fg-mute">
                2.747 / 3.142 sub tine
              </div>
            </DashboardWindowCell>

            <DashboardWindowCell>
              <MonoLabel size="cell">Timp folosit</MonoLabel>
              <div className="mt-3 font-mono text-[36px] font-medium leading-none tracking-[-0.03em] text-fg">
                2:31
                <span className="text-fg-mute">/3:00</span>
              </div>
              <div className="mt-4 flex gap-[2px]">
                {Array.from({ length: 10 }).map((_, i) => (
                  <span
                    key={i}
                    className={
                      "h-[18px] flex-1 rounded-[1px] " +
                      (i < 8 ? "bg-neon-2" : "bg-bg-3")
                    }
                  />
                ))}
              </div>
              <div className="mt-2.5 font-mono text-[10.5px] text-fg-mute">
                29 min rămase nefolosite
              </div>
            </DashboardWindowCell>

            <DashboardWindowCell colSpan={4}>
              <MonoLabel size="cell">Admiterea ta · top 4</MonoLabel>
              <div className="mt-2">
                <DataRow
                  name={
                    <span className="flex items-center gap-2.5">
                      <DataRowDot active />
                      Endodonție · UMF Carol Davila
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
                      Pedodonție · UMF Iuliu Hațieganu
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
                      Ortodonție · UMF Gr. T. Popa
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
                      Chirurgie OMF · UMF Carol Davila
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

        <Ticker
          items={[
            { label: "grile", value: "12.847" },
            { label: "simulări azi", value: "142", trend: "up" },
            { label: "media percentilă", value: "63.2" },
            { label: "best azi", value: "912" },
            {
              label: "ultima admitere",
              value: "Endodonție UMF Tg. Mureș 824",
              accent: true,
            },
          ]}
        />

        <div className="flex flex-wrap gap-3">
          <Button>Continuă simularea</Button>
          <Button variant="outline">Pauză</Button>
          <Button variant="ghost">Renunță</Button>
          <Button size="lg">Începe simularea →</Button>
          <Button variant="outline" size="lg">
            Vezi cum scorăm
          </Button>
        </div>
      </div>
    </AppShell>
  )
}
