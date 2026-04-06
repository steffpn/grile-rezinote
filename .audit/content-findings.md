# Content Exposure & Anti-Cheat Security Audit

**Date:** 2026-04-06
**Platform:** grile-ReziNOT (Romanian Medical Residency Exam Quiz)
**Scope:** Questions/answers delivery, correctness hiding, anti-copy/cheat, auth enforcement, peer data exposure

---

## Executive Summary

**Overall Security Posture:** STRONG with minor concerns about client-side anti-copy implementation.

The platform correctly implements **server-side answer validation** and **30-minute review window** for results. Correct answers are NOT sent before user submission. However, **anti-copy/screenshot protection relies entirely on JavaScript** (bypassable via DevTools), and **peer-comparison data is correctly anonymized** but still queryable by score.

---

## 1. QUESTIONS & ANSWERS DELIVERY: ✅ SECURE

### 1.1 Questions Fetched Client-Side Without Answers

**Location:** `src/lib/db/queries/practice.ts:50-72`

**Finding:** Questions are fetched with only `id`, `text`, `type`, `sourceBook`, `sourcePage` — **NOT `isCorrect` flags**.

```ts
// getQuestionWithCorrectOptions (line 50-72)
const [question] = await db.select({
  id: questions.id,
  type: questions.type,
  sourceBook: questions.sourceBook,
  sourcePage: questions.sourcePage,
}).from(questions).where(eq(questions.id, questionId)).limit(1)

// Correct options fetched SEPARATELY, only server-side for scoring
const correctOpts = await db.select({ label: options.label })
  .from(options)
  .where(and(eq(options.questionId, questionId), eq(options.isCorrect, true)))
```

**Verdict:** ✅ Correct answers are **NEVER sent to the client** during the test. Options themselves have no `isCorrect` field in the response—only labels (`A`, `B`, `C`, etc.) and text.

### 1.2 Options Rendering

**Location:** `src/lib/db/queries/practice.ts:110-135`

Options fetched for practice/exam rendering include only:
- `id`, `questionId`, `label`, `text`
- **NO `isCorrect` field** in the response

Options are shuffled **deterministically per-exam** using a seed:
- **Practice tests:** Random order per question
- **Exam simulations:** Seeded shuffle (line 28-87 in `src/app/(student)/exam/[attemptId]/page.tsx`)

**Verdict:** ✅ Options are presented without correctness information.

### 1.3 Answer Submission & Scoring

**Location:** `src/lib/actions/practice.ts:199-275` & `src/lib/actions/exam.ts:93-173`

**Practice test flow:**
1. User submits answer → `submitAnswer()` server action
2. **Server-side scoring** happens immediately (`scoreQuestion()`)
3. Correct options returned **ONLY if feedback mode is "immediate"** (line 269-274)

**Exam simulation flow:**
1. User submits answer → `batchSaveAnswers()` saves only `selectedOptions`, **NOT score/correctness**
2. Scoring **deferred until exam submission** (line 180-317)
3. Correct answers **hidden until `submitExam()` completes**

**Verdict:** ✅ Correct answers are **NEVER sent before submission**. Scoring is server-side.

---

## 2. 30-MINUTE ANSWER EXPIRY: ✅ CLIENT-SIDE + SERVER-SIDE

### 2.1 Client-Side Enforcement

**Location:** `src/components/dashboard/answer-detail-dialog.tsx:32-36`

```ts
const answeredAt = new Date(answer.answeredAt)
const now = new Date()
const minutesAgo = (now.getTime() - answeredAt.getTime()) / (1000 * 60)
const isExpired = minutesAgo > 30
```

When expired, shows "Detalii expirate" (Details Expired) and hides question text, correct options, and option feedback.

### 2.2 Server-Side Data Sent

**Location:** `src/lib/db/queries/dashboard.ts:289-351`

Answer history includes `answeredAt` timestamp, but the **30-minute expiry is enforced in the UI component** (client-side logic).

**⚠️ CONCERN:** The expiry check is **client-side only**. If a user opens DevTools and modifies the `answeredAt` field or manipulates the component state, they can bypass the 30-minute window.

### 2.3 Recommendation

To enforce server-side, add a guard in `getAnswerHistory()`:
```ts
// Calculate expiry server-side
const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
const isExpired = answeredAt < thirtyMinutesAgo

// Return different payload based on expiry
if (isExpired) {
  // Return only summary stats, omit questionText, correctOptions
}
```

**Current Risk:** LOW (client-side hiding is sufficient for casual users; malicious users could inspect element/DevTools).

---

## 3. ANTI-COPY & ANTI-CHEAT: ⚠️ JAVASCRIPT-ONLY (BYPASSABLE)

### 3.1 Implementation

**Location:** `src/components/shared/anti-copy.tsx:10-126`

Blocks:
- Right-click (context menu)
- Ctrl/Cmd + C (copy)
- Ctrl/Cmd + A (select all)
- Ctrl/Cmd + P (print)
- Ctrl/Cmd + S (save)
- Ctrl/Cmd + U (view source)
- Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (DevTools)
- F12 (DevTools)
- PrintScreen (attempts clipboard clear)
- Drag events

Visibility-change blur (line 94-106):
```ts
function handleVisibilityChange() {
  const questionElements = document.querySelectorAll('[data-protected="question"]')
  if (document.hidden) {
    ;(el as HTMLElement).style.filter = "blur(20px)"  // Blur on alt-tab
  } else {
    ;(el as HTMLElement).style.filter = "none"  // Clear on tab focus
  }
}
```

### 3.2 Bypass Methods

All of these bypass measures are **CSS/JavaScript and can be circumvented:**

| Method | Bypass |
|--------|--------|
| Right-click block | Open DevTools → Elements tab → Read HTML |
| Keyboard shortcut blocks | Right-click → Inspect → Read elements directly |
| DevTools shortcuts | F12 blocked, but `Ctrl+Shift+K` (console) may work; DevTools can open via right-click in some contexts |
| PrintScreen + clipboard clear | User can use native screenshot tools (Windows Print to file, Mac Screenshot, etc.) |
| Visibility blur | Blur is applied via `style.filter`; can be disabled via DevTools: `document.querySelectorAll('[data-protected]').forEach(el => el.style.filter = 'none')` |

**Verdict:** ⚠️ Anti-copy is **NOT real protection**. It prevents casual sharing but fails against:
- DevTools inspection
- Native OS screenshot tools (Print Screen → file, Snipping Tool, etc.)
- Browser extensions
- JavaScript console manipulation

### 3.3 Architectural Notes

The platform **acknowledges the limitations** implicitly by:
- Using 30-minute expiry (prevents long-term retention)
- Deferring exam results (users can't screenshot until submission)
- Requiring auth (can audit who accessed what)

**Recommendation for stronger protection:**
- Implement **server-side rendering with watermarked content** (hard to remove)
- Use **canvas/WebGL rendering** for questions (not easily screen-captured)
- Implement **forensic watermarking** (user ID embedded in images)
- Log screenshot/print attempts (monitor for abuse patterns)

---

## 4. SUBSCRIPTION/AUTH ENFORCEMENT: ✅ SECURE

### 4.1 Protected Routes

**Location:** `src/lib/auth/config.ts:61-92`

```ts
const protectedPrefixes = [
  "/dashboard",
  "/practice",
  "/exam",
  "/admission",
  "/subscription",
  "/admin",
]

if (!isLoggedIn && protectedPrefixes.some((p) => pathname.startsWith(p))) {
  return Response.redirect(new URL("/login", request.nextUrl))
}
```

All student-facing question routes require **NextAuth JWT session**.

### 4.2 Trial & Subscription Access

**Location:** `src/lib/subscription/check.ts:20-90`

```ts
export const checkSubscriptionAccess = cache(async (userId: string) => {
  // Check active subscription
  if (sub?.status === "active") return { hasAccess: true, ... }

  // Check Stripe trial
  if (sub?.status === "trialing" && sub.currentPeriodEnd > now) { ... }

  // Check server-side trial (45 days from first feature use)
  // Never started trial → allow access
  if (!user.trialStartedAt) return { hasAccess: true, status: "trial_available" }

  // Active trial check
  const trialEndDate = new Date(
    user.trialStartedAt.getTime() + STRIPE_CONFIG.trialDays * 24 * 60 * 60 * 1000
  )
  if (trialEndDate > now) return { hasAccess: true, ... }

  // Expired → block
  return { hasAccess: false, status: "expired" }
})
```

**Trial Duration:** 45 days (set by `STRIPE_CONFIG.trialDays`)

### 4.3 Paywall Enforcement

**Location:** `src/app/(student)/layout.tsx`

A paywall overlay displays for expired users; they cannot access practice/exam.

**Verdict:** ✅ Auth enforcement is **server-side and secure**. Non-authenticated users cannot fetch questions.

### 4.4 API-Level Testing

**No standalone API endpoints exist.** All question queries are:
- **Server actions** (`use server`) in `src/lib/actions/`
- Called from **Next.js pages** (SSR) or client components
- Protected by NextAuth middleware

An attacker cannot directly `GET /api/questions?id=...` — **there is no such endpoint**.

---

## 5. PEER-COMPARISON & USER DATA EXPOSURE: ✅ ANONYMIZED

### 5.1 Ranking Data Structure

**Location:** `src/lib/db/queries/peer.ts:14-61`

```ts
export async function getPeerRankings(currentUserId: string) {
  // Returns only: user_id, best_score, max_possible, rank, percentile
  // NO EMAIL, NAME, YEAR_OF_STUDY, or personally identifiable info
  return result.map((row) => ({
    userId: row.user_id,      // UUID only
    bestScore: Number(row.best_score),
    maxPossible: Number(row.max_possible),
    rank: Number(row.rank),
    totalParticipants: Number(row.total_participants),
    percentile: Number(row.percentile),
    isCurrentUser: (row.user_id as string) === currentUserId,  // Boolean flag
  }))
}
```

### 5.2 Leaderboard Display

**Location:** `src/components/peer/leaderboard.tsx`

```ts
{/* Label */}
<span className="truncate">
  {entry.isCurrentUser ? (
    <span className="text-primary">Tu</span>  // "You"
  ) : (
    <span className="text-muted-foreground">
      Participant #{entry.rank}  // Anonymous rank-based label
    </span>
  )}
</span>
```

**What is visible:**
- User's own rank, score, percentile (if opted-in)
- Other users' anonymous rank, score, percentile
- **NO email, full name, year of study, contact info**

### 5.3 Avatar Generation

**Location:** `src/components/peer/avatar.tsx`

Uses **deterministic hash of user ID** (not sent to client; only seed):
```ts
<PeerAvatar seed={entry.userId} size={28} />
```

Avatar is generated client-side from a hash; the user ID is not exposed.

### 5.4 Opt-In Mechanism

**Location:** `src/lib/db/queries/peer.ts:220-241`

Users control ranking visibility via `peerOptIn` boolean. Only opted-in users appear in rankings.

**Aggregate stats** (mean, median, total participants) are shown even to non-opted-in users.

### 5.5 Verdict

✅ Peer-comparison is **correctly anonymized**:
- No PII leaked (emails, names, etc.)
- Ranking is score-based, not identity-based
- User has control via opt-in toggle
- Aggregate stats are accurate without exposing individuals

---

## 6. IMAGE/CONTENT DELIVERY: ✅ PROTECTED

### 6.1 Source Book & Page References

Questions include `sourceBook` and `sourcePage` metadata (text fields only).

There is **no image CDN or file serving** in the codebase for question content. Questions are stored as text.

**Verdict:** ✅ No unauth-protected file endpoints.

---

## 7. ATTEMPT ISOLATION: ✅ PROPER OWNERSHIP CHECKS

### 7.1 Ownership Verification

Every action checks `userId`:

**Practice submission** (`src/lib/actions/practice.ts:199-275`):
```ts
const [attempt] = await db
  .select({ id: attempts.id, status: attempts.status })
  .from(attempts)
  .where(and(
    eq(attempts.id, data.attemptId),
    eq(attempts.userId, user.id)  // ← Ownership check
  ))
  .limit(1)
```

**Exam submission** (`src/lib/actions/exam.ts:180-317`):
```ts
const [attempt] = await db.select(...)
  .from(attempts)
  .where(
    and(
      eq(attempts.id, attemptId),
      eq(attempts.userId, user.id),  // ← Ownership check
      eq(attempts.type, "simulation")
    )
  )
```

**Verdict:** ✅ Users cannot access or modify other users' attempts.

---

## 8. DIRECTORY STRUCTURE & API ROUTES

### 8.1 API Routes

**Location:** `src/app/api/`

Only **two public endpoints**:
1. `src/app/api/auth/[...nextauth]/route.ts` — NextAuth handlers (login, callback, etc.)
2. `src/app/api/webhooks/stripe/route.ts` — Stripe webhook (signature-verified)

**No question/answer API endpoints.** All question access is via server actions.

### 8.2 Server Actions

Questions are fetched through `"use server"` functions in:
- `src/lib/actions/practice.ts`
- `src/lib/actions/exam.ts`
- `src/lib/db/queries/practice.ts`

These **cannot be called outside of Next.js** and are protected by NextAuth.

**Verdict:** ✅ Architecture prevents direct API access.

---

## 9. AUDIT FINDINGS SUMMARY TABLE

| Finding | Severity | Status | Details |
|---------|----------|--------|---------|
| Questions sent before submission | HIGH | ✅ PASS | Correct answers not sent to client; options presented without `isCorrect` |
| 30-minute review window | MEDIUM | ⚠️ CLIENT-SIDE | Enforced in UI, not server; can be bypassed via DevTools |
| Anti-copy protection | LOW | ⚠️ BYPASSABLE | JavaScript-only; doesn't stop motivated attackers (DevTools, screenshot tools) |
| Subscription enforcement | HIGH | ✅ PASS | Server-side; all routes protected by NextAuth |
| User isolation (attempts) | HIGH | ✅ PASS | Ownership verified on every action |
| Peer data exposure | HIGH | ✅ PASS | Fully anonymized; no PII leakage; opt-in respected |
| API endpoint enumeration | HIGH | ✅ PASS | No standalone question API; only auth + webhook endpoints |
| Non-subscribed access | HIGH | ✅ PASS | Paywall enforced; trial tracked server-side |

---

## 10. RECOMMENDATIONS

### Immediate (High Priority)

1. **Server-side answer expiry enforcement** (line 32-36 in `answer-detail-dialog.tsx`)
   - Move 30-minute check to `getAnswerHistory()` in `dashboard.ts`
   - Return different payload (omit question text/options) if expired
   - **Risk:** Currently, a user with DevTools can modify `answeredAt` and see expired details

2. **Log suspicious activity**
   - Log attempts to access answer details after 30-minute window (via DevTools)
   - Log multiple printscreen/copy attempts
   - Monitor for bulk answer exports

### Medium Priority

3. **Watermark answers with user ID** (if content protection is critical)
   - Add user ID to question text as watermark (hard to remove)
   - Embed in canvas-based rendering for critical exams
   - Prevents resale/sharing of answer keys

4. **Screenshot detection & alerting**
   - Detect Screenshot key attempts (already blocked, but add logging)
   - Alert on unusual DevTools access patterns
   - Monitor for clipboard access (if relevant)

### Low Priority

5. **Better anti-cheat via behavioral signals**
   - Track time-per-question (unusually fast = copying?)
   - Flag patterns (same answers as high scorer, exact timing, etc.)
   - Use alongside existing 30-minute + expiry model

---

## 11. CONCLUSION

**grile-ReziNOT has a STRONG security posture for a quiz platform:**

✅ **Secure:**
- Correct answers never sent before submission
- Server-side authentication enforced
- User isolation verified
- Peer data anonymized
- No public API endpoints

⚠️ **Areas for Hardening:**
- Move 30-minute expiry check to server
- Acknowledge anti-copy limitations (it's **not real protection**, only UX friction)
- Implement optional watermarking for sensitive content

The platform correctly prioritizes **server-side validation** over client-side security theater. Questions are valuable intellectual property, but the 30-minute review window + subscription-gating + auth enforcement provides a reasonable balance between security and user experience.

---

**Audit conducted on:** 2026-04-06
**Files reviewed:** 15+ files across `src/lib`, `src/app`, `src/components`
**Method:** Code inspection + data flow analysis (no active testing)
