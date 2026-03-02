# Architecture Research

**Domain:** Medical exam prep / quiz SaaS platform (Romanian dental residency)
**Researched:** 2026-03-02
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
+-----------------------------------------------------------------------+
|                         CLIENT LAYER (PWA)                            |
|  +-------------+  +-------------+  +-------------+  +--------------+ |
|  |  Landing /  |  | Quiz Engine |  |  Dashboard  |  | Admin Panel  | |
|  |    Auth     |  |   (Test &   |  | (Analytics) |  | (Content     | |
|  |   Pages     |  |  Simulate)  |  |             |  |  Mgmt)       | |
|  +------+------+  +------+------+  +------+------+  +------+-------+ |
|         |                |                |                |          |
+---------+----------------+----------------+----------------+----------+
          |                |                |                |
+---------v----------------v----------------v----------------v----------+
|                        API LAYER (Server)                             |
|  +-------------+  +-------------+  +-------------+  +--------------+ |
|  |  Auth       |  | Quiz /      |  | Analytics   |  | Admin        | |
|  |  Service    |  | Exam        |  | Service     |  | Service      | |
|  |             |  | Service     |  |             |  |              | |
|  +------+------+  +------+------+  +------+------+  +------+-------+ |
|         |                |                |                |          |
+---------+----------------+----------------+----------------+----------+
          |                |                |                |
+---------v----------------v----------------v----------------v----------+
|                       DATA LAYER                                      |
|  +------------------------------------------------------------------+ |
|  |                    PostgreSQL Database                            | |
|  |  +--------+ +----------+ +----------+ +---------+ +----------+  | |
|  |  | Users  | | Questions| | Attempts | | Scores  | | Payments |  | |
|  |  +--------+ +----------+ +----------+ +---------+ +----------+  | |
|  +------------------------------------------------------------------+ |
+-----------------------------------------------------------------------+
          |
+---------v-------------------------------------------------------------+
|                    EXTERNAL SERVICES                                   |
|  +-------------------+  +-------------------+                         |
|  |  Stripe           |  |  Email Service    |                         |
|  |  (Payments +      |  |  (Verification,   |                         |
|  |   Webhooks)       |  |   Reset, Notif.)  |                         |
|  +-------------------+  +-------------------+                         |
+-----------------------------------------------------------------------+
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Landing / Auth Pages | Marketing, registration, login, password reset, email verification | Next.js pages with server actions, JWT/session-based auth |
| Quiz Engine (Client) | Render questions, track answers, manage timer countdown, handle CS/CM question types | React state machine with local state, timer via useEffect or server-synced |
| Dashboard (Analytics) | Display per-chapter stats, progress trends, score comparisons, motivational messages | Chart components (Recharts/Chart.js), data fetched via API |
| Admin Panel | CRUD for questions/chapters, import/export Excel/CSV, manage historical admission data | Protected routes, form-based CRUD, file upload/parse |
| Auth Service | Registration, login, email verification, password reset, session management, role-based access | Server-side auth with hashed passwords (bcrypt), JWT or session tokens |
| Quiz / Exam Service | Assemble quizzes from question bank, validate answers server-side, calculate scores, manage exam timer | Core business logic: question selection, scoring engine, attempt lifecycle |
| Analytics Service | Aggregate scores per chapter, calculate percentiles, generate trends, anonymous leaderboard | SQL aggregation queries, possibly materialized views for performance |
| Admin Service | Question CRUD, chapter management, Excel/CSV import parsing, admission data management | File parsing (xlsx/csv libraries), validation, bulk upsert |
| PostgreSQL Database | All persistent storage: users, questions, chapters, attempts, answers, scores, subscriptions | Relational schema with proper indexing, foreign keys |
| Stripe Integration | Subscription creation, payment processing, webhook handling, access gating | Stripe SDK + webhook endpoint, subscription status sync |
| Email Service | Transactional emails: verification, password reset, subscription confirmations | Resend, Nodemailer, or similar; triggered by auth/payment events |

## Recommended Project Structure

```
src/
+-- app/                       # Next.js App Router pages
|   +-- (marketing)/           # Landing page, pricing (public)
|   +-- (auth)/                # Login, register, verify, reset
|   +-- (student)/             # Protected student routes
|   |   +-- dashboard/         # Analytics dashboard
|   |   +-- practice/          # Chapter-based practice tests
|   |   +-- exam/              # Exam simulation mode
|   |   +-- history/           # Past attempts and review
|   +-- (admin)/               # Protected admin routes
|   |   +-- questions/         # Question CRUD
|   |   +-- chapters/          # Chapter management
|   |   +-- import/            # Excel/CSV import
|   |   +-- admissions/        # Historical admission data
|   +-- api/                   # API route handlers
|       +-- auth/              # Auth endpoints
|       +-- quiz/              # Quiz assembly and submission
|       +-- analytics/         # Stats and leaderboard
|       +-- admin/             # Admin operations
|       +-- webhooks/          # Stripe webhooks
+-- components/                # Shared UI components
|   +-- ui/                    # Base components (buttons, cards, inputs)
|   +-- quiz/                  # Quiz-specific components (QuestionCard, Timer, ProgressBar)
|   +-- dashboard/             # Chart components, stat cards
|   +-- admin/                 # Admin form components
+-- lib/                       # Core business logic
|   +-- auth/                  # Auth utilities, session management
|   +-- quiz/                  # Quiz engine logic (question selection, scoring)
|   +-- analytics/             # Score aggregation, percentile calculation
|   +-- stripe/                # Stripe client, webhook handlers
|   +-- email/                 # Email sending utilities
|   +-- db/                    # Database client, schema, migrations
|   +-- validators/            # Input validation schemas (Zod)
+-- types/                     # TypeScript type definitions
+-- hooks/                     # Custom React hooks (useTimer, useQuiz)
+-- public/                    # Static assets, PWA manifest, icons
+-- prisma/                    # Prisma schema and migrations (if using Prisma)
```

### Structure Rationale

- **app/(marketing|auth|student|admin)/:** Route groups separate public, authenticated student, and admin concerns. Each group can have its own layout (e.g., admin sidebar vs student nav).
- **lib/:** Business logic lives outside the app directory, keeping it testable and reusable. The quiz engine, scoring, and analytics are pure functions that can be unit tested independently.
- **components/:** Separated by domain (ui, quiz, dashboard, admin) rather than by type (atoms, molecules). Domain grouping is more intuitive for a focused product.
- **hooks/:** Quiz-specific hooks (useTimer, useQuizState) encapsulate complex client-side state machines.

## Architectural Patterns

### Pattern 1: Question Bank / Question Engine Separation

**What:** Separate the management of question definitions (bank) from the logic of attempting questions (engine). This is the foundational pattern used by Moodle and every serious quiz platform. The question bank owns creation, editing, categorization, and import/export. The question engine owns assembly, presentation, answer collection, and scoring.

**When to use:** Always. This is not optional for a quiz platform.

**Trade-offs:** Requires clear interfaces between the two subsystems but prevents the most common quiz platform anti-pattern (mixing admin CRUD with quiz-taking logic).

**Example:**
```typescript
// lib/quiz/question-bank.ts — manages question definitions
interface QuestionDefinition {
  id: string;
  chapterId: string;
  type: 'CS' | 'CM';        // Complement simplu / Complement multiplu
  text: string;
  options: OptionDefinition[];
  correctOptionIds: string[];
  source: string;            // Book/reference
}

// lib/quiz/quiz-engine.ts — manages attempts
interface QuizAttempt {
  id: string;
  userId: string;
  mode: 'practice' | 'mixed' | 'exam';
  questions: AttemptQuestion[];  // snapshot of questions at attempt time
  startedAt: Date;
  timeLimit: number | null;     // seconds, null for practice
  status: 'in_progress' | 'completed' | 'timed_out';
}

function assembleExam(questionPool: QuestionDefinition[]): AttemptQuestion[] {
  // Select 50 CS + 150 CM randomly from pool
  const csQuestions = selectRandom(questionPool.filter(q => q.type === 'CS'), 50);
  const cmQuestions = selectRandom(questionPool.filter(q => q.type === 'CM'), 150);
  return [...csQuestions, ...cmQuestions].map(toAttemptQuestion);
}
```

### Pattern 2: Server-Authoritative Timer for Exam Simulation

**What:** The exam timer is tracked server-side. The client displays a countdown synced from the server start time, but the server enforces the deadline. Any answers submitted after the server-side deadline are rejected.

**When to use:** For timed exam simulations where fairness matters.

**Trade-offs:** Requires storing `startedAt` and `timeLimit` on the attempt record. Client timer can drift, so periodic sync or calculation from server timestamps is needed. Slightly more complex than pure client timer, but prevents trivial cheating (pausing browser, manipulating client clock).

**Example:**
```typescript
// Server: create exam attempt
async function startExam(userId: string): Promise<QuizAttempt> {
  const attempt = await db.attempt.create({
    userId,
    mode: 'exam',
    startedAt: new Date(),
    timeLimit: 14400, // 4 hours in seconds (adjust to real exam duration)
    status: 'in_progress',
  });
  return attempt;
}

// Server: validate submission timing
async function submitExam(attemptId: string, answers: Answer[]) {
  const attempt = await db.attempt.findUnique({ where: { id: attemptId } });
  const deadline = new Date(attempt.startedAt.getTime() + attempt.timeLimit * 1000);
  const gracePeriod = 30_000; // 30 seconds grace for network latency

  if (Date.now() > deadline.getTime() + gracePeriod) {
    throw new Error('Exam time expired');
  }
  // Score and save...
}

// Client: derive remaining time from server data
function useExamTimer(startedAt: Date, timeLimitSeconds: number) {
  const [remaining, setRemaining] = useState(() => {
    const elapsed = (Date.now() - startedAt.getTime()) / 1000;
    return Math.max(0, timeLimitSeconds - elapsed);
  });
  // countdown via useEffect interval...
}
```

### Pattern 3: Scoring as a Pure Function

**What:** Score calculation is a stateless, pure function that takes question definitions and user answers, returning a score breakdown. This makes scoring testable, auditable, and easy to recalculate if scoring rules change.

**When to use:** Always. Scoring logic must never be entangled with database operations or UI state.

**Trade-offs:** Requires passing all necessary data into the function rather than querying from within. This is a feature, not a bug.

**Example:**
```typescript
// lib/quiz/scoring.ts
interface ScoreResult {
  totalCorrect: number;
  totalQuestions: number;
  percentage: number;
  perChapter: Record<string, { correct: number; total: number; percentage: number }>;
  csScore: { correct: number; total: number };
  cmScore: { correct: number; total: number };
}

function scoreAttempt(
  questions: AttemptQuestion[],
  answers: Map<string, string[]>  // questionId -> selected option IDs
): ScoreResult {
  let totalCorrect = 0;
  const perChapter: Record<string, { correct: number; total: number }> = {};

  for (const question of questions) {
    const userAnswer = answers.get(question.id) ?? [];
    const isCorrect = arraysEqual(
      userAnswer.sort(),
      question.correctOptionIds.sort()
    );
    if (isCorrect) totalCorrect++;

    // Aggregate per chapter
    if (!perChapter[question.chapterId]) {
      perChapter[question.chapterId] = { correct: 0, total: 0 };
    }
    perChapter[question.chapterId].total++;
    if (isCorrect) perChapter[question.chapterId].correct++;
  }

  return {
    totalCorrect,
    totalQuestions: questions.length,
    percentage: (totalCorrect / questions.length) * 100,
    perChapter: /* add percentages */,
    csScore: /* filter by type */,
    cmScore: /* filter by type */,
  };
}
```

### Pattern 4: Stripe Webhook-Driven Subscription Sync

**What:** Subscription state is managed by Stripe as the source of truth. Your database stores a local copy of subscription status, synced via webhooks. Never trust the client to determine access -- always check subscription status server-side.

**When to use:** For the entire payment/access-gating layer.

**Trade-offs:** Webhook handling must be idempotent (same event processed twice produces same result). Requires a webhook secret and signature verification. Adds slight complexity but is the only reliable pattern for SaaS billing.

**Example:**
```typescript
// api/webhooks/stripe/route.ts
async function handleStripeWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      const sub = event.data.object as Stripe.Subscription;
      await db.subscription.upsert({
        where: { stripeSubscriptionId: sub.id },
        update: {
          status: sub.status,        // active, past_due, canceled, etc.
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
          plan: sub.items.data[0].price.id,
        },
        create: { /* ... */ },
      });
      break;
    case 'invoice.payment_failed':
      // Flag user, send dunning email
      break;
    case 'customer.subscription.deleted':
      // Revoke access
      break;
  }
}
```

### Pattern 5: Immediate vs Deferred Feedback Mode

**What:** Inspired by Moodle's question behaviour system, the quiz engine supports two feedback modes configurable per test session: (1) immediate feedback where the correct answer is shown after each question, and (2) deferred feedback where all results are shown only at the end. The mode is set at attempt creation and governs what the API returns after each answer submission.

**When to use:** Practice mode uses either (user chooses), exam simulation always uses deferred.

**Trade-offs:** The API must conditionally include/exclude correct answers in responses based on mode. Simple to implement with a mode flag on the attempt.

## Data Flow

### Request Flow: Taking a Practice Test

```
Student selects chapter + feedback mode
    |
    v
[Client] POST /api/quiz/start { chapterId, mode: 'practice', feedbackMode: 'immediate' }
    |
    v
[Quiz Service] Selects questions from chapter, creates Attempt record
    |
    v
[Database] INSERT attempt + attempt_questions (question snapshot)
    |
    v
[Client] receives attempt with questions (without correct answers)
    |
    v
Student answers question N
    |
    v
[Client] POST /api/quiz/answer { attemptId, questionId, selectedOptionIds }
    |
    v
[Quiz Service] Stores answer, if immediate mode: returns correctness + correct answer
    |
    v
... repeat for all questions ...
    |
    v
[Client] POST /api/quiz/complete { attemptId }
    |
    v
[Quiz Service] Runs scoreAttempt(), stores ScoreResult
    |
    v
[Analytics Service] Updates per-chapter aggregates, recalculates percentile
    |
    v
[Client] receives full ScoreResult + chapter breakdown
```

### Request Flow: Exam Simulation

```
Student starts exam simulation
    |
    v
[Client] POST /api/quiz/start { mode: 'exam' }
    |
    v
[Quiz Service] Selects 50 CS + 150 CM randomly, creates timed Attempt
    |
    v
[Database] INSERT attempt (startedAt=now, timeLimit=exam_duration, mode=exam)
    |
    v
[Client] receives 200 questions, starts client timer from server timestamp
    |
    v
Student answers questions (answers saved incrementally or in batches)
    |
    v
[Client] POST /api/quiz/answer { attemptId, questionId, selectedOptionIds }
    |                                    (no feedback returned -- deferred mode)
    v
... timer expires or student submits ...
    |
    v
[Client] POST /api/quiz/complete { attemptId }
    |
    v
[Quiz Service] Validates deadline, runs scoreAttempt()
    |
    v
[Comparison Service] Calculates percentile vs all exam attempts
    |
    v
[Admission Service] Compares score against historical admission thresholds
    |
    v
[Client] receives: score, per-chapter breakdown, percentile, admission prediction
    ("Cu acest scor ai fi fost admis la X din ultimii 5 ani")
```

### Request Flow: Stripe Subscription Lifecycle

```
Student clicks "Subscribe"
    |
    v
[Client] POST /api/stripe/create-checkout { priceId }
    |
    v
[Stripe Service] Creates Stripe Checkout Session
    |
    v
[Client] Redirects to Stripe Checkout page
    |
    v
Student completes payment on Stripe
    |
    v
[Stripe] Sends webhook: checkout.session.completed
    |
    v
[Webhook Handler] Verifies signature, creates/updates local subscription record
    |
    v
[Database] User's subscription status = 'active'
    |
    v
... monthly renewal ...
    |
    v
[Stripe] Sends webhook: invoice.payment_succeeded (or failed)
    |
    v
[Webhook Handler] Updates subscription status, sends email if failed
    |
    v
[Middleware] On every protected route: checks subscription status before serving
```

### State Management

```
[Quiz State (Client)]
    |
    +-- currentQuestionIndex: number
    +-- answers: Map<questionId, selectedOptionIds>
    +-- timeRemaining: number (derived from server startedAt)
    +-- feedbackMode: 'immediate' | 'deferred'
    +-- status: 'not_started' | 'in_progress' | 'reviewing' | 'completed'
    |
    v (on answer)
[Local State Update] --> [API Call to persist answer server-side]
    |
    v (on complete)
[API Call] --> [Server scores] --> [Client displays results]
```

Client state is ephemeral and reconstructable. The server is the source of truth for all answers, scores, and timing. If the client crashes mid-quiz, the attempt can be resumed from the last server-persisted answer.

### Key Data Flows

1. **Question lifecycle:** Admin creates/imports questions -> Question Bank (DB) -> Quiz Engine selects for attempt -> Student answers -> Scoring engine grades -> Analytics aggregates
2. **Analytics pipeline:** Scored attempts -> per-chapter aggregation -> percentile calculation against all users -> dashboard display with trends over time
3. **Payment lifecycle:** Stripe Checkout -> webhook -> local subscription record -> middleware checks on every protected request
4. **Admission comparison:** Exam score -> lookup historical thresholds from admin-entered data -> determine which specialties/years the student would have qualified for

## Database Schema (Core Entities)

```
+------------------+       +------------------+       +------------------+
|     users        |       |    chapters      |       |   questions      |
+------------------+       +------------------+       +------------------+
| id (PK)          |       | id (PK)          |       | id (PK)          |
| email            |       | name             |       | chapterId (FK)   |
| passwordHash     |       | slug             |       | type (CS/CM)     |
| role (student/   |       | order            |       | text             |
|   admin)         |       | isActive         |       | source           |
| isVerified       |       | createdAt        |       | isActive         |
| subscriptionId   |       +------------------+       | createdAt        |
| createdAt        |                                  +------------------+
+------------------+                                          |
        |                                                     |
        |       +------------------+                +------------------+
        |       |   options        |                |   attempts       |
        |       +------------------+                +------------------+
        |       | id (PK)          |                | id (PK)          |
        |       | questionId (FK)  |<------+        | userId (FK)      |
        |       | text             |       |        | mode (practice/  |
        |       | isCorrect        |       |        |   mixed/exam)    |
        |       | order            |       |        | chapterId (FK?)  |
        |       +------------------+       |        | feedbackMode     |
        |                                  |        | startedAt        |
        |                                  |        | timeLimit        |
        +--------------------------------->|        | completedAt      |
                                           |        | status           |
                                           |        | totalScore       |
                                           |        +------------------+
                                           |                |
                                  +------------------+      |
                                  | attempt_answers  |<-----+
                                  +------------------+
                                  | id (PK)          |
                                  | attemptId (FK)   |
                                  | questionId (FK)  |
                                  | selectedOptions  |  (JSON array of option IDs)
                                  | isCorrect        |
                                  | answeredAt       |
                                  +------------------+

+------------------+       +------------------+
|  subscriptions   |       | admission_data   |
+------------------+       +------------------+
| id (PK)          |       | id (PK)          |
| userId (FK)      |       | year             |
| stripeSubId      |       | specialty        |
| stripeCustomerId |       | threshold        |
| status           |       | availableSpots   |
| plan             |       | createdAt        |
| currentPeriodEnd |       +------------------+
| createdAt        |
+------------------+
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-500 users | Monolith is perfect. Single Next.js app, single PostgreSQL instance, no caching needed. Optimize for development speed. |
| 500-5k users | Add database indexes on hot queries (attempts by userId, questions by chapterId). Cache analytics aggregations (leaderboard, percentiles) with a short TTL -- either in-memory or Redis. Consider connection pooling. |
| 5k-50k users | Materialized views or pre-computed tables for analytics (daily aggregation job). CDN for static assets. Consider read replicas if DB becomes a bottleneck. This is the ceiling for this niche (Romanian dental residency). |
| 50k+ users | Unlikely for this domain. If reached, extract analytics into a separate service, add Redis for session/cache, consider serverless functions for webhook processing. |

### Scaling Priorities

1. **First bottleneck: Analytics queries.** Percentile calculations across all exam attempts get slow as data grows. Fix with pre-computed aggregation tables updated on each exam completion, or a nightly batch job.
2. **Second bottleneck: Question assembly for exams.** Random selection from a large pool with type constraints. Fix with proper indexes (`type`, `isActive`, `chapterId`) and potentially caching the active question pool in memory.
3. **Third bottleneck: Concurrent exam sessions.** Many students taking exams simultaneously means many writes to attempt_answers. PostgreSQL handles this fine at the expected scale. Batch answer saves (every 5-10 answers instead of each one) if needed.

## Anti-Patterns

### Anti-Pattern 1: Client-Side Scoring

**What people do:** Calculate the score in the browser and send the final score to the server.
**Why it's wrong:** Trivially cheatable. Anyone can open browser devtools and modify the score before submission. Also breaks if the client crashes.
**Do this instead:** Client sends raw answers (selected option IDs). Server looks up correct answers and calculates score. Client never receives correct answers until scoring is complete (in deferred mode).

### Anti-Pattern 2: Storing Correct Answers in Quiz Payload

**What people do:** Send the full question with correct answers marked to the client, then check answers client-side.
**Why it's wrong:** Users can inspect the network response and see all correct answers before answering. Defeats the entire purpose of a quiz.
**Do this instead:** API returns questions without correct answer indicators. Correct answers stay server-side until the scoring/feedback moment.

### Anti-Pattern 3: Hardcoded Question Types

**What people do:** Build separate quiz flows for CS and CM questions with duplicated logic.
**Why it's wrong:** Violates DRY. CS is just CM with exactly 1 correct answer. The rendering differs (radio vs checkbox) but the scoring logic and data model are identical.
**Do this instead:** Single question model with `type` field. UI renders radio buttons for CS, checkboxes for CM. Scoring function treats both the same: compare sorted selected IDs with sorted correct IDs.

### Anti-Pattern 4: Mixing Question Bank and Quiz Engine

**What people do:** Query live question data during a quiz attempt, so if an admin edits a question mid-exam, the student sees the changed version.
**Why it's wrong:** Breaks exam integrity. A question's text or correct answers might change between when a student reads it and when they answer.
**Do this instead:** Snapshot question data into the attempt when the quiz starts. The attempt stores a frozen copy of each question. Admin edits only affect future attempts.

### Anti-Pattern 5: Client-Only Timer

**What people do:** Run the exam timer entirely in JavaScript with no server-side tracking.
**Why it's wrong:** User can pause execution, modify the timer variable, or simply close the tab and come back later.
**Do this instead:** Server records `startedAt` and `timeLimit`. Client derives remaining time from server timestamp. Server rejects submissions after deadline + grace period.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Stripe | Checkout Sessions + Webhooks | Use Stripe Checkout (hosted) for payment page. Sync subscription state via webhooks. Never rely on client-side redirect for payment confirmation -- always wait for webhook. |
| Email (Resend/Nodemailer) | Transactional emails triggered by server events | Email verification on signup, password reset tokens, subscription confirmations, payment failure notifications. Use a queue or background job for non-blocking send. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Auth <-> Quiz Engine | Middleware: auth check before any quiz API | User must be authenticated AND have active subscription. Two-layer gate. |
| Quiz Engine <-> Question Bank | Function calls within the same codebase | No API boundary needed in monolith. Clear module separation via imports from `lib/quiz/`. |
| Quiz Engine <-> Analytics | Event-driven: after scoring, update analytics | On attempt completion, call analytics aggregation. Can be synchronous in monolith (just a function call after scoring). |
| Admin <-> Question Bank | CRUD operations + bulk import | Admin routes call question bank functions. Import parses Excel/CSV and calls bulk create. |
| Stripe Webhooks <-> Subscription State | Webhook handler updates DB, middleware reads DB | Decoupled: webhook writes, middleware reads. No direct coupling between payment and quiz logic. |
| Admission Comparison <-> Analytics | Read-only lookup | After exam scoring, lookup historical thresholds. Simple query, no complex integration. |

## Build Order (Dependency Chain)

The architecture has clear dependency layers that dictate build order:

```
Phase 1: Foundation (no dependencies)
    +-- Database schema + migrations
    +-- Auth system (register, login, verify, reset)
    +-- Basic project structure + PWA manifest
    |
Phase 2: Core Content (depends on Phase 1)
    +-- Question Bank: chapters CRUD, questions CRUD
    +-- Admin panel for content management
    +-- Excel/CSV import/export
    |
Phase 3: Quiz Engine (depends on Phase 2)
    +-- Practice mode (chapter-based, no timer)
    +-- Mixed practice mode (all chapters, no timer)
    +-- Immediate vs deferred feedback
    +-- Scoring engine
    |
Phase 4: Exam Simulation (depends on Phase 3)
    +-- Timed exam mode (50 CS + 150 CM)
    +-- Server-authoritative timer
    +-- Deferred-only feedback
    +-- Historical admission comparison
    |
Phase 5: Analytics + Social (depends on Phase 3)
    +-- Per-chapter statistics
    +-- Progress trends (daily/weekly)
    +-- Anonymous leaderboard + percentiles
    +-- Motivational messages
    |
Phase 6: Monetization (can parallel Phase 3+)
    +-- Stripe integration
    +-- Subscription management
    +-- Access gating middleware
    +-- Payment webhooks
```

**Rationale:** You cannot build quiz-taking without questions (Phase 2 before 3). You cannot build exam simulation without the base quiz engine (Phase 3 before 4). Analytics requires scored attempts to exist (Phase 3 before 5). Stripe can be built in parallel with quiz features since it only gates access -- it does not change quiz logic.

## Sources

- [Moodle Question Engine API](https://moodledev.io/docs/5.0/apis/subsystems/question) -- Architecture patterns for question bank / engine separation, question types, behaviours (HIGH confidence)
- [Tutorials24x7 Quiz Database Design](https://www.tutorials24x7.com/mysql/guide-to-design-database-for-quiz-in-mysql) -- Database schema patterns for quiz systems (MEDIUM confidence)
- [Stripe Subscription Webhooks](https://docs.stripe.com/billing/subscriptions/webhooks) -- Webhook-driven subscription lifecycle (HIGH confidence)
- [Stripe Build Subscriptions](https://docs.stripe.com/billing/subscriptions/build-subscriptions) -- Subscription integration patterns (HIGH confidence)
- [Vercel Next.js Subscription Payments](https://github.com/vercel/nextjs-subscription-payments) -- Reference architecture for Next.js + Stripe SaaS (HIGH confidence)
- [Next.js PWA Guide](https://nextjs.org/docs/app/guides/progressive-web-apps) -- Official PWA support in Next.js (HIGH confidence)
- [Building Offline-First Next.js PWAs](https://www.getfishtank.com/insights/building-native-like-offline-experience-in-nextjs-pwas) -- Offline architecture patterns (MEDIUM confidence)
- [Stripe Webhook Best Practices](https://www.stigg.io/blog-posts/best-practices-i-wish-we-knew-when-integrating-stripe-webhooks) -- Idempotency, error handling (MEDIUM confidence)
- [Moodle Quiz Timer Discussion](https://tracker.moodle.org/browse/MDL-58926) -- Server-client timer sync challenges (MEDIUM confidence)

---
*Architecture research for: grile-ReziNOTE (Romanian dental residency exam prep platform)*
*Researched: 2026-03-02*
