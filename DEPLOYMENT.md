# Deployment guide — grile-ReziNOTE

This is the operational manual for deploying and operating the platform. It assumes you are taking over the project from the original developer.

**Stack snapshot (May 2026)**

- **Framework:** Next.js 15 (App Router, RSC, Server Actions)
- **Auth:** NextAuth v5 (JWT strategy) — Credentials + Google OAuth
- **Database:** PostgreSQL via Drizzle ORM
- **Payments:** Stripe (Checkout + Customer Portal + Webhooks)
- **Email:** Resend (transactional)
- **Rate limiting:** Upstash Redis
- **Hosting:** Railway (recommended), Vercel-compatible
- **PWA:** Serwist service worker, installable on iOS/Android

> **Note:** an older version of this document described a Supabase + Supabase Auth setup. That is no longer accurate — the project moved to NextAuth + Drizzle. Ignore any Supabase references you may find in older audit/handoff notes.

---

## Table of contents

1. [Required services](#1-required-services)
2. [Environment variables](#2-environment-variables)
3. [Database setup](#3-database-setup)
4. [Stripe configuration](#4-stripe-configuration)
5. [Resend (email) configuration](#5-resend-email-configuration)
6. [Google OAuth](#6-google-oauth)
7. [Upstash (rate limiting)](#7-upstash-rate-limiting)
8. [Deploying to Railway](#8-deploying-to-railway)
9. [First-time admin setup](#9-first-time-admin-setup)
10. [Operator runbooks](#10-operator-runbooks)
11. [Backups and recovery](#11-backups-and-recovery)
12. [Production hardening checklist](#12-production-hardening-checklist)

---

## 1. Required services

| Service | What for | Free tier OK? |
|---|---|---|
| Postgres database | Persistent storage | yes (Railway has free Postgres) |
| Stripe | Payments + subscription management | yes (test mode); live billing requires verified business |
| Resend | Transactional email | yes (3000/mo, 100/day) |
| Upstash Redis | Rate limiting | yes |
| Google Cloud (OAuth) | "Continue with Google" | yes |
| Railway / Vercel / similar | App hosting | Railway has trial credit |

You can substitute any Postgres provider (Supabase database, Neon, RDS) — the app uses raw `postgres://` URLs via Drizzle.

---

## 2. Environment variables

Copy `.env.example` to `.env.local` and fill it. **Every variable in `.env.example` is required** unless explicitly marked `OPTIONAL`. The full list:

```
DATABASE_URL                              # Postgres connection
AUTH_SECRET                               # `npx auth secret`
AUTH_URL                                  # https://your-domain.com
AUTH_TRUST_HOST                           # "true" when behind any proxy
NEXT_PUBLIC_APP_URL                       # same as AUTH_URL
GOOGLE_CLIENT_ID                          # see §6
GOOGLE_CLIENT_SECRET
STRIPE_SECRET_KEY                         # see §4
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRO_MONTHLY_PRICE_ID
STRIPE_PRO_ANNUAL_PRICE_ID
STRIPE_PREMIUM_MONTHLY_PRICE_ID
STRIPE_PREMIUM_ANNUAL_PRICE_ID
RESEND_API_KEY                            # see §5
EMAIL_FROM                                # OPTIONAL, defaults to noreply@grile-rezinote.ro
UPSTASH_REDIS_REST_URL                    # see §7
UPSTASH_REDIS_REST_TOKEN
```

**Boot-time guarantees:** the app will throw at import if `UPSTASH_REDIS_REST_*` is missing (the rate limiter calls `Redis.fromEnv()` eagerly) and the first incoming Stripe webhook will fail signature verification if `STRIPE_WEBHOOK_SECRET` is wrong. Both are loud failures, not silent.

---

## 3. Database setup

### Option A — fresh database (recommended for new deployments)

```bash
# 1. Push the full schema (Drizzle generates DDL from src/lib/db/schema.ts).
pnpm db:push

# 2. Apply the hardening migration (indexes + cascades + GDPR columns).
psql "$DATABASE_URL" -f src/lib/db/migrations/0003_handoff_hardening.sql
```

`db:push` is idempotent; `0003_handoff_hardening.sql` is also idempotent (uses `IF NOT EXISTS` / DO blocks) so re-runs are safe.

### Option B — existing database

Run only the targeted migration files:

```bash
psql "$DATABASE_URL" -f src/lib/db/migrations/0001_add_plan_tier.sql
psql "$DATABASE_URL" -f src/lib/db/migrations/0002_user_profile_fields.sql
psql "$DATABASE_URL" -f src/lib/db/migrations/0003_handoff_hardening.sql
```

### Verifying the schema

```bash
psql "$DATABASE_URL" -c "\dt"           # list tables — should see ~14 tables
psql "$DATABASE_URL" -c "\d subscriptions"   # check UNIQUE on user_id
psql "$DATABASE_URL" -c "\d email_change_tokens"  # added by 0003
```

---

## 4. Stripe configuration

You need: **products, prices, webhook endpoint, customer-portal config**.

### 4.1 Create the products and prices

In Stripe Dashboard → Products, create two products: **PRO** and **PREMIUM**. For each, add two recurring prices:

| Product | Price | Currency | Interval |
|---|---|---|---|
| PRO | 119 RON | RON | monthly |
| PRO | 1142 RON (≈ 119 × 12 × 0.80) | RON | yearly |
| PREMIUM | 179 RON | RON | monthly |
| PREMIUM | 1718 RON (≈ 179 × 12 × 0.80) | RON | yearly |

Copy each `price_...` ID into the matching env var.

### 4.2 Webhook endpoint

Stripe Dashboard → Developers → Webhooks → **Add endpoint**.

- URL: `https://your-domain.com/api/webhooks/stripe`
- Events to send:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- Save → copy the **Signing secret** → set as `STRIPE_WEBHOOK_SECRET`.

### 4.3 Customer Portal

Stripe Dashboard → Settings → Billing → Customer Portal ([direct link](https://dashboard.stripe.com/settings/billing/portal)).

Enable:
- ☑ **Customer information** — let users update email
- ☑ **Payment methods** — add/remove cards
- ☑ **Invoices** — view + download
- ☑ **Cancel subscriptions** with reason collection
- ☑ **Update subscriptions** — allow switching between PRO / PREMIUM and monthly / annual
- ☐ Pause subscriptions — leave OFF (we don't model paused state)

Branding: upload logo, set brand color `#10b981` (emerald). Set:
- Terms of service: `https://your-domain.com/legal/terms`
- Privacy policy: `https://your-domain.com/legal/privacy`

Hit **Save**. The "Gestionează în Stripe" button on `/subscription` opens this portal.

### 4.4 Local development with Stripe CLI

```bash
# Forward webhooks to your local dev server:
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe

# Trigger test events:
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger invoice.payment_failed
```

The CLI prints a `whsec_...` to use as `STRIPE_WEBHOOK_SECRET` in your local `.env.local`.

---

## 5. Resend (email) configuration

1. Sign up at [resend.com](https://resend.com).
2. Domains → Add Domain → enter `grile-rezinote.ro`.
3. Resend shows 3 DNS records to add at your registrar:
   - **SPF** (TXT) — `v=spf1 include:_spf.resend.com ~all`
   - **DKIM** (TXT, two records: `resend._domainkey`)
   - **DMARC** (TXT) — `v=DMARC1; p=none; rua=mailto:dmarc@grile-rezinote.ro`
4. Wait for verification (5–30 minutes typically).
5. API Keys → Create API Key → scope: **Sending access** → copy → set as `RESEND_API_KEY`.
6. (Optional) Set `EMAIL_FROM="grile-ReziNOTE <noreply@grile-rezinote.ro>"` if you want a custom sender. Default is the same.

**Until the domain is verified**, sends will only succeed to the email address that owns the Resend account (test-mode behavior). Free tier: 3,000 emails/month, 100/day.

Emails sent by the app:
- Password reset (`/forgot-password` flow)
- Welcome (after credentials signup)
- Payment failed (Stripe webhook)
- Email-change verification
- Account-deleted confirmation

---

## 6. Google OAuth

1. [console.cloud.google.com](https://console.cloud.google.com) → Create or select a project.
2. APIs & Services → OAuth consent screen → External → fill in app name, support email, developer contact.
3. APIs & Services → Credentials → Create credentials → **OAuth client ID** → Web application.
4. Authorized JavaScript origins: `https://your-domain.com`, plus `http://localhost:3000` for dev.
5. Authorized redirect URIs:
   - `https://your-domain.com/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID + Client Secret → `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

**Before public launch:** OAuth consent screen → Publishing status → "Push to production". Otherwise only the test user list (set in the consent screen) can sign in with Google.

---

## 7. Upstash (rate limiting)

1. [console.upstash.com](https://console.upstash.com) → Create database → Redis.
2. Choose a region close to your hosting (Frankfurt for EU).
3. Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` from the database details page.

The app fails open if Redis is unreachable (logs an error and lets the request through) — so a Redis outage degrades to "no rate limiting" rather than full downtime.

---

## 8. Deploying to Railway

1. Create a new project at [railway.app](https://railway.app).
2. Add a **PostgreSQL** plugin → it auto-injects `DATABASE_URL`.
3. Connect the GitHub repo → Railway auto-detects Next.js.
4. Variables tab → paste every var from `.env.example` (filled with prod values).
5. Domains → "Generate" or add a custom domain (`grile-rezinote.ro`).
6. Trigger deploy. First deploy runs `npm run build` then `npm start`.

**After first deploy:**

```bash
# Apply schema (run from your local machine, against the prod DB):
DATABASE_URL="<railway-postgres-url>" pnpm db:push
psql "<railway-postgres-url>" -f src/lib/db/migrations/0003_handoff_hardening.sql
```

Railway provides automated daily backups by default — see §11.

### Vercel notes

The app runs on Vercel too. Move the Postgres elsewhere (Neon, Supabase, Railway) and add the same env vars. Vercel sets `AUTH_TRUST_HOST=true` automatically; you can leave it.

---

## 9. First-time admin setup

The app does not have a public admin signup. To promote your first admin:

```sql
UPDATE users
   SET is_superadmin = true,
       role = 'admin'
 WHERE email = 'your-admin-email@example.com';
```

After that user logs in, `/admin` becomes accessible. From there you can manage chapters, questions, specialties, admission data, and site settings.

---

## 10. Operator runbooks

### "User says their PRO didn't activate after paying"

```sql
-- 1. Find the user and their subscription row:
SELECT u.id, u.email, s.status, s.plan_tier, s.stripe_customer_id, s.stripe_subscription_id, s.current_period_end
  FROM users u
  LEFT JOIN subscriptions s ON s.user_id = u.id
 WHERE u.email = 'reporter@example.com';

-- 2. Check whether Stripe sent the webhook:
SELECT * FROM webhook_events
 WHERE processed_at > NOW() - INTERVAL '1 day'
 ORDER BY processed_at DESC LIMIT 20;
```

If no relevant webhook event arrived, check Stripe Dashboard → Developers → Webhooks → your endpoint → "Recent deliveries". Resend the failing event from there.

If the webhook fired but tier is still FREE: confirm the price ID on the subscription matches one of `STRIPE_*_PRICE_ID`. Mismatched price IDs are a silent failure (logged but not alerted) — fix the env var and replay the webhook.

### "Refund a customer"

Stripe Dashboard → Customers → find by email → Payments → ⋮ → Refund. The local DB stays in sync via the next webhook.

### "Comp / extend a trial"

```sql
-- Push trial start back so they get N more days from now:
UPDATE users SET trial_started_at = NOW() WHERE email = 'lucky@example.com';
```

If they previously consumed a trial, the `trial_history` row will block re-issuance. Clear it (rare):

```sql
DELETE FROM trial_history
 WHERE email_hash = encode(digest(LOWER(TRIM('lucky@example.com')), 'sha256'), 'hex');
```

### "Roll AUTH_SECRET"

Rotating `AUTH_SECRET` invalidates **every existing JWT** — all users get force-logged-out on next request. Communicate before doing this. Steps:

```bash
# 1. Generate new secret:
npx auth secret

# 2. Set it as AUTH_SECRET in Railway / your host.
# 3. Redeploy. Users will be redirected to /login.
```

### "Roll Stripe webhook secret"

Stripe Dashboard → Developers → Webhooks → endpoint → Signing secret → "Roll secret". Update `STRIPE_WEBHOOK_SECRET` in Railway, redeploy. There is a brief window where the old secret still works (Stripe documents this).

### "Roll Google OAuth client secret"

Cloud Console → Credentials → your OAuth client → Reset client secret. Update `GOOGLE_CLIENT_SECRET`, redeploy. In-flight Google sign-ins will fail until the new secret takes effect.

### "Bulk import questions"

Two paths:

1. **Admin UI** — `/admin/import-export` accepts CSV/XLSX uploaded from the browser. The format is documented in the page itself.
2. **CLI scripts** — `scripts/import-grile.mjs` and `scripts/import-xlsx-grile.mjs` for batch runs.

Cap: 5,000 rows per upload (set in `import-export.ts` to bound DoS surface).

### "User wants their data" / "User wants to delete account"

These are now self-service in the app — direct them to **Profil → Cont și date**:
- "Descarcă toate datele (JSON)" → returns a JSON file with everything.
- "Șterge contul" → confirms with email, cancels Stripe sub, deletes the row + cascades.

The account-deletion flow keeps `trial_history` (pseudonymous SHA-256 of email) on purpose, to prevent re-signup trial abuse.

---

## 11. Backups and recovery

**Railway Postgres** ships with daily automated backups, retained 7 days on the free plan, longer on paid plans (configurable in plugin settings → Backups).

**Test the restore** before declaring this done:

```bash
# 1. From Railway Postgres → Backups, download a snapshot.
# 2. Spin up a temporary Postgres and restore:
pg_restore -d "$TEMP_DB_URL" snapshot.dump
# 3. Verify row counts match expectation.
```

**RTO/RPO target (suggested):** 4-hour RTO, 24-hour RPO. Document any deviation with the client.

If you need point-in-time recovery (sub-day granularity), upgrade to Railway's Pro plan or move to a Postgres provider that supports PITR (Neon, Supabase Pro, AWS RDS).

---

## 12. Production hardening checklist

Run through this list once before flipping the public-launch switch.

- [ ] All `.env` values are set in production. No defaults masking missing config.
- [ ] DNS records for the email domain (SPF / DKIM / DMARC) verified in Resend.
- [ ] Google OAuth consent screen status: **Production**, not Testing.
- [ ] Stripe in **Live mode** with verified business. Test-mode keys removed from prod env.
- [ ] Stripe webhook endpoint pointed at the prod URL with the prod signing secret.
- [ ] Stripe Customer Portal configured (§4.3) and "Gestionează în Stripe" button works.
- [ ] First admin promoted via SQL (§9).
- [ ] `0003_handoff_hardening.sql` applied (indexes + cascades + UNIQUE).
- [ ] Railway backups confirmed enabled. Restore drill performed at least once.
- [ ] Smoke test: signup → email arrives, login → password reset email arrives, checkout → tier upgrades, customer portal → opens, account deletion → completes and signs out.
- [ ] `npx tsc --noEmit` and `vitest run` both clean.

---

## Support contacts

- Stripe: [support.stripe.com](https://support.stripe.com)
- Resend: support@resend.com
- Railway: [railway.app/help](https://railway.app/help)
- Project email: support@grile-rezinote.ro
