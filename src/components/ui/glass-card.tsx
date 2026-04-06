import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Reusable glass-morphism primitive for the dashboard area.
 *
 * Layers:
 *  - subtle backdrop-blur surface
 *  - soft inner highlight (top white wash)
 *  - gradient border via mask trick (emerald -> teal -> transparent)
 *  - emerald glow on hover
 */
export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Show the animated gradient border. Defaults to true. */
  gradientBorder?: boolean
  /** Apply hover lift + glow micro-interaction. Defaults to true. */
  interactive?: boolean
  /** Padding preset. Defaults to "md". */
  padding?: "none" | "sm" | "md" | "lg"
}

const paddingMap = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      className,
      children,
      gradientBorder = true,
      interactive = true,
      padding = "md",
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "group/glass relative isolate overflow-hidden rounded-2xl",
          // Glass surface
          "bg-white/[0.04] backdrop-blur-xl",
          "border border-white/[0.08]",
          "shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_8px_32px_-12px_rgba(0,0,0,0.5)]",
          interactive &&
            "transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-emerald-400/30 hover:shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_20px_48px_-16px_rgba(16,185,129,0.25)]",
          paddingMap[padding],
          className
        )}
        {...props}
      >
        {/* Gradient border (mask trick) */}
        {gradientBorder && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl opacity-60 transition-opacity duration-300 group-hover/glass:opacity-100"
            style={{
              padding: "1px",
              background:
                "linear-gradient(135deg, rgba(16,185,129,0.55) 0%, rgba(20,184,166,0.35) 35%, rgba(255,255,255,0.04) 70%, rgba(16,185,129,0.25) 100%)",
              WebkitMask:
                "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
            }}
          />
        )}

        {/* Inner top highlight */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />

        {/* Soft emerald glow that brightens on hover */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl transition-opacity duration-500 opacity-40 group-hover/glass:opacity-80"
        />

        <div className="relative">{children}</div>
      </div>
    )
  }
)
GlassCard.displayName = "GlassCard"
