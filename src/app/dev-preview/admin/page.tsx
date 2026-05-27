/**
 * Dev preview: pagina /admin/chapters cu mock data — chapter list cu
 * drag-and-drop, stat chips, subchapters expandable.
 */
"use client"

import { BookOpen, CheckCircle2, HelpCircle, ListChecks } from "lucide-react"

import {
  AppShell,
  type NavLink,
} from "@/components/shared/app-shell"
import { ChapterList } from "@/components/admin/chapter-list"
import { MonoLabel, SectionTag } from "@/components/branded"

const adminLinks: NavLink[] = [
  { href: "/admin", label: "Sumar" },
  { href: "/admin/chapters", label: "Capitole" },
  { href: "/admin/questions", label: "Întrebări" },
  { href: "/admin/import-export", label: "Import / Export" },
  { href: "/admin/specialties", label: "Specialități" },
  { href: "/admin/admission-data", label: "Date admitere" },
  { href: "/admin/settings", label: "Setări" },
  { href: "/dashboard", label: "← Înapoi la student" },
]

const mockChapters = [
  {
    id: "1",
    name: "Endodonție",
    description: "Tratament canalar, diagnostic pulpar, microbiologie",
    sortOrder: 1,
    archivedAt: null,
    questionCount: 234,
    csCount: 87,
    cmCount: 147,
    subchapters: [
      { name: "Anatomie endodontică", count: 32 },
      { name: "Diagnostic pulpar", count: 48 },
      { name: "Tratament canalar", count: 89 },
      { name: "Patologie periapicală", count: 65 },
    ],
  },
  {
    id: "2",
    name: "Pedodonție",
    description: "Stomatologie pediatrică",
    sortOrder: 2,
    archivedAt: null,
    questionCount: 178,
    csCount: 64,
    cmCount: 114,
    subchapters: [],
  },
  {
    id: "3",
    name: "Ortodonție",
    description: null,
    sortOrder: 3,
    archivedAt: null,
    questionCount: 156,
    csCount: 52,
    cmCount: 104,
    subchapters: [
      { name: "Diagnostic ortodontic", count: 41 },
      { name: "Aparate fixe", count: 56 },
      { name: "Aparate mobile", count: 59 },
    ],
  },
  {
    id: "4",
    name: "Chirurgie OMF",
    description: "Chirurgie orală și maxilo-facială",
    sortOrder: 4,
    archivedAt: null,
    questionCount: 142,
    csCount: 48,
    cmCount: 94,
    subchapters: [],
  },
  {
    id: "5",
    name: "Protetică dentară",
    description: null,
    sortOrder: 5,
    archivedAt: null,
    questionCount: 198,
    csCount: 71,
    cmCount: 127,
    subchapters: [],
  },
  {
    id: "6",
    name: "Parodontologie",
    description: "Boli parodontale, terapie",
    sortOrder: 6,
    archivedAt: null,
    questionCount: 167,
    csCount: 59,
    cmCount: 108,
    subchapters: [],
  },
]

export default function AdminPreview() {
  return (
    <AppShell
      links={adminLinks}
      userEmail="admin@grile-rezinote.ro"
      context="admin"
      isAdmin
    >
      <div className="space-y-10">
        {/* Sumar dashboard */}
        <div>
          <SectionTag>Admin · sumar</SectionTag>
          <h1 className="mt-3 text-[34px] font-bold leading-[1.05] tracking-[-0.03em] text-fg">
            Conținutul platformei.
          </h1>
          <p className="mt-3 max-w-[520px] text-[15px] leading-[1.55] text-fg-dim">
            Capitole, întrebări, praguri de admitere — tot ce alimentează
            platforma trece prin pagina aceasta.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Capitole", value: 6, sub: "active · publice", icon: BookOpen, tone: "accent" },
            { label: "Total întrebări", value: 1075, sub: "active", icon: HelpCircle, tone: "default" },
            { label: "Complement simplu", value: 381, sub: "1 răspuns corect", icon: CheckCircle2, tone: "accent" },
            { label: "Complement multiplu", value: 694, sub: "2-4 răspunsuri", icon: ListChecks, tone: "warm" },
          ].map((card) => {
            const Icon = card.icon
            return (
              <div key={card.label} className="rounded-[12px] border border-line bg-bg-2 p-5">
                <div className="flex items-center justify-between">
                  <MonoLabel size="cell">{card.label}</MonoLabel>
                  <span className={card.tone === "accent" ? "text-neon" : card.tone === "warm" ? "text-warm" : "text-fg-mute"}>
                    <Icon className="size-4" />
                  </span>
                </div>
                <div className="mt-3 font-mono text-[36px] font-semibold leading-none tracking-[-0.04em] text-fg">
                  {card.value.toLocaleString("ro-RO")}
                </div>
                <div className="mt-2 font-mono text-[10.5px] tracking-mono-tight text-fg-mute">
                  {card.sub}
                </div>
              </div>
            )
          })}
        </div>

        {/* Chapters section */}
        <div className="space-y-6">
          <div>
            <SectionTag>Capitole</SectionTag>
            <h2 className="mt-3 text-[28px] font-bold leading-[1.05] tracking-[-0.03em] text-fg">
              Coloana vertebrală a băncii.
            </h2>
            <p className="mt-3 max-w-[520px] text-[15px] leading-[1.55] text-fg-dim">
              Trage de mâner pentru a reordona.
            </p>
          </div>
          <ChapterList chapters={mockChapters} />
        </div>
      </div>
    </AppShell>
  )
}
