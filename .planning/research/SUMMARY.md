# Project Research Summary

**Project:** grile-ReziNOT (Romanian Dental Residency Exam Prep SaaS)
**Domain:** Medical exam prep / quiz platform (niche: Romanian dental residency)
**Researched:** 2026-03-02
**Confidence:** HIGH

## Executive Summary

grile-ReziNOT is a SaaS quiz platform targeting Romanian dental students preparing for the national residency exam. The domain is well-understood: quiz platforms follow established patterns (question bank + quiz engine separation, server-authoritative scoring, webhook-driven billing), and the competitive landscape is clearly mapped. The recommended approach is a Next.js 15 + Supabase monolith — no separate backend, no microservices. Server Actions replace a traditional API layer, Supabase provides managed Postgres, auth, and row-level security, and Drizzle ORM handles type-safe queries. This stack eliminates four separate services (auth, DB hosting, file storage, authorization) under one platform, which is the right trade-off for a small team moving fast.

The platform has a genuine competitive moat: no competitor integrates historical admission threshold data into simulation results. Every other Romanian exam prep platform shows a score; ReziNOT will answer "With this score, you would have been admitted to Orthodontics in 3 of the last 5 years." This single differentiator — the admission threshold comparison — is the core reason to build and the primary validation target. Everything else (analytics, peer comparison, motivational messages) adds depth but is secondary to this feature. The MVP must deliver this end-to-end.

The highest-risk area is the scoring algorithm. The Romanian exam uses a bespoke per-option scoring formula for CM (Complement Multiplu) questions that is non-obvious and fundamentally different from standard all-or-nothing scoring. Getting this wrong corrupts every downstream feature: analytics, comparisons, admission threshold mapping, and student trust. The scoring function must be built first, tested exhaustively with official methodology edge cases, and treated as the load-bearing foundation of the entire platform. Secondary risks are Stripe webhook idempotency and PWA cache invalidation for quiz content — both are well-documented problems with known solutions that must be implemented correctly from the start rather than retrofitted.

---

## Key Findings

### Recommended Stack

The stack is a modern Next.js SaaS standard with Supabase replacing the typical separate auth + DB + storage services. All versions are verified against npm registry as of 2026-03-02. The key insight is that Next.js Server Actions + Supabase eliminate the need for a separate Express/Fastify API server entirely: mutations go through Server Actions, webhooks through Next.js Route Handlers, and authorization through Supabase RLS policies.

**Core technologies:**
- **Next.js 15.3.x + React 19**: Full-stack framework — App Router, Server Components, Server Actions. Pin to v15 (not v16) as v16 removes legacy APIs and has narrower ecosystem compatibility; upgrade path is clear later.
- **Supabase (PostgreSQL + Auth + RLS)**: Managed Postgres + email/password auth + row-level security in one platform. Eliminates Clerk ($0.02/MAU), separate DB hosting, and separate file storage. Free tier handles MVP (500MB, 50K MAU).
- **Drizzle ORM 0.45.x**: 7KB bundle, SQL-native, no binary dependencies. Vastly better for serverless cold starts than Prisma. Schema-first TypeScript inference.
- **Stripe 20.x**: Embedded Checkout (payment stays on your domain). Server Action checkout flows, webhook-driven subscription fulfillment. Supports RON currency in Romania.
- **Tailwind CSS 4.x + shadcn/ui**: Tailwind v4 is 5x faster build. shadcn/ui gives full code ownership (components copied in, not a dependency) with Radix UI accessibility primitives.
- **Zustand 5.x**: 3KB state for quiz session (current question, answers, timer). Everything else is server-state via Supabase.
- **TanStack Query 5.x**: Client-side data fetching/caching for dashboard, leaderboard, history. Server Components handle initial load.
- **Recharts 3.7.x**: SVG charting, JSX-native, shadcn/ui wraps it. Covers all analytics visualizations (bar, line, radar, area).
- **Zod 4.x + React Hook Form 7.x**: Same schema validates forms AND Server Actions. Minimal re-renders.
- **SheetJS 0.18.x**: Excel + CSV import/export in one library. Essential for bulk question bank loading. UTF-8 and Romanian diacritics require explicit handling.
- **@serwist/next 9.x**: PWA + service worker. Successor to unmaintained next-pwa. Active maintenance, Turbopack support.
- **Resend 6.x + React Email 5.x**: Transactional email (verification, reset, confirmations). 3K emails/month free. React-native email templates.
- **Vercel**: Zero-config deployment for MVP. Migration path to Coolify + Hetzner ($5/mo) when costs exceed ~$20/mo.

### Expected Features

Research identified a clear market gap and validated a full feature set against 5 live Romanian competitors.

**Must have (table stakes) — launch blockers:**
- Question bank with admin-defined chapters (CS and CM question types, matching real exam)
- Exam simulation: 200 questions (50 CS + 150 CM), timed (4 hours), results deferred until end
- Immediate vs. deferred answer feedback toggle for practice mode
- Mixed/random chapter practice tests
- Score and result tracking (all attempts stored with per-question results)
- Basic progress dashboard (per-chapter accuracy, overall trend charts)
- Question source/reference field per question
- Mobile-responsive UI / PWA (installable, offline shell)
- Email + password authentication (registration, verification, password reset)
- Stripe subscription billing (monthly/annual, free tier with daily question limit)
- Admin question CRUD with CS/CM type, options, correct answers, source
- Admin chapter management (flexible, no hardcoded chapters)
- Admin bulk import from Excel/CSV (essential for loading initial 500-2000 question bank)
- Admin historical admission data CRUD (thresholds per specialty per year)
- Admission threshold comparison after simulation — THE core differentiator
- Romanian language UI throughout

**Should have (differentiators) — add post-launch when validated:**
- Anonymous peer comparison: percentile rank, score distribution histogram, anonymous leaderboard (wait for 50+ simulation completions)
- Per-chapter visual analytics: radar/spider chart of chapter strengths, heat maps, sparklines
- Auto-generated motivational messages: rule-based, data-driven encouragement after tests and on dashboard
- Wrong questions review mode: resurface previously incorrect questions for targeted practice
- Historical admission data browser: standalone interactive explorer for past admission data

**Defer to v2+:**
- OAuth / Google login (only if signup friction proves to be a real problem)
- Full offline quiz-taking in PWA (complex IndexedDB sync)
- Push notifications (streak reminders, new content alerts)
- Multi-domain expansion (general medicine, pharmacy)
- Admin question versioning / audit trail

**Deliberate anti-features (do not build):**
- AI-generated explanations (medical accuracy liability; use source references instead)
- Forum / discussion (moderation burden; use external Discord/Telegram)
- Video lessons (different product category)
- Flashcards / spaced repetition (wrong quiz mode for exam-date-driven cramming; "wrong questions review" is the right substitute)
- Native iOS/Android apps (PWA covers 95% of use cases for this niche)

### Architecture Approach

The architecture is a clean Next.js monolith with a strict three-layer separation: Next.js App Router (client layer with route groups for marketing, auth, student, admin), Server Actions + Route Handlers (API layer organized by service domain), and Supabase PostgreSQL (data layer with RLS enforcing authorization). No microservices, no separate backend. Business logic lives in `lib/` (quiz engine, scoring, analytics, Stripe, email) as pure, testable functions — keeping it outside the App Router ensures unit testability.

**Major components:**
1. **Quiz Engine** (`lib/quiz/`) — Question assembly (stratified random selection), attempt lifecycle management, server-authoritative timer, answer persistence (autosave every 30-60s), scoring as a pure function
2. **Question Bank** (`lib/quiz/question-bank.ts`) — Separated from the engine: CRUD, chapter management, import parsing, question snapshots at attempt creation
3. **Analytics Service** (`lib/analytics/`) — Score aggregation, percentile calculation, per-chapter trends; pre-computed on test submission, not recalculated on every page load
4. **Admission Comparison Service** — Post-simulation lookup of historical thresholds, specialty-by-year mapping to generate the "you would have been admitted" result
5. **Stripe Integration** (`lib/stripe/`) — Embedded Checkout, idempotent webhook handler, subscription state sync, access-gating middleware
6. **Admin Panel** (`app/(admin)/`) — Protected routes for question CRUD, chapter management, Excel/CSV bulk import (with validation + error reporting), historical admission data management
7. **PWA Layer** (Serwist) — Network-first caching for quiz API endpoints, cache-first for static assets, content versioning to invalidate stale quiz data

**Key data flows:**
- Practice test: Client starts attempt → Server snapshots questions (without correct answers) → Student answers → Server scores → Analytics updated
- Exam simulation: Same as above but server-authoritative timer enforced, deferred feedback, post-score admission threshold comparison
- Payment: Stripe Checkout → webhook (idempotent) → subscription status in DB → RLS/middleware gates access

**Database schema highlights:** `users`, `chapters`, `questions`, `options`, `attempts`, `attempt_answers` (with snapshotted `isCorrect` at submission time), `subscriptions`, `admission_data`

### Critical Pitfalls

1. **Wrong CM/CS scoring formula** — The official Romanian methodology is NOT all-or-nothing. CM questions award 1 point per option for each correctly marked correct answer AND each correctly unmarked incorrect answer (out of 5 options). Marking fewer than 2 or more than 4 answers annuls the question (0 points). CS questions: 4 points for the one correct answer, 0 otherwise. Build this as a pure function with 20+ unit tests covering all edge cases (partial correct, overselection annulment, underselection annulment) BEFORE any other feature. Every downstream feature depends on correct scoring.

2. **Client-side timer for exam simulation** — `setInterval` alone is insufficient. Browser background tab throttling causes timer drift; `beforeunload` is unreliable for saving. Solution: server records `startedAt` + `timeLimit`, client derives remaining time from server timestamps, autosave every answer to server, server rejects submissions past deadline + grace period.

3. **Stripe subscription desync** — Webhooks arrive out of order and can be duplicated. Solution: store processed Stripe event IDs (deduplicate), always fetch current subscription state from Stripe API on webhook receipt (don't infer from event type alone), run periodic reconciliation job comparing local status with Stripe, use DB transactions for all subscription updates.

4. **Analytics corruption from retroactive question edits** — If correct answers are not snapshotted at submission time, any admin edit to a question's correct answer silently corrupts historical scores. Solution: `attempt_answers.isCorrect` is set at scoring time and never recalculated. Question edits are soft (create new version or soft-update); historical results are immutable. This must be in the data model from day one.

5. **PWA serving stale quiz content** — Cache-first service worker serves old question data after admin updates. Solution: network-first (or stale-while-revalidate) for all quiz API endpoints; cache-first only for static assets. Include a content version hash in API responses; client detects mismatch and invalidates quiz cache. Never show old question text scored against new correct answers.

6. **Unrepresentative exam simulation question selection** — Pure `ORDER BY RANDOM()` over-represents chapters with more questions. Solution: stratified random selection (configurable chapter weights in admin), always exactly 50 CS + 150 CM, no chapter left unrepresented.

---

## Implications for Roadmap

Architecture research defines a natural build order based on hard dependencies. The following 6-phase structure emerges directly from the dependency chain in ARCHITECTURE.md, cross-validated against FEATURES.md MVP priorities and PITFALLS.md phase warnings.

### Phase 1: Foundation
**Rationale:** Nothing else can be built without this. Data model decisions made here are expensive to reverse (especially answer snapshotting, question versioning, and RLS structure). The scoring function must be built and unit-tested before any quiz features.
**Delivers:** Deployable skeleton with auth, database schema, scoring foundation, and PWA shell
**Addresses:** User authentication, PWA setup, Romanian UI scaffolding
**Avoids:** Analytics corruption pitfall (answer snapshotting in schema from day one), scoring error pitfall (scoring as pure tested function before it touches any UI)
**Includes:**
- Database schema + Drizzle migrations (all entities including `attempt_answers.isCorrect` snapshot field)
- Supabase Auth setup (@supabase/ssr, email verification, password reset, RLS policies)
- Next.js project structure (route groups: marketing, auth, student, admin)
- Scoring engine (`lib/quiz/scoring.ts`) as pure function with exhaustive unit tests (CM partial credit, annulment rules, CS 4-point rule)
- PWA manifest, Serwist service worker skeleton, responsive layout
- Landing page + Romanian UI baseline

### Phase 2: Content Management (Admin)
**Rationale:** You cannot run quizzes without questions. Admin tools must come before the quiz engine. Bulk import is in this phase because loading 500-2000 questions manually is impractical and blocks all testing of the quiz engine.
**Delivers:** Fully operational admin panel for content management
**Addresses:** Admin chapter CRUD, admin question CRUD, bulk import CSV/Excel, admin historical admission data CRUD
**Avoids:** Excel import encoding pitfall (UTF-8 + Romanian diacritics validation), hardcoded chapters anti-pattern
**Includes:**
- Chapter management (CRUD, ordering, active/inactive)
- Question CRUD (CS/CM type, options, correct answers, source reference, soft-delete)
- Bulk import from Excel/CSV (SheetJS, row-by-row validation, error report, encoding detection)
- Historical admission data management (per specialty per year, threshold + available spots)
- TanStack Table for admin question list (sorting, filtering, pagination)

### Phase 3: Quiz Engine (Practice Mode)
**Rationale:** Practice mode (no timer, immediate or deferred feedback) is simpler than exam simulation and validates the core quiz loop — question display, answer collection, server-side scoring, result display — before adding the complexity of timed exams.
**Delivers:** Fully playable practice quiz experience
**Addresses:** Chapter-based practice tests, mixed/random tests, immediate vs. deferred feedback toggle, score and result tracking, wrong answers review
**Avoids:** Client-side scoring anti-pattern (answers sent to server, correct answers never in response payload), correct answers leaked to frontend, question bank / engine mixing anti-pattern (question snapshot on attempt creation)
**Includes:**
- Quiz assembly service (question selection with stratification, attempt creation, question snapshot)
- Answer submission endpoint (server validates, stores, returns feedback only in immediate mode)
- Attempt completion + scoring (calls pure `scoreAttempt()` function, stores `isCorrect` per answer at submission)
- Score result display (per-chapter breakdown, source references, wrong answer review)
- Zustand quiz session state (current question, answers, feedbackMode, status)

### Phase 4: Exam Simulation + Admission Comparison
**Rationale:** Exam simulation is the most complex quiz mode (server timer, 50+150 CS/CM stratification, deferred-only feedback). The admission threshold comparison depends on both simulation completion AND historical data from Phase 2. This phase delivers the core differentiator.
**Delivers:** Timed 200-question exam simulation with admission outcome prediction — the primary value proposition
**Addresses:** Exam simulation (50 CS + 150 CM, timed), server-authoritative timer, admission threshold comparison
**Avoids:** Client-only timer pitfall (autosave every answer, server validates deadline), unrepresentative question selection pitfall (stratified selection algorithm, configurable weights), PWA stale content pitfall (content versioning API designed here for PWA consumption)
**Includes:**
- Timed attempt creation (server records `startedAt`, `timeLimit`)
- Stratified random selection (50 CS + 150 CM with chapter weight distribution)
- Incremental answer autosave (every answer persisted server-side, resumable on reconnect)
- Server-side deadline enforcement (reject submissions past deadline + 30s grace)
- Client timer derived from server timestamps (using `visibilitychange` to sync on tab return)
- Admission comparison engine (score → lookup thresholds → "admitted to X specialties in Y of last 5 years")
- Simulation results screen with admission outcome display

### Phase 5: Analytics + Social Features
**Rationale:** Analytics require a population of scored attempts to be meaningful. This phase should not start until Phase 3 (practice) and Phase 4 (simulation) are generating real data. Anonymous peer comparison specifically requires a minimum number of simulation completions (50+) to be statistically valid.
**Delivers:** Data-rich analytics dashboard and motivational social comparison
**Addresses:** Basic progress dashboard, per-chapter visual analytics, anonymous peer comparison, motivational messages, historical admission data browser
**Avoids:** De-anonymization pitfall (k-anonymity: do not show comparison until minimum N users), leaderboard recalculation on every page load (pre-compute on submission, cache with TTL), zero-state onboarding (progressive dashboard disclosure)
**Includes:**
- Per-chapter accuracy rates (bar charts) and trend over time (line charts)
- Radar/spider chart of chapter strengths vs. weaknesses
- Anonymous leaderboard: percentile rank, score distribution histogram, mean/median (exam simulation only)
- Motivational messages: rule-based milestone detection (streak, improvement, percentile change), templated strings with data interpolation
- Historical admission data browser: filterable table + charts by specialty/year
- Pre-computed analytics aggregation (updated on attempt completion, cached with TTL)

### Phase 6: Monetization (Stripe)
**Rationale:** Stripe can be built in parallel with Phases 3-5 since it only gates access and does not change quiz logic. However, it should be complete before public launch. Placing it as Phase 6 reflects that the quiz engine must exist before you know what to gate, but the actual development can overlap.
**Delivers:** Subscription billing with access gating; revenue-generating product
**Addresses:** Stripe subscription (monthly/annual plans, free tier with daily question limit)
**Avoids:** Stripe subscription desync pitfall (idempotent webhook handler, event ID deduplication, Stripe API as source of truth), race condition on checkout redirect (show "processing" state until webhook confirms), RON vs EUR confusion (price in RON)
**Includes:**
- Stripe Embedded Checkout integration (Server Action creates session, stays on your domain)
- Subscription management page (current plan, billing portal link)
- Webhook handler (`/api/webhooks/stripe`) with signature verification, event ID deduplication, DB transaction
- Access gating middleware (checks `subscriptions.status` on every protected route)
- Free tier enforcement (daily question limit for non-subscribers)
- Periodic reconciliation: local subscription status vs. Stripe API
- Resend transactional emails (verification, password reset, subscription confirmation, payment failure)

### Phase Ordering Rationale

- **Phases 1-2 before 3:** You cannot run quizzes without questions; you cannot store quiz results without a schema that handles answer snapshotting.
- **Phase 3 before 4:** Practice mode validates the core quiz loop before adding the complexity of server timers and stratified selection.
- **Phase 4 unlocks the core differentiator:** Admission threshold comparison requires both simulation (Phase 4) and historical data (Phase 2).
- **Phase 5 after 3-4:** Analytics are meaningless without data. Anonymous comparison requires enough users to avoid de-anonymization.
- **Phase 6 parallel from Phase 3+:** Stripe does not depend on quiz logic; access gating is additive. Build concurrently with Phases 3-5, complete before launch.
- **Scoring function in Phase 1, not Phase 3:** The scoring algorithm must be isolated, tested, and locked in before it touches any UI or analytics feature.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (Exam Simulation):** Stratified question selection algorithm needs specific configuration against real exam chapter distribution. Verify actual 2025-2026 exam structure (50/150 split confirmed, but chapter weights need official curriculum source).
- **Phase 5 (Analytics):** k-anonymity threshold for anonymous comparison needs a decision (10? 20? 50?). No authoritative source found — requires product judgment and possibly A/B testing.
- **Phase 6 (Stripe):** RON settlement currency configuration in Stripe dashboard is Romania-specific and needs hands-on verification during implementation.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Supabase + Next.js 15 + Drizzle setup is extremely well-documented. Official docs are current and comprehensive.
- **Phase 2 (Admin):** SheetJS import + TanStack Table + shadcn/ui form patterns are standard. No novel patterns needed.
- **Phase 3 (Quiz Engine):** Server Action + Supabase RLS patterns for quiz platforms are well-documented. Scoring function is custom but fully specified by the official Romanian methodology.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified via `npm view`. Official docs consulted for Next.js, Supabase, Stripe, Serwist. Clear rationale for every choice with alternatives evaluated. |
| Features | HIGH | 5 live Romanian competitors analyzed directly. Official exam structure (MEDIjobs, Rezidentiat.ms.ro) verified. International benchmarks (UWorld, AMBOSS) for pattern reference. |
| Architecture | HIGH | Patterns sourced from Moodle question engine (definitive quiz platform architecture), Stripe official docs, Vercel reference architecture. Data flows and component boundaries are unambiguous. |
| Pitfalls | HIGH | CM scoring formula verified against official Romanian methodology document (lege5.ro). Stripe webhook pitfalls from official docs + real-world sources. PWA caching from web.dev and Serwist docs. |

**Overall confidence:** HIGH

### Gaps to Address

- **CM scoring annulment thresholds (2-4 rule):** The official document confirms the "fewer than 2 or more than 4 answers annuls the question" rule for CM, but edge cases for partial credit formula near those boundaries should be validated against past exam marking examples before the scoring function is locked.
- **Real exam chapter weight distribution:** The 50 CS + 150 CM split is confirmed. The per-chapter distribution within those pools is not documented publicly. Admin-configurable weights (Phase 2) are the right mitigation — gather actual distribution data from the client or from analysis of historical question papers before Phase 4.
- **Offline quiz-taking scope for PWA:** Phase 1 PWA shell covers the installable + offline navigation use case. Full offline quiz-taking (caching question content for offline sessions) is deferred to v2+. The boundary between "offline shell" (v1) and "offline quizzes" (v2) should be explicitly documented in requirements to set correct user expectations.
- **Free tier limits:** Research confirms all Romanian competitors use a daily question limit for their free tier (1 test/day, 50 questions/day range). The exact limit for ReziNOT is a product/pricing decision not resolved by research. Needs a number before Phase 6 can be implemented.
- **Serwist + Turbopack compatibility:** @serwist/next 9.x has `@serwist/turbopack` for Turbopack support, but this is newer than the webpack path. If Next.js 15 Turbopack is used in production builds, verify Serwist compatibility during Phase 1 setup.

---

## Sources

### Primary (HIGH confidence)
- npm registry (`npm view [package] version`) — All version numbers verified 2026-03-02
- [Next.js Official Docs](https://nextjs.org/docs/app/guides/progressive-web-apps) — PWA, App Router, Server Actions
- [Supabase Docs](https://supabase.com/docs) — Auth, RLS, SSR integration
- [Stripe Official Docs](https://docs.stripe.com/billing/subscriptions/webhooks) — Subscription lifecycle, webhook patterns
- [Serwist Official Docs](https://serwist.pages.dev/docs/next/getting-started) — PWA service worker for Next.js
- [lege5.ro Official Scoring Methodology](https://lege5.ro/Gratuit/gmydkobqheya/exemplificari-privind-tipurile-de-intrebari-si-modul-de-punctare-metodologie?dp=gi3tcnrwha2dony) — Romanian exam CM/CS scoring formula
- [Rezidentiat.ms.ro](https://rezidentiat.ms.ro/) — Official Ministry of Health exam information
- [MEDIjobs Dental Residency Guide](https://medijobs.ro/blog/totul-despre-examenul-de-rezidentiat-la-medicina-dentara) — Exam structure (50 CS + 150 CM, 4 hours)
- [Moodle Question Engine API](https://moodledev.io/docs/5.0/apis/subsystems/question) — Question bank/engine separation architecture
- [Vercel Next.js Subscription Payments](https://github.com/vercel/nextjs-subscription-payments) — Reference architecture for Next.js + Stripe SaaS
- [Grile-Rezidentiat.ro](https://app.grile-rezidentiat.ro/), [Rezihub](https://rezihub.ro/), [Doctor Rezidentiat](https://doctorrezidentiat.ro/), [MG Rezidentiat](https://app.mgrezidentiat.ro/), [Questmed](https://www.questmed.ro/) — Competitor feature analysis

### Secondary (MEDIUM confidence)
- [web.dev PWA Update](https://web.dev/learn/pwa/update) — Service worker lifecycle and cache invalidation
- [Stigg Stripe Webhooks Best Practices](https://www.stigg.io/blog-posts/best-practices-i-wish-we-knew-when-integrating-stripe-webhooks) — Real-world webhook failures
- [DesignRevision Drizzle vs Prisma](https://designrevision.com/blog/prisma-vs-drizzle) — ORM comparison
- [DesignRevision shadcn/ui Guide](https://designrevision.com/blog/shadcn-ui-guide) — Component library patterns
- [Stripe Romania Payments Guide](https://stripe.com/resources/more/payments-in-romania) — RON currency support
- [Leon Consulting Vercel vs Coolify](https://leonstaff.com/blogs/vercel-vs-coolify-cost-analysis/) — Hosting cost analysis
- [DEV Community React State Management 2025](https://dev.to/hijazi313/state-management-in-2025-when-to-use-context-redux-zustand-or-jotai-2d2k) — Zustand recommendation

### Tertiary (LOW confidence)
- [Tutorials24x7 Quiz Database Design](https://www.tutorials24x7.com/mysql/guide-to-design-database-for-quiz-in-mysql) — Schema patterns (MySQL-based, adapted for Postgres)

---

*Research completed: 2026-03-02*
*Ready for roadmap: yes*
