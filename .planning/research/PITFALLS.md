# Pitfalls Research

**Domain:** Medical exam prep / quiz platform (Romanian dental residency)
**Researched:** 2026-03-02
**Confidence:** HIGH (scoring rules verified against official methodology; Stripe/PWA pitfalls verified against official docs and multiple sources)

## Critical Pitfalls

### Pitfall 1: Wrong Scoring Algorithm for Complement Multiplu (CM) Questions

**What goes wrong:**
The Romanian residency exam uses a specific partial-credit scoring formula for CM questions that is NOT the obvious "all or nothing" approach most quiz platforms default to. The official methodology scores each of the 5 options independently: 1 point for each correctly marked correct answer, plus 1 point for each correctly unmarked incorrect answer. This means a question with 2 correct answers where you mark 1 correct and 1 incorrect gives you 3/5 points (the 1 correct you got + the 3 incorrect you left unmarked), not 0 and not 2.5.

Additionally, marking fewer than 2 or more than 4 answers annuls the question entirely (0 points). CS questions award 4 points for the single correct answer, and marking anything other than exactly 1 answer also annuls (0 points).

**Why it happens:**
Developers default to simple scoring: "count correct selections / total correct options" or "all-or-nothing." The Romanian methodology is a bespoke per-option evaluation system where correctly NOT selecting wrong answers also earns points. This is non-obvious and easy to get wrong.

**How to avoid:**
- Implement the exact official formula: for each of the 5 options, award 1 point if (option is correct AND selected) OR (option is incorrect AND not selected). Sum all 5 for the question score.
- CS questions: 4 points if exactly 1 answer marked and it is correct, else 0.
- CM questions: Apply per-option scoring. Enforce 2-4 selection constraint (annul if violated).
- Write exhaustive unit tests covering: full correct, partial correct, overselection annulment, underselection annulment, all wrong, mixed correct/incorrect selections.
- Test with real past exam data if available.

**Warning signs:**
- Scores in practice tests don't match what students calculate manually.
- Students report "my score should be higher/lower."
- No unit tests specifically covering the per-option scoring formula.
- Scoring logic embedded in UI code rather than a pure, testable function.

**Phase to address:**
Core quiz engine phase (Phase 1/2). Scoring MUST be the first thing built and tested. Every feature downstream (analytics, comparisons, simulations) depends on correct scoring. Get this wrong and everything built on top is meaningless.

---

### Pitfall 2: Exam Simulation Timer Trusting the Client

**What goes wrong:**
The exam simulation has a time limit. If the timer runs purely in the browser, students can manipulate it (pause, extend) via DevTools, or the timer drifts due to browser throttling of background tabs. Worse: if the student closes the tab or loses connection during a timed exam, all answers may be lost if there is no server-side persistence and autosave.

**Why it happens:**
Client-side timers are easy to implement. `setInterval` is the first thing developers reach for. Browser tab throttling (especially on mobile) causes timers to drift significantly -- a tab in the background may only fire timers once per minute in some browsers. The `beforeunload` event is unreliable across browsers and cannot perform async operations (like saving answers to a server).

**How to avoid:**
- Record exam start time on the server. Calculate remaining time as `server_start + duration - server_now` on each sync.
- Autosave answers to the server every 30-60 seconds AND on every answer change (debounced).
- Use `visibilitychange` API to detect tab backgrounding and sync timer on return.
- On exam load, always fetch remaining time from server (not localStorage).
- On submit, validate server-side that the exam is still within the time window.
- Store answers progressively: each answer saved individually, not as a single bulk payload at the end.

**Warning signs:**
- Timer implemented with only `setInterval` and no server reference.
- No autosave mechanism -- answers only submitted on final "Submit" click.
- No handling for `visibilitychange` or `beforeunload`.
- Timer shows different values after browser tab switch.

**Phase to address:**
Exam simulation phase. This must be built correctly from the start -- retrofitting autosave into a submit-at-end architecture requires significant refactoring.

---

### Pitfall 3: Stripe Subscription State Desynchronization

**What goes wrong:**
The local database says a user is subscribed, but Stripe says they are not (or vice versa). The user either gets free access or gets locked out despite paying. This happens because Stripe webhooks arrive out of order, get duplicated, or fail silently. Common scenario: `invoice.payment_failed` arrives before `invoice.created`, or a webhook endpoint returns 500 once, Stripe retries, and the event gets processed twice (double crediting or double revoking).

**Why it happens:**
Stripe explicitly does not guarantee event delivery order. Webhook endpoints might receive the same event more than once. Developers assume events arrive in logical sequence and process them naively. Stripe also won't alert about endpoint failures for multiple days.

**How to avoid:**
- Make all webhook handlers idempotent: store processed event IDs and skip duplicates.
- Use Stripe as the source of truth: on any subscription-related webhook, fetch the current subscription state from Stripe's API rather than inferring it from the event alone.
- Use database transactions for subscription status updates.
- Implement a reconciliation job that periodically compares local subscription status with Stripe's API.
- Verify webhook signatures within the 5-minute window.
- Return 200 immediately after persisting the raw event, then process asynchronously.
- Monitor webhook delivery health -- do not rely on Stripe's delayed failure notifications.

**Warning signs:**
- No event ID deduplication in webhook handler.
- Subscription status updated based solely on event type without fetching current Stripe state.
- No reconciliation mechanism between local DB and Stripe.
- Users reporting "I paid but can't access" or accessing content after cancellation.

**Phase to address:**
Payment integration phase. Must be built with idempotency from day one -- retrofitting idempotency into a naive webhook handler while users are actively subscribed is high-risk.

---

### Pitfall 4: PWA Serving Stale Quiz Content After Question Bank Updates

**What goes wrong:**
Admin updates a question (fixes a wrong answer, edits text, changes the correct option). Students using the PWA continue to see the old question from the service worker cache. They answer based on outdated content, get scored against the new correct answer, and their score is wrong. Or worse: cached questions reference deleted options. Safari is particularly aggressive about caching API responses.

**Why it happens:**
Cache-first service worker strategies serve cached content without checking for updates. Quiz data (questions, answers, chapters) is treated like static content when it should be treated as dynamic. Developers test updates by clearing cache manually in DevTools, but real users never do this.

**How to avoid:**
- Use network-first (or stale-while-revalidate) caching strategy for ALL quiz content API endpoints. Cache-first only for truly static assets (CSS, JS bundles, images).
- Version quiz content: include a content version hash in API responses. Client checks version on each quiz start.
- When admin publishes question changes, increment a global content version. Client detects version mismatch on next network request and invalidates quiz cache.
- Never cache API responses for quiz data in the service worker's default cache. Use a separate, explicitly managed cache with TTL.
- Show a "content updated, please refresh" notification when version mismatch is detected mid-session.

**Warning signs:**
- Service worker uses the same caching strategy for static assets and API responses.
- No content versioning mechanism.
- Students report seeing questions that admin has already deleted or modified.
- No cache invalidation strategy documented.

**Phase to address:**
PWA implementation phase, but the content versioning API must be designed in the quiz engine phase. The API needs to support version checking before the PWA can consume it.

---

### Pitfall 5: Analytics Data Corruption from Retroactive Question Changes

**What goes wrong:**
Admin changes the correct answer for a question after students have already answered it. Historical analytics now show incorrect performance data: a student who answered correctly before the change now appears incorrect. Aggregate statistics (per-chapter accuracy, percentiles, comparisons) become unreliable. Students notice their historical accuracy dropping without taking new tests.

**Why it happens:**
The system re-evaluates historical answers against the current correct answer rather than the answer that was correct at the time the student took the test. This is the most common data integrity failure in quiz platforms.

**How to avoid:**
- Store the correct answer(s) at the time of test submission as part of the test result record. Never re-evaluate old answers against current question data.
- When a question is edited, create a new version. Historical results reference the old version.
- Question edits should be a "soft update": create a new version, keep old version for historical reference, mark old version as superseded.
- Admin UI should show a warning: "X students have already answered this question. Editing will not change their historical scores."
- Analytics always compute from the stored-at-submission correct answers, never from current question data.

**Warning signs:**
- Answer results table references question ID but not a question version or snapshot of the correct answer.
- No question versioning or audit trail in the data model.
- Students report score changes on tests they took days/weeks ago.
- Admin complains about not being able to "fix" past scores.

**Phase to address:**
Data model design (Phase 1). The decision to snapshot correct answers at submission time must be made before any data is stored. Retrofitting versioning after thousands of test results exist is extremely painful.

---

### Pitfall 6: Random Question Selection Producing Unrepresentative Exams

**What goes wrong:**
The real exam draws 200 questions: 50 CS + 150 CM from the full curriculum. A naive `ORDER BY RANDOM() LIMIT 200` can produce simulations heavily biased toward chapters with more questions in the bank, leaving some chapters with zero representation. A student might simulate an exam and never see questions from 3 chapters, making the simulation a poor predictor of real exam performance.

**Why it happens:**
Simple random selection is proportional to the question pool size per chapter. If Chapter A has 300 questions and Chapter B has 50, random selection will over-represent A by 6:1. The real exam uses a curated distribution, but platforms implement pure random for simplicity.

**How to avoid:**
- Implement stratified random selection: define expected question distribution per chapter (ideally configurable by admin to match real exam patterns).
- At minimum, ensure every chapter is represented with at least N questions proportional to its curriculum weight.
- Separate the CS and CM pools: randomly select 50 from the CS pool and 150 from the CM pool, applying stratification to each.
- Allow admin to configure chapter weights for simulation mode.
- Track which questions a student has seen recently and reduce repetition probability (spaced repetition flavor).
- Log the question selection for each simulation for debugging/fairness review.

**Warning signs:**
- Pure `RANDOM()` selection with no stratification.
- Some chapters never appear in simulations despite having questions in the bank.
- Students report seeing the same questions repeatedly while never seeing others.
- No chapter weight configuration in admin panel.

**Phase to address:**
Exam simulation phase. The selection algorithm must be designed before simulations go live. It can start simple (proportional stratification) and improve later, but pure random is not acceptable.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Scoring logic in frontend only | Faster to build initial quiz UI | Cannot trust scores; cheating trivial; scoring changes require app update | Never -- scoring must be server-validated |
| Single table for questions (no versioning) | Simpler CRUD, fewer joins | Cannot safely edit questions after students answer them; analytics corruption | Only during initial admin-only testing before any student data exists |
| Polling Stripe API instead of webhooks | Simpler to implement, no webhook infrastructure | High latency on subscription changes; API rate limits; users locked out for minutes after paying | Acceptable as interim while webhooks are being built, max 1-2 weeks |
| localStorage for exam progress | Works offline, no server dependency | Data lost on cache clear, device switch, or browser update; easy to manipulate | Only as fallback alongside server-side autosave |
| Hardcoded chapter list | Quick setup, no admin UI needed | Cannot add chapters without code deploy; violates project requirement for flexible chapters | Never -- project explicitly requires admin-defined chapters |
| All-or-nothing CM scoring | Much simpler to implement | Fundamentally wrong scores; students will immediately notice and lose trust | Never -- the official formula must be implemented |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Stripe Subscriptions | Checking payment status synchronously after checkout redirect (race condition: redirect happens before webhook) | Use webhooks as the source of truth. Show "processing" state after checkout until webhook confirms. Fallback: poll Stripe API for a few seconds after redirect. |
| Stripe Romania | Assuming only EUR works. Not handling RON currency. | Stripe supports both EUR and RON in Romania. Price in RON to avoid exchange rate confusion for Romanian students. Configure Stripe with RON as settlement currency. |
| Excel/CSV Import | Assuming consistent encoding (UTF-8). Romanian characters (diacritics) get corrupted. | Detect encoding on upload (check BOM, try UTF-8 then Windows-1252/ISO-8859-2). Validate diacritics after import. Show preview before committing. |
| Excel/CSV Import | No validation -- importing 1000 rows and silently accepting malformed data. | Validate row-by-row. Return detailed error report with row numbers. Support partial import (skip bad rows, import good ones, report both). |
| PWA Install | Assuming `beforeinstallprompt` fires reliably. It does not fire if PWA criteria are not met (HTTPS, valid manifest, service worker). | Test install flow on actual mobile devices. Provide manual "Add to Home Screen" instructions as fallback. Do not block core functionality on PWA install. |
| Service Worker Updates | Not handling the "waiting" state -- new service worker installed but old one still controlling the page. | Implement "skipWaiting" with user prompt: "New version available. Reload?" Never force-reload during an active exam. |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| N+1 queries on question loading | Quiz start takes 3-5 seconds as question count grows | Eager load questions with their options and correct answers in a single query. Use query batching. | At 500+ questions per chapter, noticeable with 1000+ |
| Unindexed analytics queries | Dashboard loads slowly, especially "per-chapter accuracy" and percentile calculations | Index on (user_id, question_id, created_at). Pre-compute aggregates on test submission rather than calculating on dashboard load. | At 100+ users with 50+ tests each (~5000 result rows per user) |
| Full table scan for random question selection | Exam simulation start takes 5-10 seconds | Use `TABLESAMPLE` (Postgres) or pre-materialized random orderings. Avoid `ORDER BY RANDOM()` on large tables. | At 5000+ questions in the bank |
| Loading all questions for a chapter test | Page becomes unresponsive on mobile | Paginate or lazy-load questions. For "see all" mode, virtualize the list. | At 200+ questions in a single chapter test |
| Recalculating leaderboard on every page load | Dashboard API response time grows linearly with user count | Cache leaderboard/percentile data. Recalculate on new simulation submission, not on every view. Use materialized view or cache with TTL. | At 500+ users with active simulations |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Sending correct answers to the frontend before submission | Students inspect network tab to see all correct answers, defeating the exam simulation purpose | Send only question + options to client. Evaluate answers server-side. Return correct answers only AFTER submission (or per-question only in "immediate feedback" mode). |
| Client-side timer enforcement only | Students can extend exam time indefinitely via DevTools | Server records start time. Server rejects submissions after deadline. Client timer is display-only. |
| No rate limiting on answer submission API | Brute-force correct answers by rapid-submitting all combinations | Rate limit per user per exam session. Reject submissions that exceed human speed (e.g., 200 answers in 5 seconds). |
| Leaking user identity in "anonymous" comparisons | Students can identify peers by score + timing correlation | Use opaque ranking (percentile, distribution buckets) rather than individual score lists. Never include any user metadata in comparison responses. Apply k-anonymity: do not show comparisons until minimum N users have completed the same simulation. |
| Storing raw payment data | PCI compliance violation | Never store card numbers. Stripe handles this entirely. Store only Stripe customer ID and subscription ID. |
| Webhook endpoint without signature verification | Attacker can fake subscription events to grant free access | Always verify Stripe webhook signatures. Reject unsigned or expired signatures. |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing exam results question-by-question during timed simulation | Defeats the purpose of exam simulation -- real exam gives results only at the end | In simulation mode, lock results until submission. In practice mode, offer the choice (immediate vs. end). |
| No confirmation before submitting incomplete exam | Student accidentally hits submit with 50 unanswered questions | Show clear summary: "You answered 150/200 questions. 50 unanswered will score 0. Are you sure?" |
| Romanian diacritics not rendering correctly | Questions look unprofessional and confusing ("s" vs "s-comma" characters) | Enforce UTF-8 throughout. Use proper Romanian diacritics (U+0219/021B with comma, NOT U+015F/0163 with cedilla). Validate in import pipeline. |
| Dashboard showing raw scores without context | Students see "750/1000" but have no idea if that is good or bad | Always show contextual comparison: percentile, historical admission threshold mapping, trend arrows. Raw score alone is almost useless for motivation. |
| Overwhelming analytics on first visit | New student sees empty charts and zero-state dashboards, feels lost | Show onboarding state: "Take your first practice test to see your stats here." Progressive disclosure of analytics as data accumulates. |
| No way to review wrong answers after practice test | Students finish a test, see their score, but cannot go back to learn from mistakes | Always provide detailed review: show the question, what they picked, what was correct, and the source/reference. This is the #1 learning mechanism. |

## "Looks Done But Isn't" Checklist

- [ ] **Scoring engine:** Often missing the annulment rules (fewer than 2 or more than 4 selections on CM = 0 points) -- verify with edge case tests
- [ ] **Exam simulation:** Often missing the 50 CS + 150 CM composition rule -- verify that generated exams always have exactly this split
- [ ] **Timer:** Often missing server-side validation -- verify that submitting after time expires is rejected server-side, not just hidden by UI
- [ ] **Stripe webhooks:** Often missing idempotency -- verify by sending the same event twice and checking that the user is not double-credited or double-revoked
- [ ] **Anonymous comparison:** Often missing minimum participant threshold -- verify that comparison data is not shown when fewer than N users have completed that simulation
- [ ] **Excel import:** Often missing encoding handling for Romanian diacritics -- verify by importing a file with characters like "s-comma" and "t-comma"
- [ ] **PWA offline:** Often missing cache invalidation for question content -- verify by editing a question in admin, then checking mobile PWA without manual cache clear
- [ ] **Autosave:** Often missing conflict resolution -- verify by answering on two devices simultaneously and checking which answers persist
- [ ] **Historical admission data:** Often missing the per-speciality granularity -- verify that admin can enter different thresholds per speciality per year, not just a single cutoff
- [ ] **Question CRUD:** Often missing soft-delete -- verify that deleting a question does not break historical test results that reference it

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Wrong scoring algorithm discovered after launch | HIGH | Recalculate all historical scores with correct formula. Notify affected users. If data model snapshots correct answers, recalculation is possible. If not, some results are irrecoverable. |
| Stripe subscription desync | MEDIUM | Run reconciliation script comparing all local statuses with Stripe API. Fix mismatches. Add idempotency to prevent recurrence. Potentially issue refunds or extend access for affected users. |
| Analytics corruption from question edits | HIGH | If correct answers were not snapshotted at submission time, historical accuracy data is unrecoverable. Must implement versioning going forward and mark all pre-versioning analytics as "approximate." |
| Stale PWA content | LOW | Force service worker update by incrementing version. Add cache-busting to API calls. Notify users to reload. |
| Lost exam answers (no autosave) | HIGH | Data is gone. Must refund simulation attempt, apologize, and implement autosave immediately. Student trust damage is the real cost. |
| Random selection bias discovered | LOW | Fix the selection algorithm. Historical simulations are already completed -- their educational value was reduced but scores are not wrong. No data migration needed. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Wrong CM/CS scoring formula | Data model + quiz engine (Phase 1-2) | Unit tests with 20+ edge cases covering all scoring paths; comparison against manually calculated scores from real past exam data |
| Client-side timer manipulation | Exam simulation (Phase 3) | Attempt to submit after server deadline; verify rejection. Modify client timer via DevTools; verify server catches it. |
| Stripe subscription desync | Payment integration (Phase 2-3) | Send duplicate webhooks; send out-of-order events; simulate endpoint downtime then recovery. Verify DB matches Stripe state. |
| Stale PWA quiz content | PWA phase (Phase 4) | Edit question in admin; verify updated content appears in PWA within expected TTL without manual cache clear. |
| Analytics corruption from edits | Data model design (Phase 1) | Edit a question's correct answer; verify historical test results retain original scores. Run analytics query; verify old results use snapshotted answers. |
| Unrepresentative random selection | Exam simulation (Phase 3) | Generate 100 simulated exams; verify chapter distribution falls within acceptable variance of expected proportions. Verify 50/150 CS/CM split is exact. |
| Correct answers leaked to frontend | Quiz engine (Phase 1-2) | Inspect all network requests during exam; verify no correct answer data in any response before submission. |
| Anonymous comparison de-anonymization | Analytics/comparison (Phase 3-4) | With fewer than N users, verify comparison endpoints return appropriate minimum-participant message. Verify no user IDs in comparison API responses. |
| Excel import encoding corruption | Content management (Phase 2) | Import CSV/Excel with mixed Romanian diacritics; verify all characters render correctly. Test with Windows-1252 encoded file. |
| Lost exam answers on disconnect | Exam simulation (Phase 3) | Start exam, answer 50 questions, kill the browser process, reopen -- verify all 50 answers are recovered from server-side autosave. |

## Sources

- [Exemplificari privind tipurile de intrebari si modul de punctare - Metodologie (lege5.ro)](https://lege5.ro/Gratuit/gmydkobqheya/exemplificari-privind-tipurile-de-intrebari-si-modul-de-punctare-metodologie?dp=gi3tcnrwha2dony) -- Official scoring methodology
- [Cum se desfasoara - As la rezidentiat](https://aslarezidentiat.wordpress.com/cum-se-desfasoara/) -- Exam structure and scoring examples
- [Stripe Webhooks Documentation](https://docs.stripe.com/webhooks) -- Webhook retry behavior and ordering guarantees
- [Using webhooks with subscriptions - Stripe Docs](https://docs.stripe.com/billing/subscriptions/webhooks) -- Subscription lifecycle events
- [Best practices I wish we knew when integrating Stripe webhooks - Stigg](https://www.stigg.io/blog-posts/best-practices-i-wish-we-knew-when-integrating-stripe-webhooks) -- Real-world webhook integration failures
- [How to handle failed subscription payments in Stripe - Ben Foster](https://benfoster.io/blog/stripe-failed-payments-how-to/) -- Dunning and retry patterns
- [Automate payment retries - Stripe Docs](https://docs.stripe.com/billing/revenue-recovery/smart-retries) -- Smart retry configuration
- [Payments in Romania - Stripe](https://stripe.com/resources/more/payments-in-romania) -- Romania-specific payment methods and currency
- [PWA Update - web.dev](https://web.dev/learn/pwa/update) -- Service worker update lifecycle
- [Service Worker Bugs: Making Offline Mode Work - PixelFreeStudio](https://blog.pixelfreestudio.com/service-worker-bugs-making-offline-mode-work/) -- Common service worker failures
- [When 'Just Refresh' Doesn't Work: Taming PWA Cache Behavior](https://iinteractive.com/resources/blog/taming-pwa-cache-behavior) -- Safari caching API responses aggressively
- [Evaluating Different Scoring Methods for Multiple Response Items - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC8725057/) -- Academic analysis of MC scoring methods
- [Moodle Quiz Autosave Issues](https://moodle.org/mod/forum/discuss.php?d=449111) -- Real-world autosave failures in exam platforms
- [Privacy by Design: FERPA and GDPR in 2026 Education Analytics](https://medium.com/@caseymillermarketer/privacy-by-design-navigating-ferpa-and-gdpr-in-2026-education-analytics-06f27fcded97) -- Student data privacy in analytics

---
*Pitfalls research for: Romanian dental residency exam prep platform (grile-ReziNOT)*
*Researched: 2026-03-02*
