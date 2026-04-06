"use client"

import { motion } from "framer-motion"
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
  ) => (
    <motion.div
      key={opt.label}
      initial={false}
      animate={{
        scale: isSelected && !showResults ? 1.015 : 1,
      }}
      whileTap={!disabled && !showResults ? { scale: 0.985 } : undefined}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
    >
      <Label
        htmlFor={`opt-${opt.label}`}
        className={cn(
          "relative flex min-h-[44px] items-center gap-3 rounded-lg border p-3 transition-all duration-200",
          !disabled && "cursor-pointer",
          disabled && "cursor-default",
          !showResults && "hover:bg-accent active:bg-accent",
          !showResults && isSelected && "border-primary/60 bg-primary/5 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]",
          showResults && isCorrect && "border-green-500 bg-green-50 dark:bg-green-950/30",
          showResults && isWrong && "border-red-500 bg-red-50 dark:bg-red-950/30",
        )}
      >
        {control}
        <span className="flex-1 text-sm sm:text-base">
          <span className="mr-2 font-semibold">{opt.label}.</span>
          {opt.text}
        </span>
      </Label>
    </motion.div>
  )

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
