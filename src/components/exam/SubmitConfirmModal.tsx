"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

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
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Trimite examenul?</DialogTitle>
          <DialogDescription>
            {unansweredCount > 0 ? (
              <>
                Ai{" "}
                <strong className="text-foreground">
                  {unansweredCount} intrebari neraspunse
                </strong>{" "}
                din {totalQuestions}. Esti sigur ca vrei sa trimiti examenul?
              </>
            ) : (
              <>
                Ai raspuns la toate cele {totalQuestions} intrebari. Trimite
                examenul?
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Anuleaza
          </Button>
          <Button
            variant={unansweredCount > 0 ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Se trimite..." : "Trimite examenul"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
