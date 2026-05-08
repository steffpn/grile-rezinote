"use client"

import { motion } from "framer-motion"
import { Check, X } from "lucide-react"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface Option {
  label: string
  text: string
}

interface QuestionOptionGroupProps {
  questionType: "CS" | "CM"
  options: Option[]
  selected: string[]
  onChange: (selected: string[]) => void
  disabled?: boolean
  correctOptions?: string[]
  showResults?: boolean
}

/**
 * Listă opțiuni A-E cu states clare:
 * - default → border `--line`, bg `--panel`
 * - hover → bg `--bg-3` (doar dacă nu disabled / showResults)
 * - selected (pre-verificare) → border `--neon`, bg `bg-neon/8`
 * - correct (post-verificare) → border `--neon`, bg `bg-neon/12`, glow neon
 * - wrong (post-verificare) → border `--danger`, bg `bg-danger/10`
 *
 * Spec § 8 Features (exam mock) și § 3.4 Practica.
 */
export function QuestionOptionGroup({
  questionType,
  options,
  selected,
  onChange,
  disabled = false,
  correctOptions,
  showResults = false,
}: QuestionOptionGroupProps) {
  const renderOption = (
    opt: Option,
    isSelected: boolean,
    isCorrect: boolean,
    isWrong: boolean,
    control: React.ReactNode,
  ) => {
    const showCorrect = showResults && isCorrect
    const showWrong = showResults && isWrong
    const showMissed = showResults && !isSelected && isCorrect

    return (
      <motion.div
        key={opt.label}
        initial={false}
        animate={{
          scale: isSelected && !showResults ? 1.005 : 1,
        }}
        whileTap={!disabled && !showResults ? { scale: 0.99 } : undefined}
        transition={{ type: "spring", stiffness: 420, damping: 28 }}
      >
        <Label
          htmlFor={`opt-${opt.label}`}
          className={cn(
            "relative grid min-h-[44px] items-center gap-3 rounded-[7px] border bg-panel px-3.5 py-2.5",
            "grid-cols-[24px_1fr_24px] transition-all duration-200",
            // base / hover
            !disabled && !showResults && "cursor-pointer hover:bg-bg-3",
            disabled && "cursor-default",
            // states
            !showResults &&
              isSelected &&
              "border-neon bg-neon/8",
            !showResults &&
              !isSelected &&
              "border-line",
            // correct (selected + correct)
            showCorrect &&
              isSelected &&
              "border-neon bg-neon/12 shadow-[0_0_0_1px_var(--neon)]",
            // wrong (selected + incorrect)
            showWrong && "border-danger bg-danger/10",
            // missed (not selected but correct — show with subtle neon)
            showMissed && "border-neon/60 bg-neon/6",
            // not relevant default
            showResults && !isSelected && !isCorrect && "border-line opacity-70",
          )}
        >
          {/* Control (left slot) */}
          <span className="flex size-6 items-center justify-center font-mono text-[12px] text-fg-mute">
            {opt.label}
          </span>
          {/* Hidden control for accessibility */}
          <span className="sr-only">{control}</span>

          {/* Option text */}
          <span className="text-[14px] leading-[1.5] text-fg-dim">
            <span className="text-fg">{opt.text}</span>
          </span>

          {/* Trailing indicator */}
          <span className="flex size-6 items-center justify-center">
            {showCorrect && isSelected && (
              <Check className="size-4 text-neon" aria-label="Corect" />
            )}
            {showWrong && (
              <X className="size-4 text-danger" aria-label="Greșit" />
            )}
            {showMissed && (
              <Check
                className="size-4 text-neon/70"
                aria-label="Răspuns corect ratat"
              />
            )}
            {!showResults && isSelected && (
              <span
                aria-hidden
                className="size-2 rounded-full bg-neon shadow-[0_0_6px_var(--neon)]"
              />
            )}
          </span>
        </Label>
      </motion.div>
    )
  }

  if (questionType === "CS") {
    return (
      <RadioGroup
        value={selected[0] ?? ""}
        onValueChange={(val) => onChange([val])}
        disabled={disabled}
        className="space-y-2"
      >
        {options.map((opt) => {
          const isSelected = selected.includes(opt.label)
          const isCorrect = correctOptions?.includes(opt.label) ?? false
          const isWrong = showResults && isSelected && !isCorrect
          return renderOption(
            opt,
            isSelected,
            isCorrect,
            isWrong,
            <RadioGroupItem value={opt.label} id={`opt-${opt.label}`} />,
          )
        })}
      </RadioGroup>
    )
  }

  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const isSelected = selected.includes(opt.label)
        const isCorrect = correctOptions?.includes(opt.label) ?? false
        const isWrong = showResults && isSelected && !isCorrect
        return renderOption(
          opt,
          isSelected,
          isCorrect,
          isWrong,
          <Checkbox
            id={`opt-${opt.label}`}
            checked={isSelected}
            onCheckedChange={(checked) => {
              if (disabled) return
              if (checked) onChange([...selected, opt.label])
              else onChange(selected.filter((s) => s !== opt.label))
            }}
            disabled={disabled}
          />,
        )
      })}
    </div>
  )
}
