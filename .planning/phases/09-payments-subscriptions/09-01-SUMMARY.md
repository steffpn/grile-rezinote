---
phase: 09-payments-subscriptions
plan: 01
subsystem: payments
tags: [stripe, webhooks, drizzle, postgres, idempotent]

requires:
  - phase: 01-foundation-design-system
    provides: database schema with subscriptions table, drizzle-orm setup
  - phase: 02-landing-page-authentication
    provides: user auth, supabase client
provides:
  - Stripe server SDK singleton client
  - Stripe config with price IDs, currency, URLs
  - Idempotent webhook handler with event deduplication
  - Schema extensions (trialStartedAt, planType, cancelAtPeriodEnd, webhookEvents table)
affects: [09-02, 09-03, 09-04]

tech-stack:
  added: [stripe@20.x, "@stripe/stripe-js"]
  patterns: [idempotent-webhook-processing, event-deduplication, stripe-v20-api-helpers]

key-files:
  created:
    - src/lib/stripe/client.ts
    - src/lib/stripe/config.ts
    - src/lib/stripe/webhook-handlers.ts
    - src/app/api/webhooks/stripe/route.ts
    - src/lib/stripe/__tests__/webhook-handlers.test.ts
  modified:
    - src/lib/db/schema.ts
    - .env.example

key-decisions:
  - "Stripe v20 API: current_period_end moved to SubscriptionItem — created getCurrentPeriodEnd() helper"
  - "Stripe v20 API: Invoice.subscription moved to Invoice.parent.subscription_details.subscription — created getSubscriptionIdFromInvoice() helper"
  - "Used pnpm (not npm) for package installation — project uses pnpm-lock.yaml"

patterns-established:
  - "Stripe v20 helpers: always use helper functions for API fields that moved in v20"
  - "Webhook idempotency: check webhookEvents table for stripeEventId before processing"
  - "Raw body parsing: use request.text() not request.json() for Stripe signature verification"

requirements-completed: [PAY-05]

duration: ~25min
completed: 2026-03-03
---

# Plan 09-01: Stripe Infrastructure Summary

**Stripe SDK v20 server client, idempotent webhook handler with event deduplication, and schema extensions for trial tracking and plan types**

## Performance

- **Duration:** ~25 min
- **Tasks:** 4
- **Files created:** 5
- **Files modified:** 2

## Accomplishments
- Stripe server SDK singleton with typed client configuration
- Centralized config with price IDs, currency (RON), success/cancel URLs
- Schema extended with trialStartedAt on users, planType and cancelAtPeriodEnd on subscriptions, webhookEvents table
- Idempotent webhook handler processing 5 event types with Stripe v20 API compatibility
- 8 unit tests covering all webhook handler scenarios

## Task Commits

1. **Stripe client + config** - `9bd1fe7` (feat)
2. **Schema extensions** - `9bd1fe7` (feat)
3. **Webhook handlers + route** - `9bd1fe7` (feat)
4. **Webhook handler tests** - `9bd1fe7` (test)

## Files Created/Modified
- `src/lib/stripe/client.ts` - Stripe server SDK singleton
- `src/lib/stripe/config.ts` - Centralized Stripe config (prices, currency, URLs)
- `src/lib/stripe/webhook-handlers.ts` - Handles 5 webhook event types with v20 helpers
- `src/app/api/webhooks/stripe/route.ts` - POST endpoint with signature verification and deduplication
- `src/lib/stripe/__tests__/webhook-handlers.test.ts` - 8 tests for all webhook scenarios
- `src/lib/db/schema.ts` - Added trialStartedAt, planType, cancelAtPeriodEnd, webhookEvents table
- `.env.example` - Added Stripe env vars

## Decisions Made
- Stripe SDK v20 has breaking API changes — created helper functions for backwards-incompatible field moves
- Used request.text() for raw body in webhook route (not request.json()) for correct signature verification

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Stripe v20 API breaking changes**
- **Found during:** Webhook handler implementation
- **Issue:** current_period_end moved from Subscription to SubscriptionItem; Invoice.subscription moved to Invoice.parent.subscription_details
- **Fix:** Created getCurrentPeriodEnd() and getSubscriptionIdFromInvoice() helper functions
- **Files modified:** src/lib/stripe/webhook-handlers.ts
- **Verification:** All 8 tests pass with v20 API fixtures

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential fix for Stripe SDK v20 compatibility. No scope creep.

## Issues Encountered
- npm install failed because project uses pnpm — switched to `pnpm add`

## User Setup Required

**External services require manual configuration:**
- `STRIPE_SECRET_KEY` - Stripe dashboard > API Keys
- `STRIPE_PUBLISHABLE_KEY` - Stripe dashboard > API Keys
- `STRIPE_WEBHOOK_SECRET` - Stripe dashboard > Webhooks > Signing secret
- `STRIPE_MONTHLY_PRICE_ID` - Stripe dashboard > Products > Monthly price ID
- `STRIPE_ANNUAL_PRICE_ID` - Stripe dashboard > Products > Annual price ID
- `NEXT_PUBLIC_APP_URL` - Application base URL

## Next Phase Readiness
- Stripe infrastructure ready for checkout flow (Plan 09-03) and subscription checks (Plan 09-02)

---
*Phase: 09-payments-subscriptions*
*Completed: 2026-03-03*
