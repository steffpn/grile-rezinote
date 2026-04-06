# Consolidated Security Audit Report
**grile-ReziNOT Application**

**Date:** 2026-04-06
**Auditors:** Auth & Access Control Team + API Security Team
**Overall Risk Level:** 🔴 **CRITICAL** (1 Critical vulnerability requires immediate patching)

---

## Executive Summary

Two independent security audits (Auth & API) identified **1 CRITICAL, 4 HIGH, and 2 MEDIUM severity issues**. Most critically, users can create paid feature attempts (exam/practice) without an active subscription via server action bypass combined with missing subscription validation.

**Risk to Business:** Users can access full app features without paying. Revenue exposure is direct.

---

## Combined Finding Matrix

| Severity | Count | Items |
|----------|-------|-------|
| **CRITICAL** | 1 | Subscription bypass via server actions (auth) + SQL injection risk (api) |
| **HIGH** | 4 | No auth rate limiting, No CSRF validation, Trial re-abuse, Weak password validation |
| **MEDIUM** | 3 | Long session expiry, Token enumeration timing, Unbounded import batch |
| **TOTAL** | 8 | - |

---

## CRITICAL ISSUES (Fix Immediately)

### 1. Subscription Bypass in Server Actions 🔴
**Audit Source:** Auth & Access Control
**Business Impact:** Direct revenue loss; users access unlimited paid content without subscription

**Technical Details:**
- `createExamAttempt()` (src/lib/actions/exam.ts:32) and `createPracticeAttempt()` (src/lib/actions/practice.ts:90) call only `getCurrentUser()` (authentication check)
- No `checkSubscriptionAccess()` call before creating attempts
- PaywallOverlay (frontend) is client-side only and cannot block server actions
- Developer can call server actions directly via DevTools or XHR to bypass overlay

**Attack Path:**
```
1. User creates account → trial starts (45 days)
2. User doesn't take any paid actions → trial never starts
3. User uses DevTools to call createExamAttempt() directly
4. Exam is created and accessible despite no trial/subscription
```

**Required Fix:**
```typescript
export async function createExamAttempt() {
  const user = await getCurrentUser()
  const access = await checkSubscriptionAccess(user.id)

  if (!access.hasAccess) {
    throw new Error("Trial expired or no active subscription")
  }

  // ... rest of function
}
```

**File:Line:** `src/lib/actions/exam.ts:32-86`, `src/lib/actions/practice.ts:90+`

---

### 2. SQL Injection Risk via sql.raw() 🔴
**Audit Source:** API Security
**Risk Level:** Mitigated by Zod validation, but violates secure coding practices

**Technical Details:**
```typescript
// CURRENT (src/lib/actions/practice.ts:144) - UNSAFE
${config.chapterIds.length > 0 ? sql`AND q.chapter_id IN ${sql.raw(`('${config.chapterIds.join("','")}')`)}` : sql``}
```

While `chapterIds` are validated as UUIDs via Zod, the use of `sql.raw()` with string concatenation is a critical security antipattern. If Zod validation is weakened or bypassed, this becomes a direct SQL injection vector.

**Attack Scenario:**
If validation is bypassed: `"' OR '1'='1"` in the joined string escapes quotes and injects SQL.

**Required Fix:**
```typescript
// SAFE - Use parameterized Drizzle
${config.chapterIds.length > 0 ? inArray(questions.chapterId, config.chapterIds) : sql``}
```

**File:Line:** `src/lib/actions/practice.ts:144`

---

## HIGH SEVERITY ISSUES (Fix This Week)

### 3. No Rate Limiting on Authentication Endpoints 🟠
**Audit Source:** API Security

**Details:**
- `/api/auth/signin`, `/api/auth/signup`, `/api/auth/callback` lack rate limiting
- No protection against brute force, dictionary attacks, or token enumeration
- Password reset token (32 bytes entropy) could be brute-forced at scale without throttling

**Attack Scenarios:**
- 1000s of login attempts/second to guess passwords
- Enumerate valid emails via reset endpoint at scale
- Brute-force password reset tokens

**Required Fix:**
Implement rate limiting middleware (Upstash, node-rate-limiter-flexible) with:
- 5 attempts per 15 minutes per IP for login
- 3 attempts per 15 minutes for password reset token submission
- Exponential backoff on repeated failures

**File:Line:** `src/app/api/auth/[...nextauth]/route.ts`

---

### 4. No Explicit CSRF Validation on Server Actions 🟠
**Audit Source:** API Security

**Details:**
Server actions (mutations) like `submitExam`, `updateChapter`, `createQuestion`, etc. rely on Next.js framework-level CSRF protection without explicit verification. Relying solely on framework protection without explicit checks is risky if:
- Framework protection is misconfigured
- Middleware is bypassed
- Public routes accept server actions

**Attack Scenario:**
Attacker creates malicious website with form that submits to `/updateChapter` when logged-in user visits. Form updates chapters without explicit user consent (though user is authenticated).

**Required Fix:**
Add explicit CSRF validation to critical actions:
```typescript
import { verifyRequestOrigin } from "next-auth/next";
import { headers } from "next/headers";

export async function submitExam(attemptId: string) {
  const origin = headers().get("origin");
  const host = headers().get("host");

  if (!verifyRequestOrigin(origin, [`https://${host}`])) {
    return { error: "Invalid origin" };
  }
  // ... rest
}
```

Apply to: All mutation actions in `src/lib/actions/*.ts`

---

### 5. Trial System Allows Re-abuse via Email Cycling 🟠
**Audit Source:** Auth & Access Control

**Details:**
- Trial is per-user based on `trialStartedAt` timestamp
- No rate limiting on account creation
- User can create unlimited accounts with different emails to get multiple 45-day trials

**Attack Scenario:**
1. User1 signs up with email1@domain.com → 45-day trial
2. Trial expires
3. User1 signs up with email2@domain.com → another 45-day trial
4. Repeat indefinitely

**Required Fix:**
Implement trial restrictions:
- 1 trial per email domain (e.g., all @gmail.com accounts share 1 trial)
- 1 trial per IP address
- Or: Require invite code / academic verification for trial access

**File:Line:** `src/lib/auth/actions.ts:24-74` (signup), `src/lib/subscription/check.ts:67-68` (trial check)

---

### 6. Weak Password Validation Rules 🟠
**Audit Source:** Auth & Access Control

**Current Rules** (`src/lib/validations/auth.ts:10-18`):
- Min 8 chars ✅
- Must contain letter ✅
- Must contain digit ✅
- **Missing:** No max length, no common password check

**Issues:**
- No maximum length limit (allows 100K+ char passwords → potential DoS)
- No check against common passwords (e.g., "Password1" passes validation)

**Required Fix:**
```typescript
.max(128, "Password too long")
.refine(password => !COMMON_PASSWORDS.includes(password.toLowerCase()), {
  message: "This password is too common. Choose a stronger one."
})
```

**File:Line:** `src/lib/validations/auth.ts:10-18`

---

## MEDIUM SEVERITY ISSUES (Fix Next Sprint)

### 7. Long JWT Session Expiry (30 Days) 🟡
**Audit Source:** Auth & Access Control

**Details:** Sessions expire after 30 days, which is longer than best practice (7-14 days). Increases exposure window if JWT is compromised.

**File:Line:** `src/lib/auth/config.ts:40-42`

**Recommendation:** Reduce to 7-14 days or implement sliding window expiry.

---

### 8. Password Reset Token Enumeration via Timing 🟡
**Audit Source:** API Security

**Details:**
- Token validation in `updatePassword()` may leak timing information
- No rate limiting on token submission attempts
- Attacker could brute-force tokens with timing analysis

**File:Line:** `src/lib/auth/actions.ts:168-176`

**Recommendation:** Add rate limiting (max 3 attempts per 15 minutes per token) and constant-time comparison.

---

### 9. Unbounded Import Batch Size 🟡
**Audit Source:** API Security

**Details:**
- Excel import (`src/lib/actions/import-export.ts:74-90`) has no row limit
- Attacker could cause DoS via resource exhaustion with 100K+ row uploads

**Recommendation:** Limit to 5000 rows per import.

**File:Line:** `src/lib/actions/import-export.ts:74-90`

---

## POSITIVE FINDINGS ✅

| Category | Status | Details |
|----------|--------|---------|
| **Admin Authorization** | ✅ SECURE | All admin routes require `getCurrentAdmin()` superadmin check |
| **IDOR Prevention** | ✅ SECURE | Mutations verify `userId` ownership (submitExam, batchSaveAnswers, etc.) |
| **Stripe Webhook** | ✅ SECURE | Proper signature verification + idempotency checks |
| **Input Validation** | ✅ SECURE | Comprehensive Zod schemas on all endpoints |
| **Database Parameterization** | ✅ SECURE | Drizzle ORM used correctly (except 1 sql.raw() case) |
| **Secret Handling** | ✅ SECURE | Non-NEXT_PUBLIC prefixes for sensitive values |
| **Logging** | ✅ SECURE | Audit logs implemented; no sensitive data logged |
| **Email Enumeration** | ✅ SECURE | Forgot password always returns success |
| **Token Entropy** | ✅ SECURE | crypto.randomBytes(32) for reset tokens |

---

## Remediation Roadmap

### Phase 1: IMMEDIATE (This Week - Before Production)
**Blocks production deployment**

1. ✅ Add `checkSubscriptionAccess()` validation to `createExamAttempt()` and `createPracticeAttempt()`
2. ✅ Replace `sql.raw()` with `inArray()` in practice.ts:144
3. ✅ Implement rate limiting on `/api/auth/*` endpoints (5 per 15m)

**Estimated Effort:** 4-6 hours

---

### Phase 2: HIGH PRIORITY (Week 2)
**Improves security posture significantly**

4. ✅ Add explicit CSRF validation to sensitive server actions
5. ✅ Implement trial re-abuse prevention (email domain / IP restrictions)
6. ✅ Strengthen password validation (max length + common password check)
7. ✅ Add batch size limits to import endpoints (max 5000 rows)

**Estimated Effort:** 6-8 hours

---

### Phase 3: MEDIUM PRIORITY (Week 3+)
**Defense-in-depth improvements**

8. ✅ Reduce JWT session expiry to 7-14 days
9. ✅ Add rate limiting to password reset token submissions
10. ✅ Implement account lockout after N failed login attempts
11. ✅ Add audit logging for failed auth attempts

**Estimated Effort:** 4-6 hours

---

## Testing Recommendations

After implementing fixes, test:

**Phase 1 Verification:**
```bash
# Test 1: Verify subscription check blocks expired users
# - Create user, start trial, wait 45+ days
# - Attempt to call createExamAttempt() → Should get "No access" error

# Test 2: Verify SQL injection is fixed
# - Audit code: practice.ts:144 uses inArray() not sql.raw()

# Test 3: Verify rate limiting works
# - Make 6 login requests in 15 min → 6th should get 429 Too Many Requests
```

**Phase 2 Verification:**
```bash
# Test 4: CSRF validation
# - Create malicious form on different domain
# - Submit form from logged-in user → Should get error

# Test 5: Trial re-abuse prevention
# - Attempt to create 2nd account with same email → Should fail or warn
# - Attempt to create accounts from same IP → Should rate limit
```

---

## Audit Trail

| Audit | Date | Auditor | Issues Found |
|-------|------|---------|--------------|
| Auth & Access Control | 2026-04-06 | auth-access | 4 Critical/High, 1 Medium |
| API & Server Actions | 2026-04-06 | api-security | 1 Critical, 2 High, 2 Medium |
| **Total** | - | - | **1 Critical, 4 High, 3 Medium** |

---

## Sign-Off

This report represents a comprehensive security audit of the authentication, authorization, and API layers of the grile-ReziNOT application as of 2026-04-06.

**Recommended Action:** Implement Phase 1 fixes before production deployment to address the critical subscription bypass vulnerability.

For detailed file:line references and code examples, see:
- `auth-findings.md` (Auth & Access Control)
- `api-findings.md` (API & Server Actions)
