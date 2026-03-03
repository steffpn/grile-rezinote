"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Flag, Grid3X3 } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavigatorQuestion {
  id: string
  number: number
}

interface ExamNavigatorProps {
  questions: NavigatorQuestion[]
  answeredIds: Set<string>
  flaggedIds: Set<string>
  currentQuestionId: string
  onNavigate: (questionId: string) => void
}

function NavigatorGrid({
  questions,
  answeredIds,
  flaggedIds,
  currentQuestionId,
  onNavigate,
}: ExamNavigatorProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-2">
        {questions.map((q) => {
          const isAnswered = answeredIds.has(q.id)
          const isFlagged = flaggedIds.has(q.id)
          const isCurrent = q.id === currentQuestionId

          return (
            <button
              key={q.id}
              onClick={() => onNavigate(q.id)}
              className={cn(
                "flex h-10 w-full items-center justify-center rounded-md border text-sm font-medium transition-all",
                isAnswered &&
                  "border-green-500 bg-green-500/20 text-green-700 dark:text-green-300",
                isFlagged &&
                  !isAnswered &&
                  "border-yellow-500 bg-yellow-500/20 text-yellow-700 dark:text-yellow-300",
                !isAnswered &&
                  !isFlagged &&
                  "border-muted bg-muted/50 text-muted-foreground",
                isCurrent && "ring-2 ring-primary ring-offset-2"
              )}
            >
              {q.number}
            </button>
          )
        })}
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm border border-green-500 bg-green-500/20" />
          Raspuns
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm border border-yellow-500 bg-yellow-500/20" />
          Marcat
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm border bg-muted/50" />
          Neraspuns
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        {answeredIds.size}/{questions.length} raspunse
        {flaggedIds.size > 0 && `, ${flaggedIds.size} marcate`}
      </p>
    </div>
  )
}

export function ExamNavigator(props: ExamNavigatorProps) {
  const [sheetOpen, setSheetOpen] = useState(false)

  const handleNavigate = (questionId: string) => {
    props.onNavigate(questionId)
    setSheetOpen(false)
  }

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <div className="sticky top-24 space-y-3">
          <h3 className="text-sm font-semibold">Navigator</h3>
          <NavigatorGrid {...props} onNavigate={handleNavigate} />
        </div>
      </div>

      {/* Mobile bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background px-4 py-2 md:hidden">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {props.answeredIds.size}/{props.questions.length} raspunse
          </span>
          <div className="flex items-center gap-2">
            {props.flaggedIds.size > 0 && (
              <Badge variant="outline" className="gap-1">
                <Flag className="h-3 w-3" />
                {props.flaggedIds.size}
              </Badge>
            )}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Grid3X3 className="h-4 w-4" />
                  Navigator
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[60vh]">
                <SheetHeader>
                  <SheetTitle>Navigator intrebari</SheetTitle>
                </SheetHeader>
                <div className="mt-4 overflow-y-auto pb-6">
                  <NavigatorGrid {...props} onNavigate={handleNavigate} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </>
  )
}
