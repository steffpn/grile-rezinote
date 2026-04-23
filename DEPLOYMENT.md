# Deployment Guide — grile-ReziNOTE

Complete step-by-step instructions for running locally and deploying to Vercel, including all external service configuration and superadmin setup.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [External Services Setup](#2-external-services-setup)
3. [Running Locally](#3-running-locally)
4. [Deploying to Vercel](#4-deploying-to-vercel)
5. [Creating a Superadmin](#5-creating-a-superadmin)
6. [Post-Deploy Verification Checklist](#6-post-deploy-verification-checklist)
7. [Production Hardening](#7-production-hardening)

---

## 1. Prerequisites

- **Node.js** 18+ (20 LTS recommended)
- **pnpm** — this project uses pnpm, not npm or yarn
  ```bash
  npm install -g pnpm
  ```
- **Git** — to clone the repo
- Accounts on: **Supabase**, **Stripe**, **Vercel** (for cloud deploy)

---

## 2. External Services Setup

You need to configure Supabase and Stripe **before** the app can run. Do this once — the same config works for both local and Vercel.

### 2A. Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Choose a region close to your users (e.g., `eu-central-1` for Romania).
3. Set a strong database password — save it somewhere, you'll need it.
4. Wait for the project to finish provisioning (~2 minutes).

**Collect these values** from Project Settings > API:

| Value | Where to find it |
|-------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings > API > Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings > API > anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings > API > service_role secret key |
| `DATABASE_URL` | Settings > Database > Connection string (URI) — use the **Transaction** pooler URI (port 6543) |

> **Important:** For `DATABASE_URL`, use the **Transaction mode** pooler connection string (port 6543), not the direct connection (port 5432). The app disables prepared statements for compatibility with transaction pooling.

#### Configure Supabase Auth

Go to **Authentication > Providers** in the Supabase dashboard:

1. **Email provider** — must be enabled (it is by default).
2. Go to **Authentication > URL Configuration**:
   - **Site URL**: `http://localhost:3000` (for local) or `https://yourdomain.com` (for production)
   - **Redirect URLs** — add all of these:
     ```
     http://localhost:3000/auth/confirm
     https://yourdomain.com/auth/confirm
     ```
3. Go to **Authentication > Email Templates**:
   - **Confirm signup** template: Make sure it contains `{{ .ConfirmationURL }}` as the link.
   - **Reset password** template: Make sure it contains `{{ .ConfirmationURL }}` as the link.
   - The default templates work fine — no changes needed unless you want to customize the text.

#### Create the Database Trigger (CRITICAL)

The app stores user profiles in a `public.users` table that mirrors Supabase's `auth.users`. You **must** create a database trigger so that when someone signs up, a row is automatically created in `public.users`.

Go to **SQL Editor** in the Supabase dashboard and run this:

```sql
-- Function: create a public.users row when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, year_of_study, role, is_superadmin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilizator'),
    (NEW.raw_user_meta_data->>'year_of_study')::integer,
    'student',
    false
  );
  RETURN NEW;
END;
$$;

-- Trigger: fire after every new auth user insert
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

> Without this trigger, users who sign up will get stuck — the app queries `public.users` on every page load and redirects to `/login` if no row is found.

#### Enable Row-Level Security (Recommended for Production)

The middleware queries `users` and `subscriptions` via the Supabase client (using the anon key). You need RLS policies so the middleware can read the current user's data but users can't read each other's data.

Run in **SQL Editor**:

```sql
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admission_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Users: can read own row
CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Subscriptions: can read own row
CREATE POLICY "Users can read own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Chapters: all authenticated users can read (needed for tests/questions)
CREATE POLICY "Authenticated users can read chapters"
  ON public.chapters FOR SELECT
  USING (auth.role() = 'authenticated');

-- Questions: all authenticated users can read
CREATE POLICY "Authenticated users can read questions"
  ON public.questions FOR SELECT
  USING (auth.role() = 'authenticated');

-- Options: all authenticated users can read
CREATE POLICY "Authenticated users can read options"
  ON public.options FOR SELECT
  USING (auth.role() = 'authenticated');

-- Attempts: can read own attempts
CREATE POLICY "Users can read own attempts"
  ON public.attempts FOR SELECT
  USING (auth.uid() = user_id);

-- Attempt answers: can read own answers
CREATE POLICY "Users can read own answers"
  ON public.attempt_answers FOR SELECT
  USING (
    attempt_id IN (
      SELECT id FROM public.attempts WHERE user_id = auth.uid()
    )
  );

-- Specialties: all authenticated can read
CREATE POLICY "Authenticated users can read specialties"
  ON public.specialties FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admission data: all authenticated can read
CREATE POLICY "Authenticated users can read admission data"
  ON public.admission_data FOR SELECT
  USING (auth.role() = 'authenticated');

-- Site settings: all authenticated can read
CREATE POLICY "Authenticated users can read site settings"
  ON public.site_settings FOR SELECT
  USING (auth.role() = 'authenticated');

-- Service role bypasses RLS automatically, so Server Actions
-- using the DATABASE_URL (Drizzle ORM) are unaffected by these policies.
-- These policies only affect the Supabase JS client (anon key) used in middleware.
```

> **Note:** The server-side code (Server Actions, API routes) connects via `DATABASE_URL` with the `postgres` driver, which uses the database role directly and is **not** affected by RLS. These policies only govern the Supabase JS client used in middleware for session-aware queries.

### 2B. Stripe Setup

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com).
2. If testing, make sure you're in **Test Mode** (toggle in the top right).

#### Create Products and Prices

The platform uses a 3-tier model: **FREE** (no Stripe price needed), **PRO**, and **PREMIUM**. You need to create **2 products** in Stripe, each with **2 prices** (monthly + annual), for a total of **4 prices**.

See `STRIPE_SETUP.md` for full step-by-step instructions. Summary:

1. Go to **Products > + Add product**:
   - **Product 1: grile-ReziNOTE PRO**
     - Monthly price: **119 RON / month** → copy ID to `STRIPE_PRO_MONTHLY_PRICE_ID`
     - Annual price: **1142.40 RON / year** (≈ 95.20 RON/month, 20% discount) → copy ID to `STRIPE_PRO_ANNUAL_PRICE_ID`
   - **Product 2: grile-ReziNOTE PREMIUM**
     - Monthly price: **179 RON / month** → copy ID to `STRIPE_PREMIUM_MONTHLY_PRICE_ID`
     - Annual price: **1718.40 RON / year** (≈ 143.20 RON/month, 20% discount) → copy ID to `STRIPE_PREMIUM_ANNUAL_PRICE_ID`

> **Trial (7 days):** Applied in code via `subscription_data.trial_period_days` on Checkout Session creation — you do NOT need to configure trial on individual prices in Stripe Dashboard. Anti-abuse check: trial only granted to users who haven't used it before.

#### Collect API Keys

Go to **Developers > API keys**:

| Value | Where |
|-------|-------|
| `STRIPE_SECRET_KEY` | Secret key (starts with `sk_test_` or `sk_live_`) |
| `STRIPE_PUBLISHABLE_KEY` | Publishable key (starts with `pk_test_` or `pk_live_`) |

#### Create Webhook Endpoint

**For local development** — use Stripe CLI (see Section 3).

**For Vercel production:**

1. Go to **Developers > Webhooks > + Add endpoint**
2. Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
3. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Click "Add endpoint"
5. Copy the **Signing secret** (starts with `whsec_...`) → this is your `STRIPE_WEBHOOK_SECRET`

---

## 3. Running Locally

### Step 1: Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/grile-ReziNOT.git
cd grile-ReziNOT
pnpm install
```

### Step 2: Create `.env.local`

Copy the example and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key
DATABASE_URL=postgresql://postgres.YOUR_PROJECT:YOUR_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Stripe (use test keys for local dev)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # from Stripe CLI (see Step 4)
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_ANNUAL_PRICE_ID=price_...
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_...
STRIPE_PREMIUM_ANNUAL_PRICE_ID=price_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: Push the database schema

This creates all tables in your Supabase database:

```bash
pnpm db:push
```

You should see output confirming all tables were created. Then seed the default settings:

Connect to your database (via Supabase SQL Editor or `psql`) and run:

```sql
INSERT INTO site_settings (key, value, updated_at)
VALUES ('exam_duration_seconds', '14400', now())
ON CONFLICT (key) DO NOTHING;
```

### Step 4: Set up Stripe CLI for local webhooks

Install the [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows (scoop)
scoop install stripe

# Or download from https://github.com/stripe/stripe-cli/releases
```

Login and forward webhooks:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

The CLI will print a webhook signing secret like:

```
> Ready! Your webhook signing secret is whsec_1234567890abcdef...
```

Copy that value into your `.env.local` as `STRIPE_WEBHOOK_SECRET`.

**Keep this terminal running** while developing.

### Step 5: Run the dev server

```bash
pnpm dev
```

The app starts at [http://localhost:3000](http://localhost:3000).

### Step 6: Run tests (optional)

```bash
pnpm test
```

All 45 tests should pass (scoring engine + webhooks + subscription access).

---

## 4. Deploying to Vercel

### Step 1: Push to GitHub

Make sure your code is pushed to a GitHub repository. Vercel deploys from Git.

```bash
git push origin main
```

### Step 2: Import project in Vercel

1. Go to [vercel.com](https://vercel.com) > **Add New Project**
2. Import your GitHub repository
3. Framework: **Next.js** (auto-detected)
4. Build command: `pnpm build` (auto-detected)
5. Output directory: leave default (`.next`)

### Step 3: Set environment variables

In the Vercel project settings, go to **Settings > Environment Variables** and add ALL of these:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://YOUR_PROJECT.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `DATABASE_URL` | Your Supabase pooler connection string (port 6543) |
| `NEXT_PUBLIC_SITE_URL` | `https://yourdomain.com` (your Vercel domain) |
| `NEXT_PUBLIC_APP_URL` | `https://yourdomain.com` (same as above) |
| `STRIPE_SECRET_KEY` | `sk_live_...` (or `sk_test_...` for staging) |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_...` (or `pk_test_...` for staging) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (from the Stripe webhook you created in Section 2B) |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | `price_...` (PRO tier, monthly billing) |
| `STRIPE_PRO_ANNUAL_PRICE_ID` | `price_...` (PRO tier, annual billing) |
| `STRIPE_PREMIUM_MONTHLY_PRICE_ID` | `price_...` (PREMIUM tier, monthly billing) |
| `STRIPE_PREMIUM_ANNUAL_PRICE_ID` | `price_...` (PREMIUM tier, annual billing) |

> **Important:** Use the same `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_APP_URL` — they should both be your production domain (e.g., `https://grile-rezinote.vercel.app` or your custom domain).

### Step 4: Deploy

Click **Deploy**. Vercel will build and deploy automatically.

After the first deploy succeeds, note your production URL (e.g., `https://grile-rezinote.vercel.app`).

### Step 5: Update Supabase redirect URLs

Go back to Supabase dashboard > **Authentication > URL Configuration**:

- Set **Site URL** to your Vercel production URL
- Add your production URL to **Redirect URLs**:
  ```
  https://yourdomain.com/auth/confirm
  ```

### Step 6: Create Stripe production webhook

If you haven't already (from Section 2B):

1. Stripe Dashboard > **Developers > Webhooks > + Add endpoint**
2. URL: `https://yourdomain.com/api/webhooks/stripe`
3. Events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
4. Copy the signing secret → update `STRIPE_WEBHOOK_SECRET` in Vercel env vars
5. **Redeploy** after changing env vars (Vercel > Deployments > Redeploy)

### Step 7: Push database schema (if not done)

If this is a fresh Supabase project that hasn't had `db:push` run yet, run it locally with your production `DATABASE_URL`:

```bash
DATABASE_URL="your-production-connection-string" pnpm db:push
```

Then seed the default exam duration:

```sql
INSERT INTO site_settings (key, value, updated_at)
VALUES ('exam_duration_seconds', '14400', now())
ON CONFLICT (key) DO NOTHING;
```

---

## 5. Creating a Superadmin

The admin panel is protected by the `isSuperadmin` flag on the `users` table. There is no UI to promote users — you must do it via SQL. This is intentional for security.

### Method: SQL (works for both local and Vercel)

**Step 1:** Sign up as a normal user through the app UI at `/signup`. Complete the email verification.

**Step 2:** Open the Supabase dashboard > **SQL Editor** and run:

```sql
UPDATE users
SET is_superadmin = true
WHERE email = 'your-email@example.com';
```

Replace `your-email@example.com` with the email you signed up with.

**Step 3:** Refresh the app. You can now access `/admin` and all admin routes:

| Route | Purpose |
|-------|---------|
| `/admin` | Admin dashboard |
| `/admin/chapters` | Manage chapters (create, edit, reorder, delete) |
| `/admin/questions` | Manage questions (create, edit, CS/CM types, source references) |
| `/admin/import-export` | Bulk import/export questions from CSV/Excel |
| `/admin/specialties` | Manage dental specialties |
| `/admin/admission-data` | Manage historical admission thresholds |
| `/admin/settings` | Configure exam duration |

### Verifying it worked

After running the SQL update:

1. Go to your app and log in with the promoted account
2. Navigate to `/admin` — you should see the admin panel
3. If you get redirected to `/dashboard` instead, the update didn't take — double-check the email matches exactly

### Creating additional admins

Repeat the same process: have them sign up normally, then run the SQL update. The `isSuperadmin` flag is the only thing that controls admin access.

---

## 6. Post-Deploy Verification Checklist

Run through these after deploying to make sure everything works:

### Auth Flow
- [ ] Sign up with a new email → receive verification email
- [ ] Click verification link → redirected to `/dashboard`
- [ ] Log out → redirected to `/login`
- [ ] Log in with the same credentials → back to `/dashboard`
- [ ] Test "Forgot password" → receive reset email → set new password

### Admin Panel
- [ ] Superadmin can access `/admin`
- [ ] Regular user cannot access `/admin` (redirected to `/dashboard`)
- [ ] Create a chapter in admin
- [ ] Create a question (both CS and CM types) in admin
- [ ] Import questions from a CSV file

### Practice & Exams
- [ ] Start a chapter practice test → answer questions → see results
- [ ] Start a mixed practice test → verify questions from multiple chapters
- [ ] Start an exam simulation → timer visible and counting down
- [ ] Answer some questions, close browser, come back → answers preserved

### Payments (use Stripe test mode)
- [ ] Visit `/pricing` → see monthly and annual plans
- [ ] Click subscribe → redirected to Stripe Checkout
- [ ] Use test card `4242 4242 4242 4242` → payment succeeds
- [ ] Redirected to `/checkout/success`
- [ ] Subscription shows as active in `/subscription`

### Dashboard
- [ ] After completing a test, dashboard shows updated stats
- [ ] Charts render (trend chart, radar chart)
- [ ] Answer history shows completed test answers

### PWA
- [ ] On mobile, the browser shows "Add to Home Screen" prompt
- [ ] After installing, app opens in standalone mode (no browser chrome)

---

## 7. Production Hardening

The security audit found issues that should be fixed before going live with real users:

### Critical — Fix Before Launch

1. **SQL injection in practice.ts** (`src/lib/actions/practice.ts` ~line 144)
   - The `wrongAnswersOnly` code path uses `sql.raw()` to build an `IN` clause from chapter IDs
   - Fix: replace `sql.raw()` with `sql.join()` using parameterized `sql` template literals (the safe pattern is already used elsewhere in the codebase)

2. **No rate limiting on auth endpoints**
   - `login()`, `signup()`, and `forgotPassword()` have no rate limiting
   - Fix: Add rate limiting via Vercel's Edge Middleware, or use a library like `@upstash/ratelimit` with Vercel KV:
     ```
     pnpm add @upstash/ratelimit @upstash/redis
     ```
   - Alternatively, Supabase has built-in rate limiting on their auth endpoints — but the Server Actions bypass it since they call Supabase server-side

3. **Supabase RLS policies**
   - See Section 2A above — the RLS SQL is provided
   - Without RLS, any authenticated user could query any other user's data by calling Supabase's PostgREST API directly with their anon key

### High — Fix This Sprint

4. **Add auth checks to Stripe actions** — `getCheckoutSession()` and `getSubscriptionDetails()` in `src/lib/stripe/actions.ts` don't verify the caller owns the session/subscription. Add `getCurrentUser()` checks.

5. **Add superadmin check in middleware** — Currently, `/admin` routes are only protected at the layout level (`getCurrentAdmin()`). Add a middleware check so admin routes are blocked before page rendering:
   ```typescript
   // In middleware.ts, after the existing admin auth check:
   if (user && pathname.startsWith("/admin")) {
     const { data: userRecord } = await supabase
       .from("users")
       .select("is_superadmin")
       .eq("id", user.id)
       .single()
     if (!userRecord?.is_superadmin) {
       return NextResponse.redirect(new URL("/dashboard", request.url))
     }
   }
   ```

6. **Add security headers** in `next.config.ts`:
   ```typescript
   const nextConfig: NextConfig = {
     async headers() {
       return [
         {
           source: "/(.*)",
           headers: [
             { key: "X-Frame-Options", value: "DENY" },
             { key: "X-Content-Type-Options", value: "nosniff" },
             { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
             { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
             {
               key: "Strict-Transport-Security",
               value: "max-age=63072000; includeSubDomains; preload",
             },
           ],
         },
       ]
     },
   }
   ```

### Environment Checklist for Production

- [ ] Switch Stripe from test keys (`sk_test_`, `pk_test_`) to live keys (`sk_live_`, `pk_live_`)
- [ ] Create live Stripe products/prices (the test ones won't work in live mode)
- [ ] Update `STRIPE_WEBHOOK_SECRET` to the live webhook's signing secret
- [ ] Set `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_APP_URL` to your real domain
- [ ] Update Supabase Site URL and Redirect URLs to your real domain
- [ ] Verify the database trigger `on_auth_user_created` exists
- [ ] Verify RLS policies are enabled
- [ ] Seed `site_settings` with default exam duration

---

## Environment Variables — Complete Reference

```env
# ── Supabase ──────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=         # Project URL (https://xxx.supabase.co)
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Public anon key
SUPABASE_SERVICE_ROLE_KEY=        # Secret service role key
DATABASE_URL=                     # PostgreSQL connection string (pooler, port 6543)

# ── App URLs ──────────────────────────────────────
NEXT_PUBLIC_SITE_URL=             # Used for auth email redirects
NEXT_PUBLIC_APP_URL=              # Used for Stripe checkout success/cancel URLs

# ── Stripe ────────────────────────────────────────
STRIPE_SECRET_KEY=                   # sk_test_... or sk_live_...
STRIPE_PUBLISHABLE_KEY=              # pk_test_... or pk_live_...
STRIPE_WEBHOOK_SECRET=               # whsec_... (from Stripe webhook endpoint)
STRIPE_PRO_MONTHLY_PRICE_ID=         # price_... (PRO tier, monthly: 119 RON)
STRIPE_PRO_ANNUAL_PRICE_ID=          # price_... (PRO tier, annual: ~1142 RON, 20% off)
STRIPE_PREMIUM_MONTHLY_PRICE_ID=     # price_... (PREMIUM tier, monthly: 179 RON)
STRIPE_PREMIUM_ANNUAL_PRICE_ID=      # price_... (PREMIUM tier, annual: ~1718 RON, 20% off)
```

Total: 11 environment variables (6 public/shared, 5 secret).
