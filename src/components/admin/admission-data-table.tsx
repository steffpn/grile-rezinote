"use client"

import { useMemo, useState } from "react"
import { Plus, Pencil, Trash2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  createAdmissionEntry,
  updateAdmissionEntry,
  deleteAdmissionEntry,
} from "@/lib/actions/admission"

interface AdmissionEntry {
  id: string
  specialtyId: string
  specialtyName: string
  umf: string | null
  year: number
  thresholdScore: number
  availableSpots: number
}

interface SpecialtyOption {
  id: string
  name: string
}

interface AdmissionDataTableProps {
  entries: AdmissionEntry[]
  specialties: SpecialtyOption[]
  umfs: string[]
}

const ALL = "all"

export function AdmissionDataTable({
  entries: initialEntries,
  specialties,
  umfs,
}: AdmissionDataTableProps) {
  const [entries, setEntries] = useState(initialEntries)
  const [formOpen, setFormOpen] = useState(false)
  const [editEntry, setEditEntry] = useState<AdmissionEntry | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  // Filters
  const [filterSpecialty, setFilterSpecialty] = useState<string>(ALL)
  const [filterUmf, setFilterUmf] = useState<string>(ALL)
  const [filterYear, setFilterYear] = useState<string>(ALL)
  const [search, setSearch] = useState("")

  const years = useMemo(
    () => [...new Set(entries.map((e) => e.year))].sort((a, b) => b - a),
    [entries],
  )

  const filteredEntries = useMemo(() => {
    const term = search.trim().toLowerCase()
    return entries.filter((e) => {
      if (filterSpecialty !== ALL && e.specialtyId !== filterSpecialty)
        return false
      if (filterUmf !== ALL && (e.umf ?? "") !== filterUmf) return false
      if (filterYear !== ALL && e.year !== parseInt(filterYear)) return false
      if (term) {
        const hay = `${e.specialtyName} ${e.umf ?? ""}`.toLowerCase()
        if (!hay.includes(term)) return false
      }
      return true
    })
  }, [entries, filterSpecialty, filterUmf, filterYear, search])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    const formData = new FormData(e.currentTarget)
    const data = {
      specialtyId: formData.get("specialtyId") as string,
      umf: (formData.get("umf") as string)?.trim() ?? "",
      year: parseInt(formData.get("year") as string),
      thresholdScore: parseInt(formData.get("thresholdScore") as string),
      availableSpots: parseInt(formData.get("availableSpots") as string),
    }

    try {
      const result = editEntry
        ? await updateAdmissionEntry(editEntry.id, data)
        : await createAdmissionEntry(data)

      if (result && "error" in result && result.error) {
        setErrors(result.error as Record<string, string[]>)
      } else {
        setFormOpen(false)
        setEditEntry(null)
        window.location.reload()
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Esti sigur ca vrei sa stergi aceasta intrare?")) return
    await deleteAdmissionEntry(id)
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  function resetFilters() {
    setFilterSpecialty(ALL)
    setFilterUmf(ALL)
    setFilterYear(ALL)
    setSearch("")
  }

  const hasFilters =
    filterSpecialty !== ALL ||
    filterUmf !== ALL ||
    filterYear !== ALL ||
    search !== ""

  return (
    <div className="space-y-4">
      {/* Actions row */}
      <div className="flex items-center justify-between">
        <Button
          onClick={() => {
            setEditEntry(null)
            setFormOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Adauga Intrare
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-mute" />
          <Input
            placeholder="Caută în specialitate sau UMF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Toate specialitățile" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Toate specialitățile</SelectItem>
            {specialties.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filterUmf}
          onValueChange={setFilterUmf}
          disabled={umfs.length === 0}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue
              placeholder={
                umfs.length === 0 ? "(fără UMF)" : "Toate UMF-urile"
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Toate UMF-urile</SelectItem>
            {umfs.map((u) => (
              <SelectItem key={u} value={u}>
                {u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Toți anii" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Toți anii</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Resetează
          </Button>
        )}

        <p className="ml-auto text-[12px] text-fg-mute">
          <strong className="text-fg">{filteredEntries.length}</strong> din{" "}
          {entries.length}
        </p>
      </div>

      {/* Table */}
      {filteredEntries.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            {entries.length === 0
              ? "Nicio intrare de admitere. Adaugati date sau importati din CSV/Excel."
              : "Niciun rezultat pentru filtrele selectate."}
          </p>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Specialitate</TableHead>
                <TableHead>UMF</TableHead>
                <TableHead className="w-24">An</TableHead>
                <TableHead className="w-32">Prag admitere</TableHead>
                <TableHead className="w-32">Locuri</TableHead>
                <TableHead className="w-24">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">
                    {entry.specialtyName}
                  </TableCell>
                  <TableCell className="text-fg-dim">
                    {entry.umf ?? (
                      <span className="italic text-fg-mute">—</span>
                    )}
                  </TableCell>
                  <TableCell>{entry.year}</TableCell>
                  <TableCell>{entry.thresholdScore}</TableCell>
                  <TableCell>{entry.availableSpots}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditEntry(entry)
                          setFormOpen(true)
                        }}
                        title="Editează"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(entry.id)}
                        title="Șterge"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={formOpen}
        onOpenChange={(o) => {
          if (!o) {
            setFormOpen(false)
            setEditEntry(null)
            setErrors({})
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editEntry ? "Editează intrare" : "Intrare nouă"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="specialtyId">Specialitate</Label>
              <Select
                name="specialtyId"
                defaultValue={editEntry?.specialtyId}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectează specialitatea" />
                </SelectTrigger>
                <SelectContent>
                  {specialties.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.specialtyId && (
                <p className="text-sm text-destructive">
                  {errors.specialtyId[0]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="umf">UMF</Label>
              <Input
                id="umf"
                name="umf"
                list="umf-list"
                defaultValue={editEntry?.umf ?? ""}
                placeholder="ex: București (Carol Davila)"
                required
              />
              <datalist id="umf-list">
                {umfs.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
              {errors.umf && (
                <p className="text-sm text-destructive">{errors.umf[0]}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="year">An</Label>
                <Input
                  id="year"
                  name="year"
                  type="number"
                  min={2000}
                  max={2100}
                  defaultValue={editEntry?.year ?? new Date().getFullYear()}
                  required
                />
                {errors.year && (
                  <p className="text-sm text-destructive">{errors.year[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="availableSpots">Locuri</Label>
                <Input
                  id="availableSpots"
                  name="availableSpots"
                  type="number"
                  min={0}
                  defaultValue={editEntry?.availableSpots ?? 0}
                  placeholder="ex: 25"
                  required
                />
                {errors.availableSpots && (
                  <p className="text-sm text-destructive">
                    {errors.availableSpots[0]}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thresholdScore">Prag admitere (0-950)</Label>
              <Input
                id="thresholdScore"
                name="thresholdScore"
                type="number"
                min={0}
                max={950}
                defaultValue={editEntry?.thresholdScore ?? ""}
                placeholder="ex: 750"
                required
              />
              {errors.thresholdScore && (
                <p className="text-sm text-destructive">
                  {errors.thresholdScore[0]}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormOpen(false)
                  setEditEntry(null)
                  setErrors({})
                }}
              >
                Anulează
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? "Se salvează..."
                  : editEntry
                    ? "Salvează"
                    : "Adaugă"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
