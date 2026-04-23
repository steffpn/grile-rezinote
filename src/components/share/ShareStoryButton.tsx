"use client"

import { useState, useRef, useEffect } from "react"
import {
  Share2,
  Download,
  Loader2,
  Instagram,
  Sparkles,
  X,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"

interface ShareStoryButtonProps {
  attemptId: string
  /** Text to display on the trigger button. */
  label?: string
  /** Visual variant. `hero` uses a gradient branded look; `subtle` is inline. */
  variant?: "hero" | "subtle"
}

/**
 * Opens a preview modal with the generated Instagram-story card and exposes
 * download + native share (Web Share API) actions. The image itself is
 * rendered by /api/share/attempt/[attemptId] as a 1080x1920 PNG.
 */
export function ShareStoryButton({
  attemptId,
  label = "Exportă pentru social media",
  variant = "hero",
}: ShareStoryButtonProps) {
  const [open, setOpen] = useState(false)
  const [loadedBlob, setLoadedBlob] = useState<Blob | null>(null)
  const [loading, setLoading] = useState(false)
  const [canNativeShare, setCanNativeShare] = useState(false)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const imageUrl = `/api/share/attempt/${attemptId}`

  // Detect Web Share API with file support on mount (client-only).
  useEffect(() => {
    if (typeof navigator === "undefined") return
    const fakeFile = new File([""], "probe.png", { type: "image/png" })
    setCanNativeShare(
      typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [fakeFile] })
    )
  }, [])

  // Prefetch the blob when the modal opens so "Download" / "Share" feel instant.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    async function loadBlob() {
      setLoading(true)
      try {
        const res = await fetch(imageUrl, { cache: "no-store" })
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
        const blob = await res.blob()
        if (!cancelled) setLoadedBlob(blob)
      } catch (err) {
        if (!cancelled) {
          toast.error("Nu s-a putut genera imaginea", {
            description: err instanceof Error ? err.message : "Încearcă din nou.",
          })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadBlob()
    return () => {
      cancelled = true
    }
  }, [open, imageUrl])

  async function handleDownload() {
    const blob =
      loadedBlob ?? (await fetch(imageUrl).then((r) => r.blob()))
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `rezinote-${attemptId.slice(0, 8)}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Imaginea a fost descărcată", {
      icon: <Check className="h-4 w-4" />,
    })
  }

  async function handleNativeShare() {
    if (!loadedBlob) return
    const file = new File([loadedBlob], `rezinote-${attemptId.slice(0, 8)}.png`, {
      type: "image/png",
    })
    try {
      await navigator.share({
        files: [file],
        title: "Rezultatul meu pe ReziNOTE",
        text: "Pregătire pentru rezidențiat pe grile-rezinote.ro",
      })
    } catch (err) {
      // User dismissed share sheet — don't show a scary error.
      if ((err as Error).name !== "AbortError") {
        toast.error("Nu s-a putut deschide fereastra de share", {
          description: "Descarcă imaginea și încarc-o manual.",
        })
      }
    }
  }

  const triggerClass =
    variant === "hero"
      ? "group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5"
      : "inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className={triggerClass}>
          <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12" />
          {label}
        </button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="max-w-md overflow-hidden border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 p-0 text-white sm:max-w-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
              <Instagram className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold">
                Distribuie rezultatul
              </h2>
              <p className="text-[11px] text-white/50">
                Instagram Stories · 1080 × 1920
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
            aria-label="Închide"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Preview */}
        <div className="flex items-center justify-center bg-black/40 p-5">
          <div className="relative aspect-[9/16] w-full max-w-[280px] overflow-hidden rounded-2xl bg-black shadow-2xl">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
              </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Preview card social media"
              className="h-full w-full object-cover"
              onLoad={() => setLoading(false)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 border-t border-white/10 bg-black/20 px-5 py-4">
          {canNativeShare && (
            <Button
              type="button"
              onClick={handleNativeShare}
              disabled={loading || !loadedBlob}
              className="h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:brightness-110"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Distribuie
            </Button>
          )}
          <Button
            type="button"
            variant={canNativeShare ? "outline" : "default"}
            onClick={handleDownload}
            disabled={loading}
            className={
              canNativeShare
                ? "h-11 rounded-xl border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                : "h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
            }
          >
            <Download className="mr-2 h-4 w-4" />
            Descarcă imaginea
          </Button>

          <p className="mt-1 text-center text-[11px] text-white/40">
            Salvează în galerie și urcă în story-ul tău de Instagram, Facebook
            sau WhatsApp.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
