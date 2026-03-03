# Roadmap: grile-ReziNOTE

## Overview

grile-ReziNOTE is a SaaS platform for Romanian dental residency exam preparation. The roadmap delivers the platform in 10 phases, starting from a technical foundation with scoring engine and design system, through admin content tools, quiz engine, exam simulation with the core differentiator (admission threshold comparison), analytics and social features, payments, and finally PWA polish. Each phase delivers a coherent, verifiable capability. The scoring engine is built and tested in Phase 1 because every downstream feature depends on it. Admin tools come before quiz features because you cannot quiz without questions. The admission comparison (the core value proposition) lands in Phase 6 after both exam simulation and historical data management are complete.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Design System** - Project scaffolding, DB schema with answer snapshotting, scoring engine, design system tokens, PWA shell, Romanian language baseline
- [x] **Phase 2: Landing Page & Authentication** - Branded landing page, full email+password auth flow with verification and password reset (completed 2026-03-03)
- [x] **Phase 3: Admin Content Management** - Chapter CRUD, question CRUD with CS/CM support, bulk import/export, admin panel security (completed 2026-03-03)
- [ ] **Phase 4: Practice Tests** - Quiz engine for chapter-based and mixed practice tests with immediate/deferred feedback
- [ ] **Phase 5: Exam Simulation** - Timed 200-question exam (50 CS + 150 CM) with server-authoritative timer and progressive save
- [x] **Phase 6: Admission Comparison** - Historical admission data management and post-simulation admission outcome prediction (completed 2026-03-03)
- [ ] **Phase 7: Dashboard & Analytics** - Student dashboard with per-chapter stats, trends, visualizations, and dynamic updates
- [x] **Phase 8: Peer Comparison & Motivation** - Anonymous peer leaderboard with percentile/distribution and auto-generated motivational messages (completed 2026-03-03)
- [x] **Phase 9: Payments & Subscriptions** - Stripe subscription billing with access gating, webhook sync, and subscription management (completed 2026-03-03)
- [ ] **Phase 10: PWA & Mobile Polish** - Installable PWA with home screen icon, splash screen, and full mobile responsiveness

## Phase Details

### Phase 1: Foundation & Design System
**Goal**: A deployable application skeleton with tested scoring engine, complete database schema, consistent design system, and PWA shell — the load-bearing foundation every feature builds on
**Depends on**: Nothing (first phase)
**Requirements**: BRAND-03, PWA-03, LANG-01
**Success Criteria** (what must be TRUE):
  1. The scoring engine correctly calculates scores for CS questions (4 points for correct, 0 for wrong) and CM questions (per-option partial credit with annulment for fewer than 2 or more than 4 selections), verified by automated tests covering all edge cases
  2. The database schema is deployed with all core tables (users, chapters, questions, options, attempts, attempt_answers with isCorrect snapshot field, subscriptions, admission_data) and Drizzle migrations run successfully
  3. A consistent design system (colors, typography, spacing, components) is applied across all existing pages, matching a professional-but-friendly student-oriented aesthetic
  4. The application shell loads with Romanian language UI, correct diacritics rendering, and a cached app shell for fast subsequent loads
  5. The Next.js project structure has route groups for marketing, auth, student, and admin sections with Supabase RLS policies in place
**Plans**: Complete

Plans:
- [x] 01-01: Project scaffolding, DB schema, Supabase clients, route groups, auth middleware
- [x] 01-02: Scoring engine TDD (CS + CM with annulment, 23 tests)
- [x] 01-03: Design system (medical teal + shadcn/ui), PWA shell, Romanian UI

### Phase 2: Landing Page & Authentication
**Goal**: Visitors see a professional, branded landing page that communicates the platform's value and can create an account, verify their email, log in, stay logged in, reset their password, and log out
**Depends on**: Phase 1
**Requirements**: BRAND-01, BRAND-02, AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05
**Success Criteria** (what must be TRUE):
  1. A visitor landing on the homepage sees a professional branded page with logo, clear value proposition about residency exam preparation, feature explanations, and a prominent call-to-action to sign up
  2. A new user can create an account with email and password, receives a verification email, and can click the link to verify their account
  3. A verified user can log in with email and password, close the browser, reopen it, and still be logged in (session persists)
  4. A user who forgot their password can request a reset link via email, click it, set a new password, and log in with the new password
  5. A logged-in user can log out from any page in the application using a visible logout control
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD
- [ ] 02-03: TBD

### Phase 3: Admin Content Management
**Goal**: An admin can fully manage the question bank — create chapters, add/edit/delete questions with CS/CM types and source references, bulk import from Excel/CSV, export for backup, all through a secure admin panel
**Depends on**: Phase 2 (requires auth for admin access)
**Requirements**: ADMN-01, ADMN-02, ADMN-03, ADMN-04, ADMN-05, ADMN-07
**Success Criteria** (what must be TRUE):
  1. An admin can create, edit, reorder, and delete chapters (with name and description), and chapters appear in the correct order throughout the platform
  2. An admin can create a question with: question text, options A-E, CS or CM type selection, correct answer(s), and source reference (book/page), and can edit or delete existing questions
  3. An admin can upload a CSV or Excel file of questions, see a validation report with row-by-row errors (if any), and successfully import valid questions into the question bank with correct Romanian diacritics preserved
  4. An admin can export the full question bank (or filtered subset) to CSV and Excel format for backup or external review
  5. The admin panel is accessible only to superadmin users — regular students cannot access or see admin routes
**Plans**: Complete

Plans:
- [x] 03-01: Schema extensions (isSuperadmin, archivedAt, auditLogs), admin security layer, sidebar navigation
- [x] 03-02: Chapter CRUD with drag-and-drop reordering using @dnd-kit
- [x] 03-03: Question CRUD with live preview, data table, CS/CM type-aware validation
- [x] 03-04: Bulk import/export with CSV (PapaParse + UTF-8 BOM) and Excel (ExcelJS)

### Phase 4: Practice Tests
**Goal**: Students can practice quiz questions by chapter or mixed, choosing whether to see answers immediately or at the end, and can review previously wrong answers for targeted study
**Depends on**: Phase 3 (requires questions in the database)
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05
**Success Criteria** (what must be TRUE):
  1. A student can start a practice test on a single chapter and answer questions without any time pressure, with the test drawing only from that chapter's question pool
  2. A student can start a mixed practice test drawing questions randomly from all chapters, without time limits
  3. Before starting any practice test, a student can choose between "see correct answer immediately after each question" and "see all results at the end" — and the chosen mode works correctly throughout the test
  4. After seeing a correct answer (in either mode), the student can see the source/reference (book and page) for that question
  5. A student can access a "review wrong answers" mode that resurfaces questions they previously answered incorrectly, allowing targeted re-practice
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD
- [ ] 04-03: TBD

### Phase 5: Exam Simulation
**Goal**: Students can take a realistic timed exam simulation matching the real residency exam format — 200 questions (50 CS + 150 CM), countdown timer, results only at the end, with answers saved progressively and time enforced by the server
**Depends on**: Phase 4 (practice mode validates the core quiz loop first)
**Requirements**: EXAM-01, EXAM-02, EXAM-03, EXAM-04, EXAM-05, EXAM-06
**Success Criteria** (what must be TRUE):
  1. A student can start an exam simulation that presents exactly 200 questions: the first 50 are CS (complement simplu) and the next 150 are CM (complement multiplu), drawn randomly from all chapters with balanced representation
  2. The simulation has a visible countdown timer (default 4 hours, configurable by admin) that counts down in real time and auto-submits the exam when time expires
  3. During the simulation, the student sees NO correct answers and NO scoring — results appear only after completing or time-expiring the entire exam
  4. The scoring uses the official Romanian formula: CS questions award 4 points for correct / 0 for wrong; CM questions award 1 point per correctly-handled option (selected correct OR unselected incorrect), with annulment (0 points) for fewer than 2 or more than 4 selections
  5. Each answer is saved to the server as the student progresses — if the browser crashes or the connection drops, the student can resume without losing answers; the server rejects submissions past the deadline plus a grace period
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD
- [ ] 05-03: TBD

### Phase 6: Admission Comparison
**Goal**: After completing an exam simulation, students instantly see whether their score would have earned them admission to specific dental specialties based on real historical threshold data — the platform's core differentiator
**Depends on**: Phase 5 (requires simulation scores) and Phase 3 (admin panel exists for data entry)
**Requirements**: ADMN-06, COMP-01, COMP-02, COMP-03, COMP-04
**Success Criteria** (what must be TRUE):
  1. An admin can enter and manage historical admission data: per specialty, per year (last 5 years), including admission threshold score and number of available spots
  2. After completing an exam simulation, the student sees their total score prominently displayed
  3. The platform shows the student which specialties they would have been admitted to (and which they would not), based on their score compared against historical thresholds for each of the last 5 years
  4. A student can browse historical admission data independently (outside of simulation results) through an interactive explorer — filtering by specialty and year, seeing thresholds and available spots
  5. The comparison clearly shows per-year results (e.g., "Admitted to Orthodontics in 3 of 5 years") so students understand the variability of admission thresholds
**Plans**: Complete

Plans:
- [x] 06-01: Specialties CRUD & Admission Data Admin (schema, validation, queries, actions, admin UI)
- [x] 06-02: Admission Data Bulk Import (CSV/Excel parsing, column mapping, upsert, export with BOM)
- [x] 06-03: Post-Simulation Comparison & Independent Explorer (comparison logic, card UI, Recharts charts)

### Phase 7: Dashboard & Analytics
**Goal**: Students have a rich, visual dashboard showing their preparation progress — overall stats, per-chapter breakdown with advanced visualizations, daily/weekly trends, and answer history — all updating dynamically after every test
**Depends on**: Phase 4 (requires test attempt data to display)
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06
**Success Criteria** (what must be TRUE):
  1. A student's dashboard shows overall statistics: total accuracy percentage, total questions completed, and total tests finalized
  2. The dashboard shows per-chapter statistics: accuracy rate, questions attempted, and progress for each chapter, allowing the student to identify weak areas
  3. The dashboard displays trend charts showing the student's performance evolution over days and weeks — the student can see whether they are improving
  4. The student can view a history of their answers (correct and incorrect) with details including the question, their answer, and the correct answer
  5. The dashboard includes advanced visualizations: a radar chart showing chapter strengths, a heat map highlighting weak zones, and sparklines showing per-chapter trends — all updating dynamically when the student completes a new test
**Plans**: TBD

Plans:
- [ ] 07-01: TBD
- [ ] 07-02: TBD
- [ ] 07-03: TBD

### Phase 8: Peer Comparison & Motivation
**Goal**: Students can see how they rank anonymously among all users who completed full simulations and receive contextual motivational messages that encourage continued practice based on their actual performance
**Depends on**: Phase 5 (requires simulation data from multiple users) and Phase 7 (dashboard infrastructure)
**Requirements**: PEER-01, PEER-02, PEER-03, PEER-04, PEER-05, MOTV-01, MOTV-02, MOTV-03, MOTV-04
**Success Criteria** (what must be TRUE):
  1. After completing a simulation, a student sees their percentile rank (top X%) computed from all users who completed a full simulation
  2. The student sees a score distribution chart (histogram/curve) with their own position clearly highlighted among all simulation completers
  3. The student sees the mean and median scores of all simulation completers compared against their own score
  4. The student sees an anonymous ranking (place X of Y participants) with no names or identifying information shown for any user; only users who completed full simulations are included
  5. The dashboard displays contextual motivational messages: encouragement when tests are completed correctly, guidance when chapters need more work, rotating "did you know" statistics, and milestone celebrations — all generated automatically from the student's real performance data and trends
**Plans**: TBD

Plans:
- [ ] 08-01: TBD
- [ ] 08-02: TBD
- [ ] 08-03: TBD

### Phase 9: Payments & Subscriptions
**Goal**: The platform generates revenue through Stripe subscriptions — students can view plans, pay monthly or annually, have their access gated by subscription status, manage their subscription, and all payment state stays reliably synced
**Depends on**: Phase 2 (requires auth) — can be developed in parallel with Phases 5-8
**Requirements**: PAY-01, PAY-02, PAY-03, PAY-04, PAY-05
**Success Criteria** (what must be TRUE):
  1. A student can see available subscription plans (monthly and annual) with clear pricing in RON on a dedicated pricing/plans page
  2. A student can complete a subscription payment through Stripe (Embedded Checkout staying on the platform domain) and their subscription activates without manual intervention
  3. Content access is gated by subscription status: non-subscribers or expired subscribers see a paywall with upgrade prompts; a configurable free trial period grants initial access
  4. A subscribed student can view their current plan, cancel their subscription, or switch between monthly and annual billing through a subscription management interface
  5. Stripe webhooks reliably sync subscription state (new, renewed, cancelled, payment failed) using idempotent event processing with event ID deduplication — subscription status in the database always matches Stripe's truth
**Plans**: TBD

Plans:
- [ ] 09-01: TBD
- [ ] 09-02: TBD
- [ ] 09-03: TBD

### Phase 10: PWA & Mobile Polish
**Goal**: The platform is installable as a PWA from any mobile browser and provides a fully responsive, native-app-like experience on phones and tablets
**Depends on**: Phase 1 (PWA shell exists), all feature phases complete
**Requirements**: PWA-01, PWA-02
**Success Criteria** (what must be TRUE):
  1. A student on mobile can install the platform as a PWA from the browser — seeing a home screen icon, custom splash screen, and the app launching in standalone mode without browser chrome
  2. Every page and feature of the platform (landing page, auth, tests, dashboard, admin panel) renders correctly and is fully usable on mobile screen sizes with appropriate touch targets, readable text, and no horizontal scrolling
**Plans**: TBD

Plans:
- [ ] 10-01: TBD
- [ ] 10-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Design System | 3/3 | Complete    | 2026-03-02 |
| 2. Landing Page & Authentication | 0/3 | Complete    | 2026-03-03 |
| 3. Admin Content Management | 4/4 | Complete    | 2026-03-03 |
| 4. Practice Tests | 0/3 | Not started | - |
| 5. Exam Simulation | 0/3 | Not started | - |
| 6. Admission Comparison | 3/3 | Complete    | 2026-03-03 |
| 7. Dashboard & Analytics | 0/3 | Not started | - |
| 8. Peer Comparison & Motivation | 0/3 | Complete    | 2026-03-03 |
| 9. Payments & Subscriptions | 0/3 | Complete    | 2026-03-03 |
| 10. PWA & Mobile Polish | 0/2 | Not started | - |
