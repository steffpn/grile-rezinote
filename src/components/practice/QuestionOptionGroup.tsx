"use client"

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

          return (
            <Label
              key={opt.label}
              htmlFor={`opt-${opt.label}`}
              className={cn(
                "flex min-h-[44px] items-center gap-3 rounded-lg border p-3 transition-colors",
                !disabled && "cursor-pointer",
                disabled && "cursor-default",
                !showResults && "hover:bg-accent active:bg-accent",
                showResults && isCorrect && "border-green-500 bg-green-50 dark:bg-green-950/30",
                showResults && isWrong && "border-red-500 bg-red-50 dark:bg-red-950/30"
              )}
            >
              <RadioGroupItem value={opt.label} id={`opt-${opt.label}`} />
              <span
                className="flex-1 text-sm sm:text-base"
              >
                <span className="mr-2 font-semibold">{opt.label}.</span>
                {opt.text}
              </span>
            </Label>
          )
        })}
      </RadioGroup>
    )
  }

  // CM - checkboxes
  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const isSelected = selected.includes(opt.label)
        const isCorrect = correctOptions?.includes(opt.label) ?? false
        const isWrong = showResults && isSelected && !isCorrect

        return (
          <Label
            key={opt.label}
            htmlFor={`opt-${opt.label}`}
            className={cn(
              "flex min-h-[44px] items-center gap-3 rounded-lg border p-3 transition-colors",
              !disabled && "cursor-pointer",
              disabled && "cursor-default",
              !showResults && "hover:bg-accent active:bg-accent",
              showResults && isCorrect && "border-green-500 bg-green-50 dark:bg-green-950/30",
              showResults && isWrong && "border-red-500 bg-red-50 dark:bg-red-950/30"
            )}
          >
            <Checkbox
              id={`opt-${opt.label}`}
              checked={isSelected}
              onCheckedChange={(checked) => {
                if (disabled) return
                if (checked) {
                  onChange([...selected, opt.label])
                } else {
                  onChange(selected.filter((s) => s !== opt.label))
                }
              }}
              disabled={disabled}
            />
            <span
              className="flex-1 text-sm sm:text-base"
            >
              <span className="mr-2 font-semibold">{opt.label}.</span>
              {opt.text}
            </span>
          </Label>
        )
      })}
    </div>
  )
}
