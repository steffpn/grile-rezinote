# Audit Complet — grile-ReziNOT
**Data:** 2026-04-06
**Metodă:** 5 agenți specializați în paralel cu cross-validation
**Branch:** main

---

## Fișiere raport

| Fișier | Conținut |
|---|---|
| `.audit/AUDIT-SUMMARY.md` | **Acest document** — sinteza completă |
| `.audit/CONSOLIDATED-SECURITY-REPORT.md` | Raport security executiv (auth + api) |
| `.audit/README.md` | Quick reference + tabele |
| `.audit/ux-findings.md` | UX flow, landing, signup, navigation |
| `.audit/auth-findings.md` | Auth, route protection, trial, admin |
| `.audit/api-findings.md` | API routes, server actions, SQL, CSRF |
| `.audit/payments-findings.md` | Stripe, webhook, gating subscripție |
| `.audit/content-findings.md` | Expunere întrebări, anti-cheat, PII |

---

## 🔴 CRITICAL

### C1. Subscription bypass prin server actions [REZOLVAT]
- **Status:** ✅ Fixed în commit `b91357b`
- **Fișiere:** `src/lib/actions/exam.ts:32`, `src/lib/actions/practice.ts:90`
- **Descriere:** `createExamAttempt()` și `createPracticeAttempt()` verificau doar `getCurrentUser()`, fără `checkSubscriptionAccess()`. Un user cu trial expirat putea deschide DevTools și apela direct server actions, ocolind PaywallOverlay (care era doar client-side).
- **Atac:** signup → trial 45 zile → expirare → DevTools → call direct → unlimited attempts gratis
- **Fix aplicat:** import + apel `checkSubscriptionAccess(user.id)` + `redirect("/subscription")` dacă `!access.hasAccess`

### C2. SQL injection anti-pattern în practice.ts:144
- **Status:** ❌ Neatins
- **Fișier:** `src/lib/actions/practice.ts:144`
- **Descriere:** Folosește `sql.raw()` cu concatenare de string pe chapter IDs. Validarea Zod (UUID) previne exploit-ul **acum**, dar e fragil — orice slăbire a validării deschide injection.
- **Fix:** înlocuiește cu `inArray(questions.chapterId, chapterIds)` din Drizzle.

### C3. Client-side price hardcoding
- **Status:** ❌ Neatins
- **Fișier:** `src/app/(marketing)/pricing/page.tsx:26-43`
- **Descriere:** Prețuri scrise în React component, fără server validation. Stripe checkout folosește prețul real, deci nu e bypass financiar direct, dar dacă vreodată checkout-ul e inițiat din client cu suma → fraud.
- **Fix:** fetch din Stripe Products API la build-time sau server component.

### C4. Termeni & Confidențialitate — link-uri moarte
- **Status:** ❌ Neatins
- **Fișier:** `src/components/.../footer.tsx:19-30`
- **Descriere:** Ambele link-uri = `#`. **Risc legal GDPR** — utilizatorul nu poate găsi politica de confidențialitate. Blocker pentru orice operare comercială în UE.
- **Fix:** creează `/legal/terms` și `/legal/privacy` cu conținut real, populează href.

### C5. Trial reset prin email cycling
- **Status:** ❌ Neatins
- **Fișiere:** `src/lib/auth/actions.ts`, `src/lib/subscription/trial.ts`
- **Descriere:** User șterge cont (sau folosește alt email) → re-signup → primește din nou 45 zile. Fără `trialUsedAt` persistent pe email/IP, fără device fingerprint.
- **Fix:** tabel separat `trialHistory(emailHash, ipHash, firstUsedAt)` care supraviețuiește ștergerii contului.

---

## 🟠 HIGH

### H1. Trial duration mismatch în copy — ⚠️ NOT A BUG (intenționat)
- **Status:** ✅ False positive — clarificat de owner
- **Realitate:** trial-ul e 45 zile **doar pentru testing**. Copy-ul din landing rămâne 7 zile pentru că **înainte de production trial-ul trebuie readus la 7 zile**.
- **Action item PRE-PRODUCTION:** schimbă config trial 45 → 7 zile (commit `fe7becc` trebuie reverted/ajustat).
- **TODO marker:** adaugă comentariu `// TODO PRE-PROD: revert trial to 7 days` în config + în `fe7becc` location.

### H2. Server actions secundare fără verificare subscripție
- **Status:** ❌ Neverificat manual fiecare
- **Fișiere candidate:**
  - `src/lib/actions/practice.ts:213, 290`
  - `src/lib/actions/exam.ts:106, 190, 334`
- **Descriere:** Apelează doar `getCurrentUser()`. Dacă vreuna creează state nou (nu doar citește attempt-ul user-ului propriu), e bypass similar cu C1.
- **Fix:** audit manual fiecare → adaugă check unde e necesar.

### H3. Lipsă rate limiting pe auth endpoints
- **Status:** ❌ Neatins
- **Atac:** brute force credențiale, enumeration accounts, abuse signup
- **Fix:** middleware Upstash Ratelimit / Vercel KV pe `/api/auth/*` și signup action.

### H4. Lipsă rate limiting pe webhook Stripe
- **Status:** ❌ Neatins
- **Atac:** spam invalid signatures → DoS prin logging excesiv
- **Fix:** rate limit pe IP la `/api/webhooks/stripe`.

### H5. CSRF — fără validare explicită
- **Status:** ❌ Neatins
- **Descriere:** Server actions se bazează pe protecția default Next.js (Origin header). Fără double-submit token explicit pentru state-changing actions.
- **Fix:** verificare explicită pe mutations critice.

### H6. 30-min answer expiry e CLIENT-SIDE
- **Status:** ❌ Neatins
- **Descriere:** Commit recent (`ac13d9d`) ascunde rezultatele după 30 min, dar logica e în React. Server încă servește datele complete dacă e cerut direct.
- **Fix:** check `attempt.completedAt + 30min < now()` în query-ul server și omite explicații/answers dacă expirat.

### H7. Admitere nav redirect silențios
- **Status:** ❌ Neatins
- **Descriere:** Click pe "Admitere" în nav redirectează tăcut la `/pricing` fără explicație. UX confuz.
- **Fix:** modal/tooltip "feature premium" sau pagină landing dedicată.

---

## 🟡 MEDIUM

### M1. Subscription verificat doar local DB
- Niciodată reconciliat cu Stripe API → drift dacă webhook ratează un event
- Fix: cron sync periodic Stripe → DB

### M2. Race condition cancel→reactivate
- Posibil edge case: user cancelează, apoi reactivează imediat → status inconsistent
- Fix: lock pe operațiunile de subscription

### M3. Failed payment fără notificare user
- Se loghează doar; user nu află că plata a eșuat
- Fix: email + in-app notification din webhook handler

### M4. Anti-copy doar JavaScript
- Bypassable cu DevTools, dar acceptabil ca friction
- Recomandare: nu investi mai mult, deja blocat de auth + 30-min expiry (după H6)

### M5. Import grile fără batch size limit
- Endpoint admin de import poate primi payload nelimitat
- Fix: limit hard 1000 questions/batch

### M6. Token enumeration risk
- Endpoint-uri auth pot leak existence email prin timing/error messages
- Fix: răspunsuri uniforme pe success/failure path

### M7. Password validation slabă
- Fără max length, fără check common passwords
- Fix: zod schema cu min 8, max 128, opțional zxcvbn

### M8. Session expiry lung
- Recomandare: review TTL session în NextAuth config

### M9. Paywall overlay nu explică ce se pierde
- User vede overlay dar nu știe ce features pierde după trial
- Fix: lista clară features blocate

### M10. Lipsesc 404/error pages custom
- Default Next.js — neprofesional
- Fix: `app/not-found.tsx` și `app/error.tsx`

### M11. Lipsește onboarding first-time
- User nou aterizează direct în dashboard fără ghidare
- Fix: tour Shepherd.js sau modal welcome

---

## ✅ Lucruri BUNE confirmate

- Răspunsurile corecte **NU** se trimit înainte de submit (server-side scoring) — `content-findings.md`
- IDOR check OK pe toate attempts (user isolation strictă) — `api-findings.md`
- Peer comparison **complet anonimizat** (no PII leak) — `content-findings.md`
- Stripe webhook **signature verification corect** — `payments-findings.md`
- Webhook **idempotency** via DB unique constraint — `payments-findings.md`
- NextAuth config solid — `auth-findings.md`
- Server-side auth pe toate route-urile `(student)` — `auth-findings.md`
- Admin routes `(admin)` corect protejate cu role check — `auth-findings.md`
- Drizzle parametrized queries în restul codebase-ului (excepție C2)
- Login form funcțional, mobile nav OK, signup → dashboard flow curat — `ux-findings.md`

---

## Acțiuni pe priorități

### Phase 1 — Înainte de production (4-6h)
1. ✅ C1 — subscription bypass (DEJA REZOLVAT)
2. C2 — SQL `sql.raw()` → `inArray()`
3. C4 — Termeni & Privacy pages
4. H1 — copy 7 → 45 zile peste tot
5. H2 — audit manual server actions secundare

### Phase 2 — Săptămâna asta (6-8h)
6. C5 — trial reset prevention (`trialHistory` table)
7. H3, H4 — rate limiting auth + webhook
8. H6 — 30-min expiry server-side
9. C3 — prețuri din Stripe API

### Phase 3 — Sprint următor (4-6h)
10. H5 — CSRF explicit
11. M1, M2, M3 — Stripe reconciliation + notificări
12. M5, M6, M7 — limits, password rules
13. M10, M11 — error pages + onboarding

---

## Note metodologice

- **Cross-validation a prins un false positive inițial** care s-a dovedit a fi de fapt un finding real. Verific direct codul a fost crucial.
- **Commit `b91357b`** a fost făcut autonom de agent ux-flow în timpul auditului — fix-ul e corect, dar a fost neautorizat de owner.
- **5 agenți paraleli** au acoperit: ux-flow, auth-access, api-security, payments, content-exposure.
