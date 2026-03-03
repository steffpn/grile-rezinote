"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createChapter, updateChapter } from "@/lib/actions/chapters"

interface ChapterFormProps {
  chapter?: { id: string; name: string; description: string | null }
  open: boolean
  onClose: () => void
}

export function ChapterForm({ chapter, open, onClose }: ChapterFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const isEditing = !!chapter

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setErrors({})

    try {
      const result = isEditing
        ? await updateChapter(chapter.id, formData)
        : await createChapter(formData)

      if (result && "error" in result && result.error) {
        setErrors(result.error as Record<string, string[]>)
      } else {
        onClose()
        window.location.reload()
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editeaza Capitol" : "Capitol Nou"}
          </DialogTitle>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nume</Label>
            <Input
              id="name"
              name="name"
              defaultValue={chapter?.name ?? ""}
              placeholder="ex: Anatomie"
              required
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descriere (optional)</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={chapter?.description ?? ""}
              placeholder="Descriere scurta a capitolului..."
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description[0]}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Anuleaza
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Se salveaza..."
                : isEditing
                  ? "Salveaza"
                  : "Creeaza"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
