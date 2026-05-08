import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Button — aliniat la design tokens spec (vezi `design_handoff_landing/`).
 *
 * Variants:
 * - `default`  primary CTA (`bg-neon` text-bg, semibold, neon glow shadow, lighten on hover)
 * - `outline`  border `--line-2`, transparent, hover `--bg-2`
 * - `secondary` panel `--bg-2` cu border `--line`
 * - `ghost`    text-only, `--fg-dim` -> `--fg` la hover
 * - `link`     text-neon, underline-on-hover
 * - `destructive` `--danger` solid
 *
 * Sizes (aliniate la spec):
 * - `default` 36px h, padding 9/16, font 13.5
 * - `lg`      44px h, padding 13/22, font 14, radius 10  ← CTA mari (hero, pricing, final)
 * - `sm/xs`   compact pentru toolbars / chip groups
 * - `icon-*`  pătrate pentru icoane
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-neon/40 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-neon text-bg font-semibold shadow-neon-glow hover:bg-[oklch(0.88_0.21_162)] hover:shadow-[0_10px_32px_-10px_oklch(0.84_0.21_162/0.75)] active:translate-y-[1px]",
        destructive:
          "bg-danger text-fg hover:bg-[oklch(0.74_0.20_25)] focus-visible:ring-destructive/40",
        outline:
          "border border-line-2 bg-transparent text-fg hover:bg-bg-2",
        secondary:
          "border border-line bg-bg-2 text-fg-dim hover:text-fg hover:bg-bg-3",
        ghost:
          "text-fg-dim hover:text-fg hover:bg-bg-2/60",
        link:
          "text-neon underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-[6px] px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-[7px] px-3 has-[>svg]:px-2.5",
        lg: "h-11 rounded-[10px] px-[22px] py-[13px] text-[14px] has-[>svg]:px-[18px]",
        icon: "size-9 rounded-[8px]",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-[7px]",
        "icon-lg": "size-10 rounded-[10px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
