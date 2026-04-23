"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Loader2, Save, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { updateProfile } from "@/lib/actions/profile"

interface Specialty {
  id: string
  name: string
}

interface ProfileFormProps {
  initial: {
    fullName: string
    email: string
    yearOfStudy: number | null
    graduationYear: number | null
    targetScore: number | null
    targetSpecialtyIds: string[]
    marketingOptIn: boolean
    peerOptIn: boolean
  }
  specialties: Specialty[]
}

export function ProfileForm({ initial, specialties }: ProfileFormProps) {
  const [fullName, setFullName] = useState(initial.fullName)
  const [yearOfStudy, setYearOfStudy] = useState<number | null>(
    initial.yearOfStudy
  )
  const [graduationYear, setGraduationYear] = useState<string>(
    initial.graduationYear?.toString() ?? ""
  )
  const [targetScore, setTargetScore] = useState<string>(
    initial.targetScore?.toString() ?? ""
  )
  const [targetSpecialtyIds, setTargetSpecialtyIds] = useState<string[]>(
    initial.targetSpecialtyIds ?? []
  )
  const [marketingOptIn, setMarketingOptIn] = useState(initial.marketingOptIn)
  const [peerOptIn, setPeerOptIn] = useState(initial.peerOptIn)
  const [pending, startTransition] = useTransition()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  function toggleSpecialty(id: string) {
    setTargetSpecialtyIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFieldErrors({})

    startTransition(async () => {
      const result = await updateProfile({
        fullName: fullName.trim(),
        yearOfStudy: yearOfStudy ?? null,
        graduationYear: graduationYear ? Number(graduationYear) : null,
        targetScore: targetScore ? Number(targetScore) : null,
        targetSpecialtyIds,
        marketingOptIn,
        peerOptIn,
      })

      if (result.success) {
        toast.success("Profil actualizat", {
          description: "Modificarile au fost salvate.",
          icon: <Check className="h-4 w-4" />,
        })
      } else {
        if (result.fieldErrors) setFieldErrors(result.fieldErrors)
        toast.error("Nu s-a putut salva", {
          description: result.error,
        })
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {/* Identity */}
      <section className="space-y-4 rounded-xl border bg-card p-6">
        <div>
          <h2 className="text-base font-semibold">Detalii personale</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Informatii de baza despre tine
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nume complet</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              maxLength={120}
            />
            {fieldErrors.fullName && (
              <p className="text-xs text-destructive">
                {fieldErrors.fullName[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={initial.email}
              disabled
              className="bg-muted/40"
            />
            <p className="text-xs text-muted-foreground">
              Email-ul nu poate fi modificat
            </p>
          </div>
        </div>
      </section>

      {/* Studies */}
      <section className="space-y-4 rounded-xl border bg-card p-6">
        <div>
          <h2 className="text-base font-semibold">Studii</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Anul curent si planificarea absolvirii
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="yearOfStudy">Anul de studiu</Label>
            <select
              id="yearOfStudy"
              value={yearOfStudy ?? ""}
              onChange={(e) =>
                setYearOfStudy(e.target.value ? Number(e.target.value) : null)
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">—</option>
              {[1, 2, 3, 4, 5, 6].map((y) => (
                <option key={y} value={y}>
                  Anul {y}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="graduationYear">Anul absolvirii (estimat)</Label>
            <Input
              id="graduationYear"
              type="number"
              inputMode="numeric"
              min={new Date().getFullYear() - 1}
              max={new Date().getFullYear() + 10}
              value={graduationYear}
              onChange={(e) => setGraduationYear(e.target.value)}
              placeholder="ex. 2027"
            />
            {fieldErrors.graduationYear && (
              <p className="text-xs text-destructive">
                {fieldErrors.graduationYear[0]}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Goals */}
      <section className="space-y-4 rounded-xl border bg-card p-6">
        <div>
          <h2 className="text-base font-semibold">
            Obiectivele tale pentru Rezidentiat
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Foloseste aceste campuri pentru a-ti urmari progresul in modul
            Admitere (PREMIUM)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetScore">Scor tinta (0 — 950)</Label>
          <Input
            id="targetScore"
            type="number"
            inputMode="numeric"
            min={0}
            max={950}
            value={targetScore}
            onChange={(e) => setTargetScore(e.target.value)}
            placeholder="ex. 750"
            className="max-w-[200px]"
          />
          <p className="text-xs text-muted-foreground">
            Scorul pe care il tintesti la simulari
          </p>
          {fieldErrors.targetScore && (
            <p className="text-xs text-destructive">
              {fieldErrors.targetScore[0]}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Specialitati de interes (max 10)</Label>
          {specialties.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Nicio specialitate disponibila momentan.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {specialties.map((s) => {
                const selected = targetSpecialtyIds.includes(s.id)
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSpecialty(s.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      selected
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "border-border bg-background hover:bg-accent"
                    }`}
                  >
                    {selected && <Check className="h-3 w-3" />}
                    {s.name}
                  </button>
                )
              })}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {targetSpecialtyIds.length}/10 selectate · dau click sa adaugi sau sa scoti
          </p>
        </div>
      </section>

      {/* Preferences */}
      <section className="space-y-4 rounded-xl border bg-card p-6">
        <div>
          <h2 className="text-base font-semibold">Preferinte</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Comunicari si participare la clasamente
          </p>
        </div>

        <div className="flex items-start justify-between gap-4 rounded-lg border border-border/60 p-4">
          <div className="min-w-0 flex-1">
            <Label
              htmlFor="marketingOptIn"
              className="text-sm font-medium"
            >
              Newsletter si comunicari de marketing
            </Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Primesti sfaturi de invatare, noutati despre platforma si oferte
              speciale. Poti dezactiva oricand.
            </p>
          </div>
          <Switch
            id="marketingOptIn"
            checked={marketingOptIn}
            onCheckedChange={setMarketingOptIn}
          />
        </div>

        <div className="flex items-start justify-between gap-4 rounded-lg border border-border/60 p-4">
          <div className="min-w-0 flex-1">
            <Label htmlFor="peerOptIn" className="text-sm font-medium">
              Participare anonima la clasament
            </Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Apari in clasamentul PREMIUM cu scorul tau, dar fara nume sau
              email. Opt-in pur voluntar.
            </p>
          </div>
          <Switch
            id="peerOptIn"
            checked={peerOptIn}
            onCheckedChange={setPeerOptIn}
          />
        </div>
      </section>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="submit" disabled={pending} className="min-w-[160px]">
          {pending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Se salveaza...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salveaza profilul
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
