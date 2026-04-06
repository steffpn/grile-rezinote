# UX Customer Flow Audit

**Date:** 2026-04-06
**Scope:** Full customer journey from landing → signup → logged-in experience

---

## 1. LANDING PAGE (Critical Issues)

### 1.1 Hero Section Copy Mismatch — CRITICAL
**Location:** `src/components/landing/hero-section.tsx:102`
**Finding:** Landing page claims "7 zile gratuit" (7 days free), but recent commit `fe7becc` states trial was extended to 45 days.

**Issue:** User sees outdated copy promising 7 days when they actually get 45 days. This creates distrust and confusion when they check their subscription page.

**How to verify:**
- Visit homepage
- See "7 zile gratuit" claim
- Sign up and check `/subscription` — shows 45 days remaining
- Discrepancy damages credibility

**Recommendation:** Update hero-section.tsx line 102 to reflect actual trial duration:
```
Current: "Fara card de credit · Acces instant · 7 zile gratuit"
Should be: "Fara card de credit · Acces instant · 45 zile gratuit"
```

---

### 1.2 CTA Section — Secondary Issue
**Location:** `src/components/landing/cta-section.tsx:65`
**Finding:** CTA section footer also references outdated trial period with no date mentioned.

**How to verify:**
- Scroll to bottom of landing page
- See "Fara card de credit · Acces instant" (missing trial duration mention)
- This is less critical than hero but still inconsistent

---

### 1.3 Pricing Page Trial Period — Outdated
**Location:** `src/app/(marketing)/pricing/page.tsx:54-57`
**Finding:** FAQ states "Dupa cele 7 zile de trial gratuit" (after 7 days of free trial) but actual trial is 45 days.

**Issue:** Users click pricing → read FAQ → confused about actual trial duration again.

---

## 2. SIGNUP & LOGIN FLOW (Good)

### 2.1 Signup Form ✓
**Location:** `src/components/auth/signup-form.tsx`

**Strengths:**
- Clear form fields (name, email, password, year of study)
- Password requirements displayed: "Minim 8 caractere, cel putin o litera si o cifra" (line 102)
- Field validation errors show clearly
- CTA button shows loading state ("Se creeaza contul...")
- Link to login at bottom for existing users

**No issues found** — signup UX is solid.

---

### 2.2 Login Form ✓
**Location:** `src/components/auth/login-form.tsx`

**Strengths:**
- Clean form layout
- "Ai uitat parola?" link (forgot password support)
- Error messages for invalid credentials
- Loading state on submit button

**No issues found** — login UX is solid.

---

### 2.3 Auth Redirect Flow ✓
**Location:** `src/lib/auth/actions.ts:73, line:99`

**Process:**
- After signup: Auto-login then redirect to `/dashboard` (line 73)
- After login: Redirect to `/dashboard` (line 99)
- Dashboard page redirects to `/dashboard/overview` (src/app/(student)/dashboard/page.tsx:4)

**Result:** Users land on overview dashboard with empty state if no data yet. ✓

---

## 3. POST-SIGNUP EXPERIENCE

### 3.1 Dashboard Empty State ✓ (But Confusing Copy)
**Location:** `src/app/(student)/dashboard/overview/page.tsx:70-86`

**Current copy:** "Incepe-ti aventura!" (Start your adventure!) with button "Incepe un test" (Start a test)

**Finding:** Users land here, but don't immediately see:
- What they can do (exams vs practice)
- Trial countdown banner
- Onboarding/walkthrough

**Trial Banner Shows:**
- "Trial gratuit: 45 zile ramase" at top of page
- Links to `/pricing` to subscribe
- **BUT:** No explanation of what "trial" means or what features are restricted

---

### 3.2 Navigation After Signup ✓
**Location:** `src/app/(student)/layout.tsx:14-21`

**Available links:**
- Dashboard → `/dashboard` (shows overview)
- Teste Practice → `/practice`
- Simulare → `/exam`
- Greselile mele → `/practice/mistakes`
- Admitere → `/admission`
- Abonament → `/subscription`

**No dead links found.** All paths exist and route correctly.

---

## 4. FEATURE GATING (Subscription Access)

### 4.1 Admission Explorer — Gated for Subscribers Only
**Location:** `src/app/(student)/admission/page.tsx:17-24`

**Finding:** Page checks subscription access and redirects to `/subscription` if not subscribed.

**UX Issue:**
- User clicks "Admitere" link in navigation
- Gets redirected to `/subscription` without explanation
- See pricing page, might confuse (are they locked out? why?)
- No breadcrumb or "back" context

**Recommendation:** Show a "feature preview" card on dashboard saying "Admitere" is subscriber-only with direct link to pricing.

---

### 4.2 Paywall Overlay
**Location:** `src/components/paywall/PaywallOverlay.tsx`

**Behavior:** When trial expires, full-page overlay appears saying "Aboneaza-te pentru acces complet"

**UX Issue:**
- Says "Perioada ta de trial a expirat" (Your trial expired)
- Button to "/pricing"
- **Missing:** Explanation of what they lose (all practice? exams? dashboards?)
- Footer button says "Reincarca pagina" (Reload page) — not clear this won't help if trial is expired

**Recommendation:**
- Clarify what happens post-trial ("No more practice tests, exams, or admission data")
- Change "Reincarca pagina" to "Reverse plan selection" or similar if applicable

---

## 5. NAVIGATION & REDIRECTS (Good)

### 5.1 Logo Links
**Location:** `src/components/shared/nav-header.tsx:34`

**Behavior:**
- If logged in: Logo links to `/dashboard`
- If not logged in: Logo links to `/`

✓ **Correct navigation pattern**

---

### 5.2 Mobile Navigation
**Location:** `src/components/shared/nav-header.tsx:91-120+`

**Finding:** Mobile menu collapses properly, shows all nav links, logout button visible.

✓ **No issues found**

---

## 6. FOOTER (Dead Links)

### 6.1 Dead Links in Footer — CRITICAL
**Location:** `src/components/landing/footer.tsx:19-30`

**Finding:** Two links point to "#" (nowhere):
```tsx
<Link href="#">Termeni si conditii</Link>
<Link href="#">Confidentialitate</Link>
```

**Issue:**
- These appear on marketing page (landing page, pricing)
- Both are legal/compliance pages
- Clicking them does nothing — frustrating for users looking for policies
- Could be compliance risk if users can't find privacy policy

**Recommendation:** Either:
1. Create `/terms` and `/privacy` pages and link to them
2. If pages don't exist, hide these links temporarily
3. Add external links to appropriate documentation

---

## 7. CHECKOUT & PAYMENTS

### 7.1 Stripe Checkout Flow
**Location:** `src/app/checkout/`

**Finding:** Checkout success/cancel pages exist (`src/app/checkout/success/page.tsx`, `src/app/checkout/cancel/page.tsx`)

- No UX review needed (handled by Stripe), but confirmed pages exist ✓

---

## 8. COPY & MESSAGING (Language/Tone)

### 8.1 "Admitere" Feature Unclear
**Location:** `src/app/(student)/admission/page.tsx:34-40`

**Copy:** "Exploreaza datele istorice de admitere per specialitate si an."

**Issue:** Users might not understand what "Date Istorice de Admitere" means:
- What are these dates?
- Why do I need them?
- What will I do with this data?

**Recommendation:** Expand description in navigation or add a tooltip explaining this is cutoff scores for previous years.

---

### 8.2 "Greselile mele" (My Mistakes) — Unclear For New Users
**Location:** `src/app/(student)/layout.tsx:18`

**Finding:** "Greselile mele" link exists but new users with no practice attempts will see empty page.

**Issue:** New users don't know what this feature is for. No onboarding context.

---

## 9. MISSING ERROR STATES

### 9.1 No 404 Page
**Finding:** No `not-found.tsx` files found in `/src/app/`

**Issue:** If user navigates to `/exam/invalid-id` or similar, they get Next.js default error, not branded experience.

**Recommendation:** Create a 404 page with navigation options back to dashboard.

---

### 9.2 No Error Boundary
**Finding:** No `error.tsx` files found in `/src/app/`

**Issue:** If a database query fails or component throws, users see plain error page.

**Recommendation:** Add error boundaries to major routes (dashboard, exam, practice).

---

## 10. TRIAL/SUBSCRIPTION CLARITY

### 10.1 What's Included in Trial?
**Location:** Multiple locations

**Issue:** Trial period doesn't explicitly state what's included:
- Can I practice? (Yes)
- Can I take simulated exams? (Assumed yes, but not stated)
- Can I see admission data? (No, it's gated, but not explained)
- What happens when trial ends?

**Recommendation:** Add a trial benefits list on dashboard or in onboarding modal.

---

## 11. MISSING ONBOARDING

### 11.1 First-Time User Experience
**Finding:** Users sign up → land on empty dashboard with no guidance.

**Missing:**
- Welcome message
- Feature tour/walkthrough
- "Next steps" recommendations (e.g., "Take your first practice test")
- Progress indicator showing setup completion

**Recommendation:** Implement onboarding modal on first signup, or expand empty state with interactive guidance.

---

## SUMMARY OF FINDINGS

| Severity | Issue | Location | Fix |
|----------|-------|----------|-----|
| 🔴 CRITICAL | Trial copy says "7 zile" but actual is "45 zile" | hero-section.tsx:102, pricing page:54-57 | Update all copy to "45 zile gratuit" |
| 🔴 CRITICAL | Footer links to "Termeni si conditii" and "Confidentialitate" are dead | footer.tsx:19-30 | Create pages or remove links |
| 🟡 HIGH | Admission feature auto-redirects without explanation | admission/page.tsx:17-24 | Add hint on dashboard or better UX |
| 🟡 HIGH | Paywall copy unclear about what's lost after trial | PaywallOverlay.tsx | Clarify restrictions |
| 🟡 MEDIUM | No 404 or error boundaries | Various | Add error pages |
| 🟡 MEDIUM | Trial benefits not listed | Dashboard | Add list of what's in trial |
| 🟡 MEDIUM | No first-time onboarding | Dashboard | Add welcome flow |

---

## AUTHENTICATED GATING VERIFICATION

**Cross-check with auth-access agent:** ⚠️ CRITICAL SECURITY ISSUE FOUND

The auth-access agent confirmed a **critical server-side bypass**:

**Problem:** Subscription validation is missing in server actions:
- `createExamAttempt()` at `src/lib/actions/exam.ts:32-86` — no `checkSubscriptionAccess()`
- `createPracticeAttempt()` at `src/lib/actions/practice.ts:90+` — no `checkSubscriptionAccess()`

**How users can bypass the paywall:**
1. Sign up → get 45-day trial
2. Trial expires
3. Open browser DevTools → call `createExamAttempt()` server action directly
4. Server accepts it (only checks auth, not subscription)
5. User creates unlimited exam/practice attempts without paying

**Current state:**
- ⚠️ Admission page gating works correctly (has `checkSubscriptionAccess()`)
- ❌ Exam/practice actions NOT gated (missing subscription validation)
- ⚠️ PaywallOverlay is client-side only (UX feedback, not security)
- ✓ Trial duration is 45 days (commit fe7becc correct)

**This is P0 — detailed report in `.audit/auth-findings.md`**

See auth-access agent message for full exploit scenario and fix instructions.

---

**Audit completed:** 2026-04-06
**Updated:** 2026-04-06 (added critical auth-access cross-check)
