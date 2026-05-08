/**
 * Dev preview: QuestionCard cu states (default / answered correct / answered
 * wrong / showResults) pentru visual QA.
 */
"use client"

import { useState } from "react"

import {
  AppShell,
  type NavLink,
} from "@/components/shared/app-shell"
import { QuestionCard } from "@/components/practice/QuestionCard"
import { Button } from "@/components/ui/button"
import { MonoLabel, SectionTag } from "@/components/branded"

const studentLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", requiredTier: "PRO" },
  { href: "/practice", label: "Teste practice", requiredTier: "FREE" },
  { href: "/exam", label: "Simulare", requiredTier: "PRO" },
  { href: "/practice/mistakes", label: "Greșelile mele", requiredTier: "PRO" },
  { href: "/admission", label: "Admitere", requiredTier: "PREMIUM", locked: true },
  { href: "/subscription", label: "Abonament", requiredTier: "FREE" },
]

const sampleQuestion = {
  id: "q-001",
  text: "Care dintre următoarele caracteristici este specifică unei pulpite acute purulente focale?",
  type: "CM" as const,
  subchapter: "Endodonție · Capitol 4",
  options: [
    { label: "A", text: "Durere spontană, intermitentă, ușor localizată" },
    { label: "B", text: "Durere provocată de termic, dispare la îndepărtarea stimulului" },
    {
      label: "C",
      text: "Durere acuta cu iradiere și agravare nocturnă",
    },
    {
      label: "D",
      text: "Durere care se calmează la termic rece",
    },
    {
      label: "E",
      text: "Test de vitalitate negativ",
    },
  ],
}

export default function PracticeQuestionPreview() {
  const [selected, setSelected] = useState<string[]>([])
  // Default true ca screenshot să surprindă states de verificare
  const [showResults, setShowResults] = useState(true)
  const [flagged, setFlagged] = useState(false)

  // Demonstration mode: selectează A și D din start, marchează A,C ca corecte
  // ca să vedem fix toate cele 4 states (selected-correct, selected-wrong,
  // missed-correct, neutral).
  const [demoAnswered, setDemoAnswered] = useState(true)
  // Default afișăm direct verificarea (showResults=true) ca screenshot să
  // captureze toate cele 4 states fără click.
  if (typeof window !== "undefined" && !showResults && !demoAnswered) {
    // no-op: state prepopulat
  }
  const demoSelected = demoAnswered ? ["A", "D"] : selected

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
            Question Card · states
          </h1>
          <p className="mt-3 max-w-[560px] text-[15px] leading-[1.55] text-fg-dim">
            Visual QA pentru pattern-ul de exersare. Toggle-urile arată
            tranziția între default → answered → showResults.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={!demoAnswered ? "default" : "outline"}
            onClick={() => {
              setDemoAnswered(false)
              setShowResults(false)
              setSelected([])
            }}
          >
            Stare 1 · default
          </Button>
          <Button
            size="sm"
            variant={demoAnswered && !showResults ? "default" : "outline"}
            onClick={() => {
              setDemoAnswered(true)
              setShowResults(false)
            }}
          >
            Stare 2 · selectat A+D
          </Button>
          <Button
            size="sm"
            variant={demoAnswered && showResults ? "default" : "outline"}
            onClick={() => {
              setDemoAnswered(true)
              setShowResults(true)
            }}
          >
            Stare 3 · verificat (greșit)
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-3">
              <MonoLabel size="cell">Variantă activă</MonoLabel>
            </div>
            <QuestionCard
              question={sampleQuestion}
              questionNumber={87}
              selected={demoSelected}
              onAnswer={(_id, sel) => setSelected(sel)}
              onVerify={() => setShowResults(true)}
              onFlag={() => setFlagged(!flagged)}
              isFlagged={flagged}
              isAnswered={demoAnswered}
              feedback={
                showResults
                  ? {
                      isCorrect: false,
                      correctOptions: ["A", "C"],
                      sourceBook: "Iliescu, Endodonție",
                      sourcePage: "234",
                    }
                  : undefined
              }
              showResults={showResults}
            />
          </div>

          <div>
            <div className="mb-3">
              <MonoLabel size="cell">Variantă corectă (răspuns A)</MonoLabel>
            </div>
            <QuestionCard
              question={{
                ...sampleQuestion,
                id: "q-002",
                type: "CS",
                text: "Care este durata medie a unei simulări de examen real?",
                options: [
                  { label: "A", text: "3 ore (180 minute)" },
                  { label: "B", text: "2 ore (120 minute)" },
                  { label: "C", text: "4 ore (240 minute)" },
                  { label: "D", text: "1.5 ore (90 minute)" },
                  { label: "E", text: "5 ore (300 minute)" },
                ],
              }}
              questionNumber={88}
              selected={["A"]}
              onAnswer={() => {}}
              onFlag={() => {}}
              isFlagged={false}
              isAnswered
              feedback={{
                isCorrect: true,
                correctOptions: ["A"],
                sourceBook: "Regulamentul ministerial 2025",
                sourcePage: "art. 12",
              }}
              showResults
            />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
