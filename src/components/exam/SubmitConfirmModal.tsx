"use client"

import { AlertTriangle, Send } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MonoLabel } from "@/components/branded"

interface SubmitConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  unansweredCount: number
  totalQuestions: number
  isSubmitting: boolean
}

export function SubmitConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  unansweredCount,
  totalQuestions,
  isSubmitting,
}: SubmitConfirmModalProps) {
  const answeredCount = totalQuestions - unansweredCount
  const hasUnanswered = unansweredCount > 0

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-line bg-bg-2 sm:max-w-[440px]">
        <DialogHeader>
          <div className="mb-2 flex items-center gap-2">
            <span
              className={`grid size-8 place-items-center rounded-full ${
                hasUnanswered ? "bg-warm/14 text-warm" : "bg-neon/14 text-neon"
              }`}
            >
              {hasUnanswered ? (
                <AlertTriangle className="size-4" />
              ) : (
                <Send className="size-4" />
              )}
            </span>
            <MonoLabel size="cell">Confirmare submit</MonoLabel>
          </div>
          <DialogTitle className="text-[20px] font-bold tracking-[-0.02em] text-fg">
            {hasUnanswered ? "Trimite oricum?" : "Trimite examenul?"}
          </DialogTitle>
          <DialogDescription className="text-[14px] leading-[1.55] text-fg-dim">
            {hasUnanswered ? (
              <>
                Ai răspuns la{" "}
                <strong className="text-fg">
                  {answeredCount}/{totalQuestions}
                </strong>{" "}
                întrebări.{" "}
                <strong className="text-warm">
                  {unansweredCount} {unansweredCount === 1 ? "neselectată" : "nealese"}
                </strong>
                . După submit nu mai poți reveni.
              </>
            ) : (
              <>
                Ai răspuns la toate cele{" "}
                <strong className="text-fg">{totalQuestions}</strong>{" "}
                întrebări. Submit-ul este irevocabil.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2 gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Anulează
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            <Send className="size-4" />
            {isSubmitting ? "Se trimite..." : "Trimite examenul"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
