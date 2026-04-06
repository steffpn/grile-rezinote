# Auth & Access Control Audit Report

**Date:** 2026-04-06
**Scope:** Full authentication, authorization, subscription/trial gating, and API security

---

## CRITICAL FINDINGS

### 1. **Missing Subscription Check in Paid Feature Actions** 🔴 CRITICAL

**Issue:** Server actions that create practice and exam attempts do NOT verify subscription/trial status before allowing users to create attempts.

**Affected Code:**
- `src/lib/actions/exam.ts:32-85` — `createExamAttempt()` calls `getCurrentUser()` (auth only) but never checks `checkSubscriptionAccess()`
- `src/lib/actions/practice.ts:90-180+` — `createPracticeAttempt()` calls `getCurrentUser()` (auth only) but never checks subscription

**Attack Scenario:** A user can sign up, let trial expire (or skip trial by not accessing the trial-eligible path), and then directly call `createExamAttempt()` or `createPracticeAttempt()` server actions to create unlimited practice/exam attempts without ever subscribing.

**Current Protection:**
- Frontend shows PaywallOverlay when `!subscriptionAccess.hasAccess` in layout (src/app/(student)/layout.tsx:44)
- PaywallOverlay is a client-side UX overlay only—does NOT block API/server action execution
- A user can use browser DevTools to call server actions directly, or make XHR requests

**File:Line References:**
- Auth check (insufficient): `src/lib/auth/get-user.ts:29-47`
- Subscription check function (exists but unused in actions): `src/lib/subscription/check.ts:20-91`
- No subscription check in exam action: `src/lib/actions/exam.ts:32-86`
- No subscription check in practice action: `src/lib/actions/practice.ts:90+`

**Fix Required:**
Each server action must call `checkSubscriptionAccess(user.id)` and return error if `!hasAccess` before proceeding:

```typescript
export async function createExamAttempt() {
  const user = await getCurrentUser()
  const access = await checkSubscriptionAccess(user.id)
  if (!access.hasAccess) {
    throw new Error("Trial expired or no active subscription")
  }
  // ... rest of action
}
```

---

### 2. **Trial Bypass via Re-signup** 🟠 HIGH

**Issue:** Trial logic checks if `user.trialStartedAt` is set, but allows multiple account creations with different emails. A user can:
1. Sign up → get 45-day trial
2. Let it expire
3. Sign up again with different email → get another 45-day trial

**Current Implementation:**
- `src/lib/auth/actions.ts:24-74` — `signup()` action allows creating account without checking prior trial/subscription history
- `src/lib/subscription/check.ts:67-68` — Trial only starts on first paid feature access, not on signup

**Attack Scenario:** Malicious user creates unlimited free trial accounts by cycling through email addresses.

**Fix Required:**
- Implement per-user (email domain / IP) trial tracking
- Add rate limiting on signup
- Consider requiring email verification before trial access

---

### 3. **Weak Password Validation Rules** 🟠 MEDIUM

**Issue:** Password validation is minimal and doesn't follow NIST guidelines.

**Current Rules** (`src/lib/validations/auth.ts:10-18`):
- Minimum 8 characters (OK)
- Must contain at least 1 letter (OK)
- Must contain at least 1 digit (OK)
- **Missing:** no check for common/weak passwords, no maximum length limit

**What's Missing:**
- No check against common password lists (e.g., "12345678" passes validation)
- No length limit (could allow 100K+ character passwords → DoS)
- No special character requirement (but not critical for this app)

**File:Line:** `src/lib/validations/auth.ts:10-18`

**Fix Required:**
```typescript
.max(128, { message: "Parola este prea lunga" })
.refine(password => !COMMON_PASSWORDS.includes(password.toLowerCase()), {
  message: "Parola este prea comuna. Alege una mai sigura."
})
```

---

### 4. **Admin Role Check Present (No IDOR Risk)** ✅ SECURE

**Finding:** Admin routes are properly protected.

**Protection Layers:**
1. Middleware route protection: `/admin` requires auth (src/middleware.ts:79-90)
2. Layout-level superadmin check: `src/app/(admin)/layout.tsx:15` calls `getCurrentAdmin()` which:
   - Verifies session exists (src/lib/db/queries/admin.ts:36)
   - Checks `user.isSuperadmin === true` (src/lib/db/queries/admin.ts:23)
   - Redirects to `/dashboard` if not admin

**Result:** No way to bypass admin check; cannot escalate privileges from student→admin (field is DB-level, not user-editable).

---

## MEDIUM SEVERITY FINDINGS

### 5. **Session/Cookie Expiry is Long (30 days)** 🟡 MEDIUM

**Issue:** JWT sessions last 30 days, which is longer than typical best practices (7-14 days).

**File:Line:** `src/lib/auth/config.ts:40-42`
```typescript
session: {
  strategy: "jwt",
  maxAge: 30 * 24 * 60 * 60, // 30 days
}
```

**Risk:** Extended session window increases exposure if JWT is compromised (stolen/leaked).

**Mitigation:** Consider reducing to 7-14 days, or implement sliding window expiry to keep active users logged in while forcing re-auth for inactive sessions.

---

### 6. **No CSRF Protection Explicit Check** 🟡 MEDIUM

**Finding:** No explicit CSRF token validation in place.

**Current State:**
- NextAuth handles CSRF via secure session cookies
- Next.js has built-in CSRF protection for server actions (uses Origin/Referer headers)
- No custom CSRF middleware visible

**File:Line:** `src/lib/auth/config.ts` (no explicit CSRF config) and `src/middleware.ts` (no CSRF middleware)

**Recommendation:** Verify Next.js version is recent enough for automatic CSRF protection on server actions. If using fetch-based requests, add explicit CSRF token handling.

---

## LOW SEVERITY FINDINGS

### 7. **Password Reset Token Expiry is 1 Hour** ✅ ACCEPTABLE

**Finding:** Password reset tokens expire after 1 hour, which is standard and secure.

**File:Line:** `src/lib/auth/actions.ts:129`

---

### 8. **Email Enumeration in Forgot Password** 🟡 LOW

**Issue:** Forgot password endpoint doesn't reveal whether email exists, which is good.

**File:Line:** `src/lib/auth/actions.ts:144-145`
```typescript
// Always return success to not reveal if email exists
return { success: true }
```

**Status:** ✅ **Properly implemented**

---

### 9. **No API Routes for Data Fetching Detected** ✅ NO RISK

**Finding:** Only two API routes exist:
1. `src/app/api/auth/[...nextauth]/route.ts` — NextAuth handler (secure)
2. `src/app/api/webhooks/stripe/route.ts` — Stripe webhook (properly signed)

**Status:** ✅ **No exposed API endpoints to worry about**

---

## VERIFICATION SUMMARY

| Check | Result | Notes |
|-------|--------|-------|
| User can create account without subscription | ✅ YES (by design) | Allowed via signup |
| User can access app WITHOUT subscription/trial | 🔴 **YES** (BUG) | Server actions not gated; frontend overlay only |
| Trial enforced server-side | ✅ YES | `checkSubscriptionAccess()` validates trial dates |
| Admin bypass possible | ✅ NO | Properly protected with superadmin check |
| Session hijacking via JWT theft | 🟡 MEDIUM | 30-day expiry is long |
| Password bruteforce resistance | ⚠️ LOW | No account lockout detected |
| Trial expiry clearable via cookies | ✅ NO | `trialStartedAt` is server-side DB field |

---

## PRIORITY FIX LIST

### P0 - MUST FIX (Security Blocking)
1. **Add subscription check to `createExamAttempt()` and `createPracticeAttempt()`**
   - Files: `src/lib/actions/exam.ts`, `src/lib/actions/practice.ts`
   - Add: `checkSubscriptionAccess()` call before creating attempt

2. **Prevent trial re-abuse via email cycling**
   - Add email domain / IP-based trial restrictions
   - Or: implement invite-code system for trial access

### P1 - SHOULD FIX (Medium Risk)
3. **Increase password validation strictness**
   - Add max length (128 chars)
   - Add check against common password list
   - File: `src/lib/validations/auth.ts`

4. **Reduce JWT session expiry to 7-14 days**
   - File: `src/lib/auth/config.ts:42`

### P2 - NICE TO HAVE (Low Risk)
5. **Add account lockout after N failed login attempts**
   - Implement rate limiting on `/api/auth/signin`
   - Store failed attempt count in DB

6. **Audit logs for failed auth attempts**
   - Extend `auditLogs` to track failed logins

---

## CONCLUSION

**Overall Risk: HIGH**

The application has a **critical server-side auth bypass** where users can create paid feature attempts (exams, practice) without an active subscription. The PaywallOverlay provides client-side UX but does not enforce the business rule server-side.

Additionally, the trial system allows re-abuse through email cycling, and password validation is weak.

**Recommended Action:** Implement P0 fixes immediately before production use.
