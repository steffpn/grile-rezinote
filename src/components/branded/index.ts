/**
 * components/branded — pattern-uri compoziționale specifice identității
 * grile-ReziNOTE, derivate din `design_handoff_landing/landing-final.html`.
 *
 * Diferit de `components/ui/` (shadcn primitives), aceste componente sunt
 * compoziționale și brand-specifice: chrome de dashboard IDE-style, badges
 * pentru deltas, eyebrow-uri mono, ticker live, heatmap streak etc.
 *
 * Toate folosesc tokens din `globals.css` (oklch dark teal + neon mint) și
 * sunt server-component-friendly (no `"use client"` directive — interactive
 * children rămân în consumer).
 */

export { MonoLabel, monoLabelVariants, type MonoLabelProps } from "./mono-label"
export { SectionTag, type SectionTagProps } from "./section-tag"
export { Eyebrow, type EyebrowProps } from "./eyebrow"
export { ScorePill, scorePillVariants, type ScorePillProps } from "./score-pill"
export {
  DataRow,
  DataRowDot,
  type DataRowProps,
  type DataRowDotProps,
} from "./data-row"
export {
  PercentBar,
  SegmentBar,
  type PercentBarProps,
  type SegmentBarProps,
} from "./percent-bar"
export { Heatmap, type HeatmapProps } from "./heatmap"
export { Ticker, type TickerProps, type TickerItem } from "./ticker"
export {
  DashboardWindow,
  DashboardWindowGrid,
  DashboardWindowCell,
  type DashboardWindowProps,
  type DashboardWindowTab,
  type DashboardWindowGridProps,
  type DashboardWindowCellProps,
} from "./dashboard-window"
