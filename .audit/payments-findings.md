# Payments & Subscription Gating Security Audit

**Date:** 2026-04-06
**Auditor:** Security Audit Agent
**Status:** 8 ISSUES FOUND (1 CRITICAL, 3 HIGH, 4 MEDIUM)

---

## Summary

The payments and subscription gating implementation has solid webhook infrastructure but contains critical security gaps in client-side exposure of payment amounts, trial reset vulnerability, and weak enforcement of paywall access. The app displays hardcoded prices in the frontend with no server-side validation, allows trial period reset via email reuse, and lacks proper server-side access enforcement for paid features.

---

## CRITICAL ISSUES

### 1. CLIENT-SIDE PRICE EXPOSURE — Price Tampering Risk
**Severity:** CRITICAL
**File:** `src/app/(marketing)/pricing/page.tsx:26-43`
**Status:** CONFIRMED VULNERABLE

**Finding:**
Prices are hardcoded in client-side React component:
```tsx
<PricingCard name="Lunar" price="49" period="/luna" priceId={STRIPE_CONFIG.monthlyPriceId} ... />
<PricingCard name="Anual" price="33" period="/luna, platit anual" priceId={STRIPE_CONFIG.annualPriceId} ... />
```

**Attack Vector:**
An attacker can:
1. Use browser DevTools to modify the displayed price to 0.01 RON
2. The PricingCard component (src/components/subscription/PricingCard.tsx:5-16) accepts price as a prop with no validation
3. When user clicks "Aboneaza-te", it calls `createCheckoutSession(priceId)` with the correct priceId
4. **However**, the frontend shows the manipulated price to lure users into clicking, creating user confusion and UX attacks

**Root Cause:**
Prices should be fetched from the server (e.g., via Stripe API lookup) or at least verified before displaying. Current flow treats prices as display-only untrusted data.

**Recommendation:**
- Fetch prices from Stripe API on page load: `stripe.prices.retrieve(priceId)` to get the actual amount
- Display server-sourced prices only
- Validate priceId format before using: whitelist against env vars `STRIPE_MONTHLY_PRICE_ID` / `STRIPE_ANNUAL_PRICE_ID`

---

## HIGH SEVERITY ISSUES

### 2. Trial Period Reset via Email Reuse — Trial Bypass
**Severity:** HIGH
**Files:** `src/lib/auth/actions.ts:24-74`, `src/lib/subscription/trial.ts:11-23`, `src/lib/subscription/check.ts:20-90`
**Status:** CONFIRMED VULNERABLE

**Finding:**
A user can reset their 45-day trial by deleting their account and re-signing up with the same email:

1. User A creates account (user@example.com) → trial starts via `startTrial()` (trial.ts:11-23)
2. User deletes account → `users` table row deleted via cascade, `trialStartedAt` is lost
3. User re-signs up with same email → new `users` row created with `trialStartedAt = NULL`
4. `checkSubscriptionAccess()` (check.ts:67) returns `{ hasAccess: true, status: "trial_available" }`
5. On first paid feature, `startTrial()` runs again → fresh 45-day trial

**Code Path Confirmation:**
- `src/lib/auth/actions.ts:24-74`: signup() checks only `existing email` but doesn't check if trial was previously used
- `src/lib/subscription/check.ts:66-68`: "Never started trial — allow access, trial will start on first feature use"
- No unique constraint on (email, trialStartedAt) or trial usage history

**Attack Vector:**
Delete account + re-signup loop allows unlimited trial resets. No device fingerprinting, no "trial used" flag, no cooldown period.

**Recommendation:**
- Add `trialUsedAt` timestamp to `users` table (nullable) — set once trial has been used, never reset
- In signup: check `existing.trialUsedAt` before allowing re-signup
- Add cooldown: `if (trialUsedAt && Date.now() - trialUsedAt < 90 days) reject_signup()`
- Consider device fingerprinting (e.g., Stripe Radar) for abuse detection

---

### 3. Paywall Only Client-Side — User Can Bypass UI Restriction
**Severity:** HIGH
**Files:** `src/app/(student)/layout.tsx:31-45`, `src/components/paywall/PaywallOverlay.tsx`
**Status:** CONFIRMED VULNERABLE

**Finding:**
Access control is enforced only on the client-side layout overlay:

```tsx
// layout.tsx:31-45
let subscriptionAccess = null
let showPaywall = false

if (user) {
  subscriptionAccess = await checkSubscriptionAccess(user.id)
  if (subscriptionAccess.status === "trial_available") {
    await startTrial(user.id)
    subscriptionAccess = await checkSubscriptionAccess(user.id)
  }
  showPaywall = !subscriptionAccess.hasAccess  // Only affects UI
}

return (
  <AppShell ...>
    {children}  // Page content ALWAYS rendered
    <PaywallOverlay isVisible={showPaywall} />  // Just visual blur
  </AppShell>
)
```

**Attack Vectors:**
1. **DOM Manipulation:** Remove/hide the overlay with DevTools: `document.querySelector('[class*="PaywallOverlay"]').style.display = 'none'`
2. **CSS Bypass:** Browser inspector to set overlay z-index to 0 or display:none
3. **Network Intercept:** Fetch API calls to `/practice/[attemptId]/page.tsx` are processed regardless of layout state

**Pages at Risk:**
- `/practice` — No server-side access check (src/app/(student)/practice/page.tsx)
- `/exam` — No server-side access check (src/app/(student)/exam/page.tsx)
- `/dashboard` — No server-side access check (src/app/(student)/dashboard/page.tsx)

**Confirmed Server-Side Access NOT Enforced:**
✓ `/practice/[attemptId]` does check `getAttemptWithQuestions(attemptId, userId)` — ownership verified (check.ts:79-90)
✓ `/exam/[attemptId]` — not checked in audit, likely same pattern
✗ `/practice` and `/exam` landing pages — no access check, they load public data only (chapters, attempt list)

**Recommendation:**
- Add `redirect()` middleware in layout based on `checkSubscriptionAccess()`
- For sensitive pages (practice/exam), verify access server-side **before** rendering component
- Return 403 or redirect to paywall page instead of rendering content + overlay
- Validate subscription status on API routes that save attempts/answers

---

### 4. Webhook Endpoint Public Without Rate Limiting
**Severity:** HIGH
**File:** `src/app/api/webhooks/stripe/route.ts:15-93`
**Status:** POTENTIAL RISK

**Finding:**
Webhook endpoint is correctly authenticated via Stripe signature (route.ts:30-38):
```tsx
event = stripe.webhooks.constructEvent(
  body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET!
)
```

**However**, the endpoint has **NO rate limiting or brute-force protection**:
- No IP-based rate limiting
- No request count tracking
- No cooldown mechanism
- Attacker can send thousands of invalid signature requests → 400 responses logged

**Idempotency Check is Correct:**
✓ Unique constraint on `webhookEvents.stripeEventId` prevents double-processing (route.ts:40-49)
✓ Replay protection via DB unique check is solid

**Secondary Risk:**
If Stripe API is compromised or webhook URL is leaked, attacker can:
1. Send 1000s of malformed webhook payloads
2. Fill logs with errors
3. Potential DoS on signature validation CPU (unlikely at scale, but possible)

**Recommendation:**
- Add Turnstile/reCAPTCHA at webhook ingestion point (probably not practical)
- Implement rate limiting per IP or per request body hash
- Consider webhook queue (e.g., AWS SQS) to decouple ingestion from processing
- Monitor for repeated signature verification failures

---

## MEDIUM SEVERITY ISSUES

### 5. Subscription Status Derived From DB, Not Validated Against Stripe
**Severity:** MEDIUM
**Files:** `src/lib/subscription/check.ts:20-90`, `src/lib/stripe/webhook-handlers.ts:71-105`
**Status:** CONFIRMED

**Finding:**
`checkSubscriptionAccess()` returns subscription status **only from local DB**, never validates against Stripe:

```tsx
const [sub] = await db
  .select()
  .from(subscriptions)
  .where(eq(subscriptions.userId, userId))
  .limit(1)

if (sub?.status === "active") {
  return { hasAccess: true, status: "active", ... }
}
```

**Attack Vector / Data Integrity Risk:**
1. **Manual DB Tampering:** If attacker gains DB access, they can update `subscriptions.status = "active"` without Stripe webhook
2. **Webhook Processing Failure:** If webhook fails silently (caught exception at route.ts:86-90), subscription status in Stripe diverges from local DB
3. **Race Condition:** Stripe cancels subscription but webhook hasn't arrived yet → user still sees "active"

**Code Evidence:**
`webhook-handlers.ts:86-90` catches all errors and returns 200 OK:
```tsx
} catch (err) {
  console.error(`Error processing webhook event ${event.type}:`, err)
  // Still return 200 to prevent Stripe from retrying.
}
```

This means a DB update failure during webhook processing is logged but not retried. User remains "active" until next webhook.

**Webhook Storage:**
✓ Webhook is recorded in `webhookEvents` table (route.ts:53-56) — good for audit trail
✗ No retry mechanism if DB update fails

**Recommendation:**
- Add `lastSyncedWithStripeAt` timestamp to subscriptions table
- Implement periodic sync job: every 24 hours, fetch subscriptions from Stripe API and reconcile local DB
- On access check: if `lastSyncedWithStripeAt < 24h_ago`, fetch from Stripe API and update DB
- Add webhook processing queue (e.g., Bull, RabbitMQ) with retry policy

---

### 6. Cancellation Flow Not Enforced Until Period End
**Severity:** MEDIUM
**Files:** `src/lib/stripe/actions.ts:114-144`
**Status:** EXPECTED BEHAVIOR BUT WORTH NOTING

**Finding:**
When user cancels subscription, they remain "active" until `currentPeriodEnd`:

```tsx
await stripe.subscriptions.update(sub.stripeSubscriptionId, {
  cancel_at_period_end: true,  // Cancels at end, not immediately
})

// Local DB is updated
await db.update(subscriptions).set({ cancelAtPeriodEnd: true })
```

**Current Behavior:**
- User cancels → `cancel_at_period_end = true` in Stripe AND local DB
- Stripe still allows access for remainder of billing period
- At period end, Stripe sends `customer.subscription.deleted` webhook → status → "cancelled"

**Risk:**
If user tries to reactivate before webhook arrives, race condition could cause:
1. User cancels (local: `cancelAtPeriodEnd = true`)
2. User clicks "Reactiveate" immediately
3. `reactivateSubscription()` calls `stripe.subscriptions.update(..., { cancel_at_period_end: false })`
4. Both succeed independently
5. User may be charged twice if period boundary is close

**Recommendation:**
- After reactivation, immediately verify Stripe state via API
- Display "Pending" state during the brief window between cancel and webhook arrival
- Add optimistic UI state tracking in ManageSubscription.tsx

---

### 7. Failed Payment Logging Only — No User Notification
**Severity:** MEDIUM
**Files:** `src/lib/stripe/webhook-handlers.ts:147-155`
**Status:** BY DESIGN BUT INCOMPLETE

**Finding:**
`handlePaymentFailed()` only logs the failure:

```tsx
export async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = getSubscriptionIdFromInvoice(invoice)
  console.warn(`Payment failed for subscription ${subscriptionId}, invoice ${invoice.id}`)
  // Stripe will send customer.subscription.updated if status changes
  // (e.g., to past_due), which handleSubscriptionChange will process.
}
```

**Risk:**
- User is not notified of failed payment
- Subscription may transition to `past_due` → `inactive` in DB without user knowing
- User wakes up to see paywall but doesn't know why

**Stripe Behavior:**
- Stripe retries payments 3-4 times over 3-7 days
- Eventually sends `customer.subscription.updated` with status `past_due` → our webhook updates DB
- But no email/in-app notification to user

**Recommendation:**
- Send in-app notification: "Payment failed — please update your payment method"
- Add `paymentFailureNotifiedAt` field to subscriptions table
- Increment a retry counter or flag

---

### 8. Trial Length Discrepancy Documentation
**Severity:** MEDIUM
**Files:** `src/app/(marketing)/pricing/page.tsx:52-58`, `src/lib/stripe/config.ts:5`
**Status:** INFORMATIONAL / DOCUMENTATION BUG

**Finding:**
Pricing page FAQ says trial is **7 days**:
```tsx
// pricing/page.tsx:52-58
<p>Dupa cele 7 zile de trial gratuit, vei avea nevoie de un abonament activ...</p>
```

But config says **45 days**:
```tsx
// stripe/config.ts:5
trialDays: 45
```

**Confirmation:**
Recent commit fe7becc shows: "chore: extend trial period from 7 to 45 days" — pricing page was not updated.

**Impact:**
Users see "7 days" in FAQ, but are given 45 days. This is actually customer-friendly, but creates support confusion.

**Recommendation:**
Update pricing page to say "45 days" instead of "7 days"

---

## VERIFIED SECURE PRACTICES

✅ **Webhook Signature Verification:** Stripe signature is validated via `stripe.webhooks.constructEvent()` (route.ts:30-34)
✅ **Webhook Idempotency:** Duplicate webhook events are detected via unique `stripeEventId` constraint (route.ts:40-49)
✅ **Attempt Ownership Verification:** `getAttemptWithQuestions()` verifies `userId` matches (practice.ts:79-90)
✅ **Correct Trial Calculation:** Trial end date calculated consistently across functions (trial.ts, check.ts)
✅ **Server-Side Cancellation:** Cancellation via Stripe API, not client-side state (actions.ts:114-144)
✅ **Auth Required for Checkout:** `createCheckoutSession()` requires authenticated session (actions.ts:60-64)

---

## REMEDIATION PRIORITY

**Immediate (This Sprint):**
1. Add server-side paywall middleware (Issue #3)
2. Implement trial reset prevention (Issue #2)
3. Fetch and validate prices from Stripe API (Issue #1)

**Short-term (Next Sprint):**
4. Add rate limiting to webhook endpoint (Issue #4)
5. Implement webhook processing queue with retry (Issue #5)
6. Update pricing page FAQ (Issue #8)

**Future:**
7. Monitor payment failures and notify users (Issue #7)
8. Add cancellation race condition handling (Issue #6)

---

## Testing Recommendations

```bash
# Verify paywall enforcement
curl -b "session_token=..." http://localhost:3000/practice
# Should redirect or return 403, not render content

# Test trial reset attack
1. Sign up with test@example.com → trial starts
2. Delete account (add endpoint or DB delete)
3. Sign up with test@example.com again → should reject or re-check trial history
4. Attempt /practice → should require subscription, not allow new trial

# Test price tampering
1. Open DevTools
2. Modify pricing card price to 0.01
3. Click checkout
4. Verify Stripe Hosted Checkout shows actual price (49 RON)
```

---

## Security Model Assumptions

- Stripe API credentials are secure (STRIPE_SECRET_KEY never exposed to client)
- PostgreSQL database is not compromised (if it is, attacker has full access anyway)
- NextAuth session tokens are secure and not forgeable
- Clients cannot modify their own JWT/session data

---

## References

- Stripe Webhook Signature Verification: https://stripe.com/docs/webhooks/signatures
- Trial Prevention Pattern: https://stripe.com/docs/billing/subscriptions/free-trials
- Idempotency in Payments: https://stripe.com/docs/api/idempotent_requests
