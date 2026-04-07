# Mobile Audit — Student App Zone

Target breakpoints: 360 / 390 / 430 / 768. Priority = 360px must be flawless for full exam-taking.

## Findings & Fixes

### Tables (root cause of horizontal overflow at 360px)

| File | Issue | Fix |
|---|---|---|
| `src/components/dashboard/answer-history-table.tsx:138` | Table inside `rounded-2xl` wrapper has no x-scroll. With Date(96) + Intrebare(max 200) + Tip(badge) + Rezultat(badge) the content blows past 360px and pushes the page. | Add `overflow-x-auto` to wrapper. Hide `Tip` column at < sm. Reduce cell `max-w-[200px]` to allow shrink. |
| `src/components/dashboard/test-history-table.tsx:115` | Has 7 columns at fixed widths (Data 112 + Tip 96 + Intrebari 96 + Scor 96 + Acuratete 96 + action 64 = 560px). Visible at < sm. | Wrap in `overflow-x-auto`. Hide `Scor` and action col at < sm; collapse Tip into stacked sub-row. |
| `src/components/peer/leaderboard.tsx:39` | Fixed grid `grid-cols-[3rem_2.5rem_1fr_5rem_5rem]` ≈ 16rem fixed + 1fr. Tight at 360 but Tu/Participant labels can wrap. | Wrap container in `overflow-x-auto`, give inner row `min-w-[20rem]`, keep flex labels truncating. |

### Charts

| File | Issue | Fix |
|---|---|---|
| `src/components/dashboard/radar-chart.tsx:96` | Fixed height 400, font 11/10. Polar labels overflow on 360px because chapter names crop. Already truncates at 15 chars but radar font too big. | Reduce height to 320 on mobile via `aspect`. Lower polar tick fontSize to 10. Use `outerRadius="75%"`. |
| `src/components/dashboard/trend-chart.tsx:84` | `margin left -16` works but YAxis tick fontSize 11 still ok. Height 300 also ok. | No change beyond making it shrink-friendly (already ResponsiveContainer width 100%). |
| `src/components/peer/score-distribution.tsx:71` | XAxis labels `angle -45` height 60 — fine. | No change. |
| `src/components/dashboard/heat-map.tsx:82` | `gridTemplateColumns: 160px repeat(N, 1fr)` blows the page horizontally on big date ranges; already wrapped in `overflow-x-auto`. | OK; ensure parent is contained — no change needed. |

### Quiz / Exam UI

| File | Issue | Fix |
|---|---|---|
| `src/components/practice/QuestionCard.tsx:75` | `CardHeader` uses `flex-row` without `flex-wrap`. `Intrebarea N` (text-lg) + Badge + result badge + Flag toggle can overflow at 360. | Add `flex-wrap gap-2`. |
| `src/components/practice/QuizContainer.tsx:226` | Top bar has 3 items in justify-between but no wrap; "X/Y intrebari raspunse" + "i/n" + "Termina testul" overflows. | Add `flex-wrap gap-2`; make middle counter `hidden xs:inline`-ish (use `hidden sm:inline`) and shorten button label on mobile via `sm:` text. |
| `src/components/exam/ExamContainer.tsx:218` | Already `flex-wrap` — OK. Submit button text small. | OK. |
| `src/components/practice/QuestionOptionGroup.tsx:52` | Tap target min-h 44px present, fine. | OK. |

### Modals/Dialogs

| File | Issue | Fix |
|---|---|---|
| `src/components/dashboard/answer-detail-dialog.tsx:60` | `flex gap-4 text-sm` for capitol+data won't wrap; chapter names + ISO date overflow on 360. | Use `flex flex-col sm:flex-row sm:gap-4 gap-1`. Also add `max-h-[85vh] overflow-y-auto` to content. |
| `src/components/practice/ImmediateFeedbackModal.tsx:39` | OK (uses sm:max-w-md, mobile fills width). | No change. |

### Cards / Misc

| File | Issue | Fix |
|---|---|---|
| `src/components/subscription/PricingCard.tsx:44` | `p-8` is too dense on 360px. Popular badge `-top-3` may clip if parent has overflow-hidden — parent doesn't, OK. | Reduce padding `p-6 sm:p-8`. |
| `src/components/practice/MistakesList.tsx:105` | Stat grid `grid-cols-2 lg:grid-cols-4` — at 360 each card has p-5 + h12 icon + text — borderline. | Reduce inner padding `p-4 sm:p-5`. |
| `src/components/peer/peer-stats-card.tsx:89` | Inner stats `grid-cols-2 sm:grid-cols-4` ok. Outer ring 120px ok. | No change. |
| `src/components/paywall/PaywallOverlay.tsx:39` | `mx-4` + `max-w-md` + `p-8` ok. | No change. |
| `src/components/dashboard/stat-card.tsx:60` | `gap-4 p-5` + h-12 icon + text-2xl value + sparkline 72px in corner. At 360 with 2-col grid each card ≈170px wide — sparkline + icon + value overlap. | Hide sparkline at < sm. Reduce p-5 → p-4 sm:p-5 and h-12 → h-10 sm:h-12. |
| `src/components/practice/PracticeConfigForm.tsx:106` | Card padding default p-6, fine. | No change. |

### Confetti / Animations

| File | Issue | Fix |
|---|---|---|
| `src/components/practice/Confetti.tsx:30` | Uses `fixed inset-0 overflow-hidden`. Particles spawn at `${x}vw` 0–100, they don't go past viewport horizontally. | OK. |

### Inputs / Iframe zoom

`src/components/ui/input.tsx:11` already has `text-base md:text-sm` (16px on mobile) — prevents iOS zoom. OK.

### Sidebar

`src/components/dashboard/dashboard-sidebar.tsx` already has Sheet drawer for mobile and fixed sidebar for `lg:`. OK.

---

## Summary of changes applied
- 6 files patched for table overflow/wrap.
- 2 chart components made smaller on mobile.
- QuestionCard / QuizContainer header rows now wrap.
- AnswerDetailDialog meta row stacks on mobile + adds scroll.
- PricingCard, MistakesList, StatCard padding tightened on mobile.
