"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { AlertTriangle, Download, Mail, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  deleteAccount,
  exportAccountData,
  requestEmailChange,
} from "@/lib/actions/account"

interface AccountManagementProps {
  email: string
}

export function AccountManagement({ email }: AccountManagementProps) {
  return (
    <div className="space-y-6">
      <ChangeEmailCard currentEmail={email} />
      <ExportDataCard />
      <DeleteAccountCard email={email} />
    </div>
  )
}

function ChangeEmailCard({ currentEmail }: { currentEmail: string }) {
  const [newEmail, setNewEmail] = useState("")
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!newEmail.trim()) return
    startTransition(async () => {
      const result = await requestEmailChange({ newEmail: newEmail.trim() })
      if (result.success) {
        toast.success("Verifica adresa noua", {
          description: `Am trimis un email de confirmare la ${newEmail.trim()}. Linkul este valabil 1 ora.`,
        })
        setNewEmail("")
      } else {
        toast.error("Nu s-a putut trimite", { description: result.error })
      }
    })
  }

  return (
    <section className="space-y-4 rounded-xl border bg-card p-6">
      <div className="flex items-start gap-3">
        <Mail className="mt-0.5 h-5 w-5 text-muted-foreground" />
        <div>
          <h2 className="text-base font-semibold">Schimba adresa de email</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Iti trimitem un link de confirmare la noua adresa. Schimbarea se
            aplica abia dupa ce confirmi.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="newEmail" className="text-xs">
            Noua adresa de email
          </Label>
          <Input
            id="newEmail"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder={currentEmail}
            disabled={pending}
          />
        </div>
        <Button type="submit" disabled={pending || !newEmail.trim()}>
          {pending ? "Se trimite..." : "Trimite link de confirmare"}
        </Button>
      </form>
    </section>
  )
}

function ExportDataCard() {
  const [pending, startTransition] = useTransition()

  function onExport() {
    startTransition(async () => {
      try {
        const { filename, json } = await exportAccountData()
        const blob = new Blob([json], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
        toast.success("Datele tale au fost descarcate.")
      } catch {
        toast.error("Nu s-a putut genera exportul. Incearca din nou.")
      }
    })
  }

  return (
    <section className="space-y-4 rounded-xl border bg-card p-6">
      <div className="flex items-start gap-3">
        <Download className="mt-0.5 h-5 w-5 text-muted-foreground" />
        <div>
          <h2 className="text-base font-semibold">Descarca datele mele</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Primesti un fisier JSON cu profilul, abonamentul si toate sesiunile
            tale (GDPR Articolul 15 si 20).
          </p>
        </div>
      </div>

      <Button onClick={onExport} disabled={pending} variant="outline">
        {pending ? "Se pregateste..." : "Descarca toate datele (JSON)"}
      </Button>
    </section>
  )
}

function DeleteAccountCard({ email }: { email: string }) {
  const [open, setOpen] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState("")
  const [pending, startTransition] = useTransition()

  function onConfirm() {
    startTransition(async () => {
      const result = await deleteAccount({ confirmEmail })
      if (result.success) {
        // Server already signed us out. Send to homepage with a notice.
        window.location.href = "/?account=deleted"
      } else {
        toast.error("Nu s-a putut sterge contul", {
          description: result.error,
        })
      }
    })
  }

  return (
    <section className="space-y-4 rounded-xl border border-red-500/30 bg-red-500/5 p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-red-500" />
        <div>
          <h2 className="text-base font-semibold text-red-600 dark:text-red-400">
            Sterge contul definitiv
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Toate datele tale (sesiuni, raspunsuri, abonament) se sterg
            ireversibil. Daca ai un abonament activ, va fi anulat imediat —
            fara perioada de gratie.
          </p>
        </div>
      </div>

      {!open ? (
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Sterge contul
        </Button>
      ) : (
        <div className="space-y-3 rounded-lg border border-red-300/40 bg-background/40 p-4">
          <div className="space-y-2">
            <Label htmlFor="confirmEmail" className="text-xs">
              Pentru a confirma, scrie adresa de email:{" "}
              <strong>{email}</strong>
            </Label>
            <Input
              id="confirmEmail"
              type="email"
              autoComplete="off"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              disabled={pending}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={onConfirm}
              disabled={
                pending ||
                confirmEmail.trim().toLowerCase() !== email.toLowerCase()
              }
              className="bg-red-600 hover:bg-red-700"
            >
              {pending ? "Se sterge..." : "Confirm stergerea contului"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setOpen(false)
                setConfirmEmail("")
              }}
              disabled={pending}
            >
              Renunta
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
