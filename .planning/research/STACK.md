# Technology Stack

**Project:** grile-ReziNOTE (Medical Exam Prep SaaS -- Romanian Dental Residency)
**Researched:** 2026-03-02
**Overall confidence:** HIGH

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js | 15.3.x (latest 15 line) | Full-stack React framework | App Router with RSC, Server Actions, built-in API routes, excellent Vercel/self-host story. v15 is the battle-tested stable line with widest ecosystem compatibility. v16 exists (16.1.6) but removes legacy APIs and has narrower third-party support. Start on 15, upgrade to 16 when ecosystem catches up. | HIGH |
| React | 19.x | UI library | Ships with Next.js 15. Server Components, Suspense, use() hook, React Compiler support. No reason to pin to 18. | HIGH |
| TypeScript | ~5.9 | Type safety | Non-negotiable for a SaaS. Catches bugs at build time, powers Drizzle type inference, Zod schema inference, and IDE autocomplete. | HIGH |

### Database & ORM

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Supabase (PostgreSQL) | Managed | Database hosting, Auth, Storage, RLS | Managed Postgres with built-in auth (email+password), Row Level Security, file storage, and real-time subscriptions. Free tier handles MVP (500MB, 50k MAU). Eliminates need for separate auth service, separate DB hosting, and separate file storage. One platform = faster shipping. | HIGH |
| Drizzle ORM | 0.45.x | Type-safe database queries | 7KB bundle, zero binary dependencies, SQL-like API, excellent TypeScript inference. Dramatically smaller than Prisma (~no cold start penalty on serverless). Generates single optimized SQL statements. Works natively with Supabase Postgres via `postgres.js` driver. | HIGH |
| Drizzle Kit | 0.31.x | Schema migrations | Companion CLI for Drizzle. Generates SQL migrations from schema changes, supports push for dev. | HIGH |

### Authentication

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Supabase Auth | (via @supabase/ssr) | Email + password auth | Built into Supabase at no extra cost. Supports email/password with email verification, password reset, and session management via cookies. RLS policies automatically scope data per user. No vendor lock-in beyond Supabase (which is open-source and self-hostable). PROJECT.md specifies email+password only -- Supabase Auth covers this perfectly without needing Clerk ($) or Auth.js (complex setup). | HIGH |
| @supabase/ssr | 0.9.x | Server-side auth for Next.js | Official package for cookie-based sessions in Next.js App Router. Handles SSR/RSC auth seamlessly. | HIGH |
| @supabase/supabase-js | 2.98.x | Supabase client SDK | Client-side Supabase operations, real-time subscriptions, storage access. | HIGH |

### Payments

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Stripe | 20.x (Node SDK) | Subscription billing | PROJECT.md mandates Stripe. Works in Romania. Use Embedded Checkout (stays on your domain, PCI compliant). Server Actions for checkout flows (no API routes needed). Webhook-driven fulfillment via `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. | HIGH |

### Styling & UI

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Tailwind CSS | 4.x | Utility-first CSS | v4 is a ground-up rewrite: 5x faster full builds, 100x faster incremental builds, zero-config setup. Industry standard for Next.js projects. Perfect for component-level styling without CSS-in-JS overhead. | HIGH |
| shadcn/ui | latest | Component library | Not a dependency -- components are copied into your project. Full code ownership, zero vendor lock-in, Tailwind-native, built on Radix UI (accessible). Dominant choice for Next.js SaaS dashboards in 2025-2026. Includes form components, dialogs, tables, charts, and more. | HIGH |
| Lucide React | 0.576.x | Icons | Default icon set for shadcn/ui. Tree-shakeable, consistent, 1000+ icons. | HIGH |

### Charts & Visualization

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Recharts | 3.7.x | Dashboard charts & analytics | React-native SVG charting library. JSX API, integrates naturally with React state. Best choice for the dashboard visualizations (progress trends, score distributions, percentile charts). shadcn/ui has a built-in chart component wrapping Recharts. Not ideal for 10K+ data points, but quiz analytics will never hit that -- student score history is small data. | HIGH |

### Forms & Validation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Zod | 4.x | Schema validation | TypeScript-native schema validation. Same schema validates client forms AND Server Actions. `z.infer<>` generates types automatically. Integrates with Drizzle for DB schema validation. | HIGH |
| React Hook Form | 7.71.x | Form state management | Minimal re-renders (uncontrolled components), tiny bundle. Combined with Zod via `@hookform/resolvers` for declarative validation. Powers quiz answer forms, admin CRUD forms, settings forms. | HIGH |
| @hookform/resolvers | 5.x | Zod-to-RHF bridge | Connects Zod schemas to React Hook Form. One-line integration. | HIGH |

### State Management

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Zustand | 5.x | Client-side global state | 3KB bundle, zero boilerplate. Use for: active quiz session state (current question, answers, timer), UI state (sidebar open, theme). Most app state lives on the server (Supabase) -- Zustand only for ephemeral client state. | HIGH |

### Data Fetching

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| TanStack Query | 5.90.x | Client-side data fetching & caching | Smart caching, automatic refetching, optimistic updates. Use for: dashboard data, leaderboards, quiz history. Server Components handle initial data; TanStack Query manages client-side mutations and real-time updates. | HIGH |

### PWA

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @serwist/next | 9.x | Service worker & PWA | Successor to next-pwa (unmaintained). Built on Google Workbox. Handles precaching, offline support, install prompts. Has dedicated `@serwist/turbopack` package for Turbopack compatibility. PROJECT.md requires PWA -- this is the modern, maintained solution. | MEDIUM |

### Email

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Resend | 6.x (SDK) | Transactional email delivery | Clean API, React Email integration built-in, free tier (3K emails/month). Use for: email verification, password reset, subscription confirmations. Works from Next.js Server Actions directly. | MEDIUM |
| React Email | 5.x | Email templates | Build email templates as React components. Type-safe, previewable in dev. Renders to HTML for any email provider. Maintained by Resend team. | MEDIUM |

### Excel/CSV Import-Export

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| SheetJS (xlsx) | 0.18.x | Excel & CSV import/export | PROJECT.md requires Excel/CSV import-export for quiz questions. SheetJS is the de facto standard -- reads .xlsx, .xls, .csv; writes .xlsx, .csv. Battle-tested, works in browser and Node.js. Community edition is free (Apache 2.0). | HIGH |

### Data Table

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| TanStack Table | 8.x | Headless table logic | Powers the admin panel quiz management table. Sorting, filtering, pagination, column visibility. shadcn/ui has a data-table component built on TanStack Table. Headless = full styling control. | HIGH |

### Utilities

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| date-fns | 4.x | Date formatting & manipulation | Tree-shakeable, immutable, TypeScript-native. Use for: exam timer formatting, "last practiced" timestamps, trend date ranges. Lighter than dayjs for what we need. | HIGH |

### Infrastructure & Deployment

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vercel | N/A | Hosting (initial) | Zero-config Next.js deployment. Free tier generous for MVP (100GB bandwidth). Automatic preview deployments per PR. Switch to Coolify + Hetzner VPS ($5/mo) if costs grow past ~$20/mo. | MEDIUM |
| Supabase Cloud | N/A | Database hosting | Free tier: 500MB DB, 1GB storage, 50K MAU auth. Sufficient for MVP + first 1000 users. Pro plan at $25/mo when needed. Self-hostable if needed later. | HIGH |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | Next.js 15 | Remix, SvelteKit | Next.js has the largest ecosystem, best Vercel integration, most SaaS boilerplates/examples. Remix is good but smaller ecosystem. SvelteKit requires learning Svelte. |
| Framework version | Next.js 15.3.x | Next.js 16.1.x | v16 is `latest` on npm but removes legacy APIs (AMP, runtime configs), enforces async params/cookies/headers. Ecosystem (Serwist, some middleware) has wider v15 compatibility. Upgrade path is straightforward later. |
| ORM | Drizzle | Prisma | Prisma has larger community but: heavier binary dependency (~40MB), slower cold starts on serverless, N+1 query risk. Drizzle is 7KB, SQL-native, better performance. Prisma 7 improved but Drizzle still wins on bundle size and edge compatibility. |
| Auth | Supabase Auth | Clerk | Clerk is excellent DX but costs $0.02/MAU past 10K users. Supabase Auth is free (included), handles email+password perfectly, integrates with RLS. No OAuth needed per PROJECT.md, so Clerk's social login strengths are wasted. |
| Auth | Supabase Auth | Auth.js (NextAuth v5) | Auth.js requires building your own UI, configuring adapters, managing sessions manually. Supabase Auth is drop-in with built-in email verification and password reset. Less code, fewer bugs. |
| UI Library | shadcn/ui | MUI (Material UI) | MUI is heavier (larger bundle), opinionated Material Design look (corporate feel). PROJECT.md wants "professional but friendly, not corporate." shadcn/ui + Tailwind gives full design control with accessible primitives. |
| Charts | Recharts | Chart.js / react-chartjs-2 | Chart.js is canvas-based (harder to customize individual elements), less React-idiomatic. Recharts is JSX-native, SVG-based, and shadcn/ui wraps it natively. |
| Charts | Recharts | Nivo | Nivo is more powerful but heavier dependency. Quiz analytics don't need 3D/geographic charts. Recharts covers bar, line, area, pie, radar -- everything needed for score distributions and progress trends. |
| State | Zustand | Redux Toolkit | Redux is overkill for this app. Most state is server-side (Supabase). Zustand's 3KB is perfect for quiz session state. |
| State | Zustand | Jotai | Jotai excels at atomic/interdependent state. Quiz state is a single coherent object (current question, answers, timer). Zustand's single-store model maps better to this use case. |
| Email | Resend | Mailgun, SendGrid | Resend has native React Email integration, cleaner API, better free tier (3K/mo). Mailgun raised prices in Dec 2025. SendGrid's DX is dated. For low-volume transactional email (verification, password reset), Resend is simplest. |
| PWA | Serwist | next-pwa | next-pwa is unmaintained. Serwist is its spiritual successor, built on Workbox, actively maintained, supports both Webpack and Turbopack. |
| Hosting | Vercel (initial) | Coolify + Hetzner | Vercel is right for MVP speed. When bandwidth costs exceed ~$20/mo, migrate to Coolify on Hetzner VPS ($5/mo). Coolify provides Vercel-like DX (git push deploy, preview URLs, auto SSL) on your own infra. |
| Database | Supabase | PlanetScale, Neon | Supabase bundles auth + DB + storage + real-time. PlanetScale is MySQL (not Postgres). Neon is Postgres but no auth/storage. Supabase's all-in-one approach means fewer services to manage for a small team. |
| Excel/CSV | SheetJS | Papa Parse + ExcelJS | SheetJS handles both Excel AND CSV in one library. Papa Parse is CSV-only (need ExcelJS for Excel). One dependency vs two. |

---

## Installation

```bash
# Create Next.js project
npx create-next-app@latest grile-rezinote --typescript --tailwind --app --src-dir

# Core dependencies
npm install @supabase/supabase-js @supabase/ssr drizzle-orm postgres stripe zustand @tanstack/react-query @tanstack/react-table recharts react-hook-form @hookform/resolvers zod date-fns xlsx resend react-email @serwist/next serwist lucide-react

# Dev dependencies
npm install -D drizzle-kit typescript @types/node tailwindcss postcss autoprefixer
```

**shadcn/ui setup (after project creation):**
```bash
npx shadcn@latest init
# Then add components as needed:
npx shadcn@latest add button card dialog form input table chart
```

---

## Key Architecture Decisions

### Why Supabase as the "Backend"

Supabase replaces 3-4 separate services:
1. **Database hosting** -- Managed PostgreSQL
2. **Authentication** -- Email/password with verification, password reset
3. **File storage** -- For potential future features (profile photos, etc.)
4. **Row Level Security** -- Authorization at the database level

This means NO separate backend/API server. Next.js Server Actions + Supabase client = full stack.

### Why Drizzle Over Prisma

For a quiz platform with well-defined schemas:
- Quiz questions, chapters, user scores, exam results -- all simple relational data
- Drizzle's SQL-like API maps naturally to Postgres operations
- 7KB vs Prisma's multi-MB binary = faster deployments, lower cold starts
- Schema-first approach with TypeScript inference = type-safe without code generation step

### Why NOT a Separate API (Express/Fastify)

Next.js Server Actions + Route Handlers replace a traditional API server:
- Server Actions for mutations (submit quiz, create question, process payment)
- Route Handlers for webhooks (Stripe webhook endpoint)
- No CORS issues, no separate deployment, no API versioning overhead
- Supabase RLS handles authorization at the DB layer

### Stripe Integration Pattern

```
User clicks Subscribe
  -> Server Action creates Stripe Checkout Session (Embedded mode)
  -> User completes payment on your domain (Stripe iframe)
  -> Stripe sends webhook to /api/webhooks/stripe
  -> Webhook handler updates subscription status in Supabase
  -> RLS policies gate premium content based on subscription status
```

Never trust client-side payment confirmation. Always use webhooks.

### PWA Strategy

Serwist handles:
- **Precaching** -- App shell cached on install for instant loads
- **Runtime caching** -- Quiz data cached for offline review
- **Install prompt** -- "Add to Home Screen" on mobile browsers
- **Manifest** -- App name, icons, theme color for installed experience

Note: Offline quiz-taking requires careful IndexedDB strategy (sync answers when back online). This is a Phase 2+ concern.

---

## Version Pinning Strategy

Pin major versions, allow patch updates:

```json
{
  "next": "^15.3.0",
  "react": "^19.0.0",
  "drizzle-orm": "^0.45.0",
  "tailwindcss": "^4.0.0",
  "stripe": "^20.0.0",
  "zod": "^4.0.0",
  "@supabase/supabase-js": "^2.98.0",
  "@supabase/ssr": "^0.9.0",
  "zustand": "^5.0.0",
  "@tanstack/react-query": "^5.0.0",
  "recharts": "^3.0.0"
}
```

---

## Romanian Locale Considerations

- **UI Language:** Romanian -- use Next.js built-in i18n (single locale, not multi-language). All strings in Romanian.
- **Date formatting:** `date-fns/locale/ro` for Romanian date formats
- **Currency:** Stripe handles EUR/RON display in Checkout. Store prices in smallest unit (bani for RON).
- **Character support:** UTF-8 everywhere. Romanian diacritics (ă, â, î, ș, ț) must render correctly in quiz questions, email templates, and PDF exports.

---

## Sources

### Verified via npm registry (HIGH confidence)
- Next.js 16.1.6 (latest), 15.3.9 (latest v15 line) -- `npm view next dist-tags`
- Drizzle ORM 0.45.1 -- `npm view drizzle-orm version`
- Tailwind CSS 4.2.1 -- `npm view tailwindcss version`
- React 19.2.4 -- `npm view react version`
- Stripe 20.4.0 -- `npm view stripe version`
- Supabase JS 2.98.0 -- `npm view @supabase/supabase-js version`
- Serwist 9.5.6 -- `npm view @serwist/next version`
- All other versions verified via `npm view [package] version`

### Web research (MEDIUM confidence)
- [Next.js SaaS best practices 2026](https://supastarter.dev/blog/best-saas-stack) -- supastarter
- [Drizzle vs Prisma 2026 comparison](https://designrevision.com/blog/prisma-vs-drizzle) -- DesignRevision
- [shadcn/ui guide 2026](https://designrevision.com/blog/shadcn-ui-guide) -- DesignRevision
- [Stripe + Next.js 2026 guide](https://dev.to/sameer_saleem/the-ultimate-guide-to-stripe-nextjs-2026-edition-2f33) -- DEV Community
- [Supabase RLS guide 2026](https://designrevision.com/blog/supabase-row-level-security) -- DesignRevision
- [Serwist PWA for Next.js](https://serwist.pages.dev/docs/next/getting-started) -- Official Serwist docs
- [Stripe Romania payments guide](https://stripe.com/resources/more/payments-in-romania) -- Stripe official
- [Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps) -- Next.js official docs
- [Auth.js vs Clerk comparison](https://chhimpashubham.medium.com/nextauth-js-vs-clerk-vs-auth-js-which-is-best-for-your-next-js-app-in-2025-fc715c2ccbfd) -- Medium
- [Resend vs Mailgun 2026](https://www.sequenzy.com/versus/resend-vs-mailgun) -- Sequenzy
- [Vercel vs Coolify cost analysis](https://leonstaff.com/blogs/vercel-vs-coolify-cost-analysis/) -- Leon Consulting
- [React state management 2025](https://dev.to/hijazi313/state-management-in-2025-when-to-use-context-redux-zustand-or-jotai-2d2k) -- DEV Community
