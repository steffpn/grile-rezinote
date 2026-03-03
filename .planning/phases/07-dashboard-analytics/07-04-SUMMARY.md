---
phase: 07-dashboard-analytics
plan: 04
subsystem: ui
tags: [chapters, trends, sparkline, heatmap, recharts, server-components]

requires:
  - phase: 07-dashboard-analytics
    provides: Data layer (Plan 01) and chart components (Plan 02)
provides:
  - Per-chapter statistics page with expandable cards, sparklines, and heatmap
  - Trends analysis page with 7d/30d/90d trend charts and direction indicators
affects: [08-peer-comparison]

tech-stack:
  added: []
  patterns: [expandable card with CSS max-height transition, trend direction computation]

key-files:
  created:
    - src/components/dashboard/chapter-card.tsx
    - src/app/(student)/dashboard/chapters/page.tsx
    - src/app/(student)/dashboard/trends/page.tsx
  modified: []

key-decisions:
  - "Chapters sorted by accuracy ascending (weakest first) to highlight areas needing work"
  - "Sparkline data computed from heatmap data (no extra query) to reduce DB calls"
  - "Trend direction: compare first-half vs second-half average accuracy, threshold +/-2%"
  - "Chapter card expand/collapse uses CSS max-height transition (not Radix Collapsible)"

patterns-established:
  - "Expandable card pattern: useState toggle + CSS max-height transition for smooth animation"
  - "Sparkline data derivation: group heatmap data by chapterId to create per-chapter trend"
  - "Trend direction computation: split data in half, compare averages"

requirements-completed: [DASH-02, DASH-03, DASH-05]

duration: 15min
completed: 2026-03-03
---

# Plan 07-04: Chapter Stats & Trends Pages Summary

**Per-chapter expandable cards sorted by weakness with sparklines and heatmap, plus 3-period trend analysis (7d/30d/90d) with direction indicators**

## Performance

- **Duration:** 15 min
- **Tasks:** 2
- **Files created:** 3

## Accomplishments
- Expandable chapter cards with accuracy badge (color-coded), question count, sparkline in expanded view
- Chapters sorted weakest-first to guide study focus
- GitHub-contribution-style heatmap showing chapter x time accuracy grid
- Trends page with 3 time periods (7-day, 30-day, 90-day) each in separate cards
- Trend direction indicators: "In crestere" (green), "In scadere" (orange), "Stabila" (neutral)
- Data type toggle for filtering by practice/simulation/all

## Task Commits

1. **Task 1: Chapter card component and chapters page** - `0dbfcca` (feat)
2. **Task 2: Trends analysis page** - `0dbfcca` (feat)

## Files Created/Modified
- `src/components/dashboard/chapter-card.tsx` - Expandable chapter stats card with sparkline
- `src/app/(student)/dashboard/chapters/page.tsx` - Chapter stats with cards grid + heatmap
- `src/app/(student)/dashboard/trends/page.tsx` - 3-period trend charts with direction

## Decisions Made
- Computed sparkline data per-chapter from heatmap data to avoid extra database queries
- Used CSS max-height transition for expand/collapse (simpler than adding Radix Collapsible)
- Trend direction threshold: +/-2% difference between first/second half to avoid noise

## Deviations from Plan
None - plan executed as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All visualization pages complete except answer history (Plan 05)
- Students can now view per-chapter weaknesses and performance trends

---
*Phase: 07-dashboard-analytics*
*Completed: 2026-03-03*
