# API & Server Action Security Audit

**Date:** 2026-04-06
**Scope:** Next.js application at D:/GitHub/grile-ReziNOT
**Findings:** 1 Critical, 2 High, 2 Medium

---

## CRITICAL Findings

### 1. SQL Injection via String Concatenation in Chapter Filter

**Severity:** CRITICAL
**File:** `src/lib/actions/practice.ts:144`
**Line:** 144

**Vulnerability:**
```typescript
${config.chapterIds.length > 0 ? sql`AND q.chapter_id IN ${sql.raw(`('${config.chapterIds.join("','")}')`)}` : sql``}
```

**Exploit Scenario:**
While the `chapterIds` are validated as UUIDs (via `practiceConfigSchema`), they are re-joined with string concatenation and passed through `sql.raw()`. If an attacker can bypass the Zod validation or if the schema is weakened in the future, this becomes a direct SQL injection vector. More critically, the use of `sql.raw()` defeats parameterization and should never be used with user-supplied data.

**Example Attack:**
If validation were somehow bypassed: `"' OR '1'='1"` in the join would escape the quotes and inject SQL.

**Recommendation:**
Replace `sql.raw()` with parameterized Drizzle ORM placeholders:
```typescript
// Instead of:
${config.chapterIds.length > 0 ? sql`AND q.chapter_id IN ${sql.raw(`('${config.chapterIds.join("','")}')`)}` : sql``}

// Use:
${config.chapterIds.length > 0 ? inArray(questions.chapterId, config.chapterIds) : sql``}
```

---

## HIGH Severity Findings

### 1. No Rate Limiting on Authentication Endpoints

**Severity:** HIGH
**File:** `src/app/api/auth/[...nextauth]/route.ts`
**Lines:** 1-4 (delegated to NextAuth)

**Vulnerability:**
Authentication routes (`/api/auth/signin`, `/api/auth/signup`) lack rate limiting. An attacker can perform:
- Brute force attacks on password reset tokens (32 bytes of entropy, ~2^256 combinations)
- Dictionary attacks on user emails during forgot-password enumeration (currently mitigated by always returning success, but no rate limit prevents high-volume attacks)
- Account enumeration via signup endpoint (predictable email validation response timing)

**Exploit Scenario:**
- Attacker performs 1000s of login attempts per second to guess passwords
- Attacker sends reset-password requests at scale to enumerate valid emails in the system
- No exponential backoff or IP-based throttling

**Recommendation:**
Implement rate limiting middleware using a package like `Ratelimit` from `@upstash/ratelimit` or `node-rate-limiter-flexible`:
```typescript
import { Ratelimit } from "@upstash/ratelimit";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "15m"),
  analytics: true,
  prefix: "auth",
});

// In middleware or route handler:
const { limit, pending, reset, remaining, success } = await ratelimit.limit(ip);
if (!success) return new Response("Too many requests", { status: 429 });
```

### 2. No CSRF Protection on Server Actions

**Severity:** HIGH
**Files:** All `src/lib/actions/*.ts` files
**Example:** `src/lib/actions/exam.ts:180` (`submitExam`)

**Vulnerability:**
Server actions (mutations) like `submitExam`, `batchSaveAnswers`, `updateChapter`, `createQuestion`, etc. lack explicit CSRF token validation. While Next.js auto-includes CSRF protection in the framework, relying solely on framework-level protection without explicit verification leaves the application vulnerable if:
- The framework's protection is misconfigured
- A developer adds a public route that accepts server actions
- The middleware is bypassed

**Exploit Scenario:**
An attacker creates a malicious website with:
```html
<form action="https://app.com/updateChapter" method="POST">
  <input name="id" value="chapter-123">
  <input name="name" value="Malicious Name">
</form>
<script>document.forms[0].submit();</script>
```
If a logged-in user visits the malicious site, the form submits to the app and modifies chapters without explicit user consent (though the user is authenticated).

**Recommendation:**
Add explicit CSRF token validation to the most sensitive server actions:
```typescript
import { verifyRequestOrigin } from "next-auth/next";

export async function submitExam(attemptId: string) {
  const origin = headers().get("origin");
  const forwarded = headers().get("x-forwarded-proto");
  const proto = forwarded ? forwarded.split(",")[0] : "https";
  const host = headers().get("x-forwarded-host") || headers().get("host");

  if (!verifyRequestOrigin(origin, [`${proto}://${host}`])) {
    return { error: "Invalid origin" };
  }
  // ... rest of function
}
```

---

## MEDIUM Severity Findings

### 1. Password Reset Token Enumeration via Response Timing

**Severity:** MEDIUM
**File:** `src/lib/auth/actions.ts:107-146`
**Lines:** 126-146 (forgotPassword and updatePassword)

**Vulnerability:**
The `forgotPassword` function returns `{ success: true }` regardless of whether the email exists (line 145 - "Always return success to not reveal if email exists"). This is correct for enumeration prevention. However:
1. The password reset token validation in `updatePassword` (lines 168-176) may leak timing information
2. The token is generated from `crypto.randomBytes(32)` and stored as hex - good entropy, but no rate limiting on token submission attempts

**Exploit Scenario:**
- Attacker performs timing analysis on token verification to narrow down valid tokens
- Attacker submits thousands of random tokens without rate limiting to brute-force a valid one
- Each attempt takes 1-10ms to verify from the database

**Recommendation:**
1. Add rate limiting to token submission (max 3 attempts per 15 minutes per token attempt)
2. Implement constant-time token comparison if not already done by bcrypt

---

### 2. Inadequate Input Validation on Chapter/Question Import

**Severity:** MEDIUM
**File:** `src/lib/actions/import-export.ts:74-90`
**Lines:** 74-90 (batch processing)

**Vulnerability:**
While the import validates rows via `importRowSchema`, there's no limit on batch size or total request size. An attacker could:
- Upload a 1GB Excel file causing out-of-memory errors
- Submit 100,000 questions at once causing DB transaction failures
- Cause DoS via resource exhaustion

**Exploit Scenario:**
```typescript
// Attacker sends 100,000 rows
await importQuestions(Array(100000).fill({
  chapter_name: "Chapter",
  question_text: "Q",
  type: "CS",
  correct_answers: "A",
  options_a: "A", // ... etc
}));
```

**Recommendation:**
Implement request size and batch limits:
```typescript
export async function importQuestions(rows: ImportRow[]): Promise<ImportResult> {
  const admin = await getCurrentAdmin();

  // Limit batch size
  if (rows.length > 5000) {
    return {
      error: "Maximum 5000 rows per import",
      imported: 0,
      updated: 0,
      errors: []
    };
  }

  // Rest of function...
}
```

---

## Security Positives (No Issues Found)

### ✅ Authentication
- **NextAuth configuration:** Properly configured with JWT strategy and secure session timeout (30 days)
- **Password hashing:** Using bcryptjs with cost factor 12 (appropriate for security)
- **Authorization checks:** All admin actions call `getCurrentAdmin()` which validates superadmin status
- **IDOR prevention:** Most operations properly verify user ownership:
  - `submitExam` (line 199): Verifies `eq(attempts.userId, user.id)`
  - `batchSaveAnswers` (line 116): Verifies `eq(attempts.userId, user.id)`
  - `fetchPeerComparison` (line 19): Calls `getCurrentUser()`
  - Dashboard queries use authenticated user ID

### ✅ Webhook Security
- **Stripe signature verification:** Properly validating via `stripe.webhooks.constructEvent()` (line 30)
- **Idempotency:** Checking for duplicate events before processing (lines 41-48)
- **Error handling:** Not leaking sensitive data in error responses

### ✅ Database Parameterization
- **Drizzle ORM usage:** All standard queries use parameterized Drizzle methods (`.where()`, `.eq()`, etc.)
- **Proper use of `inArray()`:** UUID validation via Zod before use
- **No string interpolation:** Except for the one case in practice.ts identified above

### ✅ Validation
- **Zod schemas:** Comprehensive input validation on all user-facing endpoints
- **Type safety:** TypeScript prevents many injection vectors at compile time
- **Enum validation:** `attempt type`, `question type`, `feedback mode` validated as enums

---

## Additional Observations

### 1. Error Responses
**Status:** ⚠️ Minor
Error messages in some actions reveal system state:
- `src/lib/actions/exam.ts:57` returns "Nu sunt suficiente intrebari in baza de date" (reveals question count logic)
- `src/lib/actions/practice.ts:176` returns "Nu exista intrebari disponibile pentru selectia facuta" (reveals filtering logic)

These are low-risk because they're educational, but could be generalized.

### 2. Logging
**Status:** ✅ Good
- Audit logging implemented via `logAudit()` for admin actions
- No sensitive data (passwords, tokens) logged
- Console.log of password reset link exists but only in development (line 139)

### 3. Environment Variables
**Status:** ✅ Good
- Secrets properly prefixed with non-NEXT_PUBLIC (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, DATABASE_URL)
- Public URLs use NEXT_PUBLIC_ prefix appropriately

---

## Summary Table

| Finding | Severity | File | Line | Status |
|---------|----------|------|------|--------|
| SQL Injection via sql.raw() | CRITICAL | practice.ts | 144 | Fix required |
| No Rate Limiting on Auth | HIGH | api/auth/route.ts | N/A | Implement |
| No Explicit CSRF Validation | HIGH | All actions | Various | Consider adding |
| Token Enumeration (Timing) | MEDIUM | auth/actions.ts | 168-176 | Add rate limit |
| Unbounded Import Batch Size | MEDIUM | import-export.ts | 74-90 | Add limits |

---

## Remediation Priority

1. **IMMEDIATE** (Do first): Fix SQL injection in practice.ts:144 - add rate limiting to auth endpoints
2. **HIGH PRIORITY** (This week): Add batch size limits to import, add explicit CSRF validation to sensitive actions
3. **MEDIUM PRIORITY** (Next sprint): Add constant-time token comparison, implement audit logging for failed auth attempts

