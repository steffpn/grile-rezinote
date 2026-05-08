import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Input — aliniat la design tokens spec.
 *
 * Spec auth & form fields: `bg-bg-3` border `--line` radius 7px, focus border
 * `--neon`. Pentru contexte dense (admin tables, filters) folosește `size-sm`
 * via className override.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // base
        "h-10 w-full min-w-0 rounded-[7px] border border-line bg-bg-3 px-3 py-2 text-[14px] text-fg",
        "transition-[color,box-shadow,border-color] outline-none",
        "placeholder:text-fg-mute",
        "selection:bg-neon/30 selection:text-fg",
        // file input
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-fg",
        // disabled
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        // focus
        "focus-visible:border-neon focus-visible:ring-2 focus-visible:ring-neon/25",
        // invalid
        "aria-invalid:border-danger aria-invalid:ring-2 aria-invalid:ring-danger/20",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
