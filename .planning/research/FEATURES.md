# Feature Research

**Domain:** Medical exam prep / quiz platform (Romanian dental residency)
**Researched:** 2026-03-02
**Confidence:** HIGH

## Competitive Landscape Summary

The Romanian residency exam prep market has 5-6 active platforms: Grile-Rezidentiat.ro (market leader, 77K+ questions, all domains), Rezihub (39K questions, strong analytics), Doctor Rezidentiat, MG Rezidentiat, Questmed, and Teste-Medicina.ro. Most focus on general medicine; dental-specific coverage is secondary. None deeply integrate historical admission threshold comparison as a core feature. This is the primary gap ReziNOT can exploit.

International benchmarks (UWorld, AMBOSS, Lecturio) set the standard for explanation quality, analytics depth, and user experience, but are irrelevant for Romanian exam content. Their feature patterns are instructive for design.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete and users leave for Grile-Rezidentiat.ro or Rezihub.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Question bank by chapters** | Every competitor has this. Students study per subject. Core learning mode. | MEDIUM | Admin-defined chapters, each question belongs to a chapter. Support CS (single answer) and CM (multiple answers) question types per the real exam format. |
| **Exam simulation (200 questions, timed)** | Mirrors the actual rezidentiat exam (50 CS + 150 CM, 4 hours). All competitors offer this. | HIGH | Must enforce real exam structure: first 50 are CS, next 150 are CM, random from all chapters. Timer counts down. Results only shown at final submission. This is non-negotiable. |
| **Immediate vs. deferred answer reveal** | Grile-Rezidentiat, Rezihub, Doctor Rezidentiat all offer this toggle. Students want both modes -- learning (see answer immediately) and testing (see at end). | LOW | Per-test toggle. Simple UI switch before starting a quiz. |
| **Mixed/random chapter tests** | Students want to practice across all material, not just one chapter at a time. All competitors offer this. | LOW | Select multiple chapters or "all", randomize question order. No time limit for practice mode. |
| **Score and result tracking** | Every platform saves results history. Students expect to see past test scores. | MEDIUM | Store every test attempt: date, score, time spent, per-question results. Basis for all analytics features. |
| **Basic progress dashboard** | Rezihub, Grile-Rezidentiat, Doctor Rezidentiat all show performance graphs. | MEDIUM | Per-chapter accuracy rates, overall accuracy trend over time, total questions answered. Visual charts (bar, line). |
| **Question source/reference** | Romanian students study from specific textbooks. Competitors show book/page references per question. | LOW | Each question stores source (book title, page). Display alongside answer explanation. |
| **Mobile-friendly / responsive** | All competitors are mobile-optimized. Students study on phones during commutes, breaks. | MEDIUM | PWA approach covers this. Must work well on small screens -- questions, answer selection, timer all usable on mobile. |
| **User authentication** | Required for tracking progress, subscriptions. | MEDIUM | Email + password, email verification, password reset. Standard auth flow. |
| **Subscription payments** | SaaS model. All competitors use freemium + paid tiers. | MEDIUM | Stripe integration. Monthly and annual plans. Free tier with limited access is industry standard. |
| **Admin panel for question CRUD** | Content must be manageable without code changes. All platforms have admin tools. | MEDIUM | Create, read, update, delete questions. Assign to chapters, set CS/CM type, mark correct answers, add source reference. |

### Differentiators (Competitive Advantage)

Features that set ReziNOT apart. These are where the product competes and wins.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Admission threshold comparison after simulation** | THE core differentiator. After completing a simulation, show the student: "With this score, you would have been admitted to [X specialties] based on the last 5 years of real data." No competitor does this with dental-specific historical data integrated into the simulation result screen. This is the #1 reason to come back. | HIGH | Requires admin-maintained historical data (thresholds per specialty per year), scoring algorithm that maps simulation results to historical cutoffs, and a compelling results UI showing where the student stands relative to real admission history. |
| **Anonymous peer comparison (percentile, distribution, ranking)** | Rezihub has basic comparison. ReziNOT goes deeper: percentile rank, score distribution histogram, mean/median, anonymous ranking. Motivates through social comparison without pressure (no names). | HIGH | Only from completed simulations (not practice tests). Requires enough user base for meaningful statistics. Consider showing aggregate data even with small N using ranges. Privacy-first: no usernames exposed. |
| **Per-chapter visual analytics with "wow" factor** | Competitors show basic bar charts. ReziNOT aims for visually impressive, data-rich dashboards: radar charts of chapter strengths, heat maps of weak areas, trend sparklines. | HIGH | The "wow" is in the visual design and data density, not the underlying data. Use a good charting library. Show: accuracy per chapter as radar/spider chart, improvement trend per chapter, comparison to personal average. |
| **Auto-generated motivational messages** | "You improved 15% in Anatomy this week!" / "You've completed more questions than 72% of users." Performance-driven, contextual encouragement. No competitor does this systematically. | MEDIUM | Rule-based system: detect milestones (streak, improvement, percentile change), generate templated messages. Not AI-generated in v1 -- use template strings with data interpolation. Show on dashboard and after test completion. |
| **Historical admission data browser** | Let students explore past years' admission data independently: which specialties, how many spots, what were the cutoffs, how competitive. Turns static admin data into an interactive exploration tool. | MEDIUM | Admin enters data per year/specialty. Frontend shows filterable table and charts. Students can answer "What score did I need for Orthodontics in 2024?" without leaving the platform. |
| **Admin bulk import/export (Excel, CSV)** | Competitors require manual question entry. Bulk import from Excel/CSV dramatically speeds up content loading for the initial 500-2000 question bank. | MEDIUM | CSV/Excel template with columns: question text, option A-E, correct answer(s), CS/CM type, chapter, source. UTF-8 support mandatory for Romanian diacritics. Validate on import, show error report. |
| **PWA installable with offline-capable shell** | While competitors have mobile apps or just responsive web, a PWA gives the "installed app" feel without App Store overhead. | MEDIUM | Service worker for app shell caching. Full offline quiz-taking is v2+ (requires caching questions), but the shell, navigation, and cached results should work offline. Push notifications for streak reminders are a future enhancement. |

### Anti-Features (Commonly Requested, Often Problematic)

Features to deliberately NOT build. These seem good but create problems for this specific project.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **AI-generated explanations** | MG Rezidentiat uses AI explanations. Seems modern and scalable. | Romanian dental exam questions reference specific textbooks. AI explanations may hallucinate, contradict official sources, or give wrong medical information. Liability risk. Students need to trust the platform's accuracy above all else. | Show the source book and page reference for each question. Let the admin optionally add a manual explanation. Trust comes from accuracy, not volume of text. |
| **Real-time chat / forum** | Grile-Rezidentiat has a discussion forum. Students want to discuss questions. | Massive moderation burden for a small team. Medical misinformation risk. Distracts from core quiz engine value. Forum quality degrades without active moderation. | Link to a dedicated Discord/Telegram group managed separately. Keep the platform focused on quiz + analytics. |
| **Video lessons / tutorials** | Some platforms (Lecturio, Boards & Beyond) include video. | Completely different content type requiring different expertise, hosting costs, and production. Not the core value proposition. The product is about practice and simulation, not teaching. | Stay in the "practice and test" lane. Students already have textbooks and university lectures for learning. |
| **Flashcards** | Grile-Rezidentiat has 20K+ flashcards. Anki is popular with med students. | Building a flashcard system with spaced repetition is a separate product. Dilutes focus from the quiz engine. Students who want flashcards already use Anki. | Focus on "wrong questions review" mode -- resurface questions the student got wrong. This is more valuable than generic flashcards because it targets actual weak spots. |
| **Native mobile apps (iOS/Android)** | Users expect "an app." | Double the development cost and maintenance. App Store review delays. The target audience is Romanian dental students -- not millions of users who need native performance. | PWA covers 95% of mobile use cases. Installable, home screen icon, push notifications (eventually). If native is ever needed, it's a v3+ consideration. |
| **OAuth / Google login** | Convenient for users. Reduces friction. | Adds complexity to auth system, dependency on third-party providers, GDPR consent flows for social login. Email+password is sufficient for a niche Romanian student audience. | Add OAuth in v2 if user feedback demands it. For v1, email+password with good UX (remember me, quick reset) is fine. |
| **Spaced repetition algorithm** | Scientifically optimal for learning. Anki popularized it. | Complex to implement correctly. Requires tracking per-question-per-user state. Overkill for exam prep where students cycle through the entire question bank in weeks, not months. The exam has a fixed date -- cramming is the reality. | "Wrong questions review" mode: let students retake questions they previously got wrong. Simpler, more useful for exam prep context than true SRS. |
| **User-generated content (students submit questions)** | Questmed does this with voucher rewards. Scales content. | Quality control nightmare. Medical accuracy matters. Admin review overhead grows linearly with submissions. Potential copyright issues with textbook content. | Keep question authoring admin-only. Focus on quality of the 500-2000 curated questions rather than quantity. |
| **Gamification badges / achievement system** | Drives engagement in educational platforms. Points, badges, levels. | Over-engineering for the target audience. Dental students preparing for a high-stakes exam are intrinsically motivated. Gamification can feel patronizing or childish for adult professional exam prep. | The motivational messages system provides encouragement without gamification theater. The anonymous leaderboard provides competitive motivation. The admission threshold comparison provides the ultimate "game" -- can you get into your dream specialty? |

---

## Feature Dependencies

```
[User Authentication]
    |
    +--requires--> [Question Bank + Chapters (Admin)]
    |                  |
    |                  +--requires--> [Admin Panel CRUD]
    |                  |                  |
    |                  |                  +--enhances--> [Bulk Import/Export]
    |                  |
    |                  +--enables--> [Chapter-based Tests]
    |                  |                 |
    |                  |                 +--enables--> [Mixed/Random Tests]
    |                  |                 |
    |                  |                 +--enables--> [Exam Simulation (200q)]
    |                  |                                   |
    |                  |                                   +--enables--> [Admission Threshold Comparison]
    |                  |                                   |                  |
    |                  |                                   |                  +--requires--> [Historical Admission Data (Admin)]
    |                  |                                   |
    |                  |                                   +--enables--> [Anonymous Peer Comparison]
    |                  |
    |                  +--enables--> [Score & Result Tracking]
    |                                     |
    |                                     +--enables--> [Progress Dashboard]
    |                                     |                  |
    |                                     |                  +--enhances--> [Per-Chapter Visual Analytics]
    |                                     |                  |
    |                                     |                  +--enhances--> [Motivational Messages]
    |                                     |
    |                                     +--enables--> [Wrong Questions Review]
    |
    +--requires--> [Subscription Payments (Stripe)]

[PWA Shell] -- independent, can be built in parallel

[Landing Page] -- independent, can be built in parallel
```

### Dependency Notes

- **Exam Simulation requires Question Bank**: Cannot simulate an exam without questions loaded into chapters.
- **Admission Threshold Comparison requires both Exam Simulation AND Historical Admission Data**: The comparison only makes sense after a completed simulation, mapped against admin-entered historical data.
- **Anonymous Peer Comparison requires Exam Simulation**: Peer stats are only meaningful from standardized simulation attempts, not practice quizzes.
- **Progress Dashboard requires Score Tracking**: Dashboard visualizes stored test results; the tracking system must exist first.
- **Motivational Messages require Progress Dashboard data**: Messages are generated from performance trends, which come from the dashboard data layer.
- **Bulk Import enhances Admin CRUD**: Not required for launch (admin can add questions manually), but dramatically accelerates content loading.
- **Per-Chapter Visual Analytics enhances basic Progress Dashboard**: Build the basic dashboard first, then layer on advanced visualizations.

---

## MVP Definition

### Launch With (v1)

Minimum viable product -- what is needed to validate the core value proposition ("Would I get admitted? Where?").

- [ ] **Landing page** -- professional branding, explains value proposition, converts to signup
- [ ] **Email + password auth** -- registration, email verification, password reset
- [ ] **Admin panel: chapter management** -- CRUD for chapters (flexible, admin-defined)
- [ ] **Admin panel: question CRUD** -- add/edit/delete questions with CS/CM type, options, correct answers, source reference
- [ ] **Admin panel: bulk import from CSV/Excel** -- essential for loading initial 500-2000 question bank efficiently
- [ ] **Chapter-based practice tests** -- select chapter, answer questions, see results (with immediate/deferred answer toggle)
- [ ] **Mixed chapter tests** -- select multiple or all chapters, randomized
- [ ] **Exam simulation** -- 200 questions (50 CS + 150 CM), timed, results at end only
- [ ] **Basic score tracking** -- store all attempts with per-question results
- [ ] **Basic progress dashboard** -- overall accuracy, per-chapter accuracy, trend over time
- [ ] **Admin panel: historical admission data** -- CRUD for past years' thresholds per specialty
- [ ] **Admission threshold comparison** -- after simulation, show "you would have been admitted to X" based on historical data
- [ ] **Stripe subscription** -- monthly/annual plans, free tier with limited daily questions
- [ ] **PWA setup** -- installable, responsive, mobile-optimized
- [ ] **Romanian language UI** -- all interface text in Romanian

### Add After Validation (v1.x)

Features to add once the core is validated and users are actively using the platform.

- [ ] **Anonymous peer comparison** -- percentile, distribution histogram, mean/median, ranking (trigger: 50+ users completing simulations)
- [ ] **Per-chapter visual analytics** -- radar charts, heat maps, sparklines (trigger: users ask for more detailed analytics)
- [ ] **Auto-generated motivational messages** -- performance-based encouragement on dashboard and after tests (trigger: user retention metrics show drop-off)
- [ ] **Wrong questions review mode** -- practice mode that resurfaces previously incorrect questions (trigger: users completing full question bank and wanting targeted review)
- [ ] **Historical admission data browser** -- interactive exploration of past admission data independent of simulations (trigger: users asking about specific specialties outside of simulation flow)

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **OAuth / Google login** -- only if user feedback shows signup friction is a problem
- [ ] **Offline quiz-taking in PWA** -- requires caching question data locally, complex sync logic
- [ ] **Push notifications** -- streak reminders, new simulation available, motivational nudges
- [ ] **Admin question versioning/audit trail** -- track changes to questions over time
- [ ] **Multi-domain support** -- expand beyond dental to general medicine, pharmacy (major expansion)
- [ ] **API for third-party integrations** -- not needed unless partnership opportunities arise

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Question bank by chapters | HIGH | MEDIUM | P1 |
| Exam simulation (200q, timed) | HIGH | HIGH | P1 |
| Admission threshold comparison | HIGH | HIGH | P1 |
| Basic progress dashboard | HIGH | MEDIUM | P1 |
| Score and result tracking | HIGH | MEDIUM | P1 |
| Immediate/deferred answer toggle | HIGH | LOW | P1 |
| Mixed/random chapter tests | HIGH | LOW | P1 |
| Question source/reference | MEDIUM | LOW | P1 |
| Auth (email + password) | HIGH | MEDIUM | P1 |
| Stripe subscription | HIGH | MEDIUM | P1 |
| Admin question CRUD | HIGH | MEDIUM | P1 |
| Admin chapter management | HIGH | LOW | P1 |
| Admin historical data CRUD | HIGH | MEDIUM | P1 |
| Bulk import CSV/Excel | HIGH | MEDIUM | P1 |
| PWA setup | MEDIUM | MEDIUM | P1 |
| Landing page | HIGH | LOW | P1 |
| Anonymous peer comparison | HIGH | HIGH | P2 |
| Per-chapter visual analytics | MEDIUM | HIGH | P2 |
| Motivational messages | MEDIUM | MEDIUM | P2 |
| Wrong questions review | MEDIUM | LOW | P2 |
| Historical data browser | MEDIUM | MEDIUM | P2 |
| OAuth login | LOW | MEDIUM | P3 |
| Offline quiz-taking | LOW | HIGH | P3 |
| Push notifications | LOW | MEDIUM | P3 |
| Multi-domain expansion | HIGH | HIGH | P3 |

**Priority key:**
- P1: Must have for launch -- without these, the product cannot validate its core value proposition
- P2: Should have, add post-launch when core is validated and users are active
- P3: Nice to have, future consideration based on user feedback and growth

---

## Competitor Feature Analysis

| Feature | Grile-Rezidentiat.ro | Rezihub | Doctor Rezidentiat | MG Rezidentiat | ReziNOT (Our Plan) |
|---------|---------------------|---------|-------------------|----------------|-------------------|
| Question count | 77,000+ | 39,000 | Not disclosed | Not disclosed | 500-2000 (curated dental) |
| Domains covered | Med, Dental, Pharma | Medicine | Medicine | Medicine | **Dental only** (focused) |
| Chapter-based tests | Yes | Yes | Yes | Yes | Yes |
| Exam simulation | Yes (200q, timed) | Yes | Yes | Yes | Yes (50 CS + 150 CM) |
| Immediate/deferred answers | Yes | Yes | Yes | Unknown | Yes |
| Progress dashboard | Basic graphs | Detailed | Basic | Basic | **Advanced visuals** |
| Peer comparison | Basic | Real-time score comparison | No | No | **Deep: percentile, histogram, ranking** |
| Admission threshold data | No | No | No | No | **YES -- core differentiator** |
| Motivational messages | No | No | No | No | **YES -- auto-generated** |
| Flashcards | 20,000+ | No | No | No | No (deliberate) |
| Forum/discussion | Yes (moderated) | No | Premium only | No | No (external Discord/Telegram) |
| AI explanations | No | No | No | Yes | No (source reference instead) |
| Bulk import | Unknown | Unknown | Unknown | Unknown | **Yes (CSV/Excel)** |
| Free tier | Yes (1 test/day) | Yes (limited) | Yes (50 grids/day) | Yes (daily free) | Yes (limited daily) |
| PWA | No | No | No | Mobile apps | **Yes** |
| Pricing model | Freemium + premium | Freemium + subscription | Freemium + 15/30-day | Freemium + trial | Freemium + monthly/annual |

### Key Competitive Insights

1. **No competitor integrates historical admission threshold data into simulation results.** This is a genuine gap in the market. Students currently check admission data manually from Ministry of Health documents. Bringing this into the simulation result screen is a compelling, unique value proposition.

2. **Dental-specific focus is underserved.** Most platforms target general medicine. A platform laser-focused on dental residency (smaller question bank but perfectly curated) can win on relevance.

3. **Visual analytics quality is low across competitors.** Basic bar charts and simple percentages dominate. There is room to differentiate with polished, data-rich dashboards.

4. **Anonymous peer comparison exists but is shallow.** Rezihub shows basic comparison; no platform offers percentile ranking, score distribution histograms, or detailed anonymous leaderboards.

5. **Motivational messaging is absent.** No Romanian platform generates personalized encouragement based on performance data. This is an easy differentiator with meaningful engagement impact.

---

## Sources

- [Grile-Rezidentiat.ro](https://app.grile-rezidentiat.ro/) -- Market leader, 77K+ questions, feature benchmark (HIGH confidence)
- [Rezihub](https://rezihub.ro/) -- Strong analytics and peer comparison features (HIGH confidence)
- [Doctor Rezidentiat](https://doctorrezidentiat.ro/) -- Tiered pricing model, structured learning (HIGH confidence)
- [MG Rezidentiat](https://app.mgrezidentiat.ro/) -- Mobile apps, AI explanations (HIGH confidence)
- [Questmed](https://www.questmed.ro/) -- User-contributed content model, body map feature (HIGH confidence)
- [UWorld vs AMBOSS comparison](https://thematchguy.com/uworld-vs-amboss-usmle-step1-step2-step3/) -- International benchmark for quiz platform feature quality (MEDIUM confidence)
- [Lecturio USMLE Qbanks comparison](https://www.lecturio.com/blog/best-usmle-qbanks-2026-uworld-vs-amboss-vs-lecturio/) -- Feature patterns for explanation quality and analytics (MEDIUM confidence)
- [Gamification leaderboards in learning](https://www.growthengineering.co.uk/gamification-leaderboards-lms/) -- Research on social comparison in educational platforms (MEDIUM confidence)
- [Rezidentiat.ms.ro](https://rezidentiat.ms.ro/) -- Official Ministry of Health exam information (HIGH confidence)
- [Romedic article on Grile-Rezidentiat.ro](https://www.romedic.ro/grile-rezidentiat-ro-cea-mai-utilizata-platforma-de-pregatire-pentru-rezidentiat-isi-extinde-orizonturile-0P54758) -- Market positioning context (MEDIUM confidence)
- [MEDIjobs dental residency exam guide](https://medijobs.ro/blog/totul-despre-examenul-de-rezidentiat-la-medicina-dentara) -- Exam structure details (HIGH confidence)
- [Motivational messages and exam performance research](https://www.sciencedirect.com/science/article/pii/S0742051X2400283X) -- Academic evidence for motivational messaging impact (HIGH confidence)

---
*Feature research for: Romanian dental residency exam prep platform (ReziNOT)*
*Researched: 2026-03-02*
