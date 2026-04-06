# grile-ReziNOTE

## What This Is

O platforma SaaS completa de pregatire pentru examenul de rezidentiat in medicina dentara. Studentii pot exersa grile pe capitole sau amestecate cu feedback imediat sau la final, simula examene reale (200 intrebari: 50 CS + 150 CM) cu timer countdown si scoring oficial, vedea instant daca ar fi fost admisi la diverse specialitati pe baza datelor istorice, urmari progresul detaliat prin dashboard-uri vizuale cu radar chart/heatmap/sparklines, se compara anonim cu alti utilizatori prin percentile si ranking, si primi mesaje motivationale auto-generate. Adminul gestioneaza intrebarile, capitolele, datele istorice de admitere si specialitatile printr-un panel securizat cu import/export bulk. Platforma este monetizata prin subscriptii Stripe (lunar/anual) si instalabila ca PWA pe mobil.

## Core Value

Studentii pot simula examene reale de rezidentiat si vedea instant daca ar fi fost admisi si unde, pe baza datelor istorice reale — motivatia #1 de a reveni pe platforma.

## Requirements

### Validated

- ✓ Landing page de prezentare profesionala cu branding complet — v1.0
- ✓ Sistem de autentificare (email + parola, verificare email, reset parola) — v1.0
- ✓ Sistem de plata cu Stripe (subscriptii lunare/anuale) — v1.0
- ✓ Capitole flexibile — adminul le defineste din panel — v1.0
- ✓ Teste pe capitole individuale (fara limita de timp) — v1.0
- ✓ Teste pe toate capitolele amestecate (fara limita de timp) — v1.0
- ✓ Optiune per test: vezi raspuns corect imediat sau la final — v1.0
- ✓ Simulare examen real: 200 intrebari (50 CS + 150 CM), random din tot, cu timp — v1.0
- ✓ La simulare: rezultat doar la final (nu pe parcurs) — v1.0
- ✓ Scor simulare + comparatie cu praguri admitere din ultimii 5 ani — v1.0
- ✓ Sistem de comparatie anonima cu alti utilizatori (percentila, distributie, medie/mediana, ranking anonim) — v1.0
- ✓ Dashboard utilizator cu statistici per capitol si generale — v1.0
- ✓ Trend/progres pe zile si saptamani, istoric raspunsuri corecte/gresite — v1.0
- ✓ Statistici dinamice per capitol cu vizualizari wow — v1.0
- ✓ Mesaje de incurajare si "stiai ca" generate automat din performanta — v1.0
- ✓ Admin panel: CRUD grile (intrebare, optiuni, CS/CM, raspuns corect, sursa/carte) — v1.0
- ✓ Import/export grile in format Excel si CSV — v1.0
- ✓ Admin panel: gestionare date istorice admitere (praguri, locuri, specialitati) — v1.0
- ✓ PWA — instalabila ca app din browser, merge bine pe mobil — v1.0
- ✓ Branding complet: logo, paleta culori, fonturi — profesional dar friendly — v1.0

### Active

(All v1.0 requirements validated. Next milestone requirements TBD.)

### Out of Scope

- Mobile app nativ — web + PWA acopera nevoile; PWA install experience validates this approach
- OAuth/Google login — email + parola suficient pentru v1; can add in v2 based on user demand
- Real-time chat/forum — nu e core; overhead de moderare nu justifica valoarea
- Video lessons/tutoriale — focus pe grile; alt tip de continut
- AI-generated explanations — pastram sursa/cartea ca referinta; risc de informatii incorecte in domeniul medical
- Offline quiz-taking — real-time scoring si progressive save sunt core; offline would require IndexedDB sync complexity
- Gamification badges/levels — mesajele motivationale + ranking acopera motivatia; poate parea patronizing

## Context

Shipped v1.0 with ~20,000 LOC TypeScript/React across 238 files.

**Tech stack:** Next.js 15 (App Router), React 19, Supabase (auth + Postgres), Drizzle ORM, Tailwind CSS v4, shadcn/ui, Recharts 3.7, Stripe SDK v20, Serwist (PWA), Vitest.

**Architecture:** Route groups for (marketing), (auth), (student), (admin). Server Components with Server Actions. Supabase SSR with cookie-based sessions. RLS policies for row-level security.

**Scoring engine:** Pure TypeScript functions — CS (4 pts correct, 0 wrong), CM (per-option partial credit with annulment for <2 or >4 selections). Max score: 950 points. 23 automated tests.

**Admin panel:** Superadmin-only access with server-side guard. Chapter CRUD with drag-and-drop reordering. Question CRUD with live student preview. Bulk import/export (CSV with UTF-8 BOM, Excel via ExcelJS). Specialties and admission data management.

**Payments:** Stripe Embedded Checkout with RON currency. Monthly (49 RON) and annual (33 RON/mo) plans. 7-day free trial. Idempotent webhook processing with event deduplication.

**PWA:** Installable from Chrome and iOS Safari. Custom install prompt. Offline indicator. Mobile bottom tab bar with 44px touch targets. Sheet-based admin drawer on mobile.

**Known technical considerations:**
- Database URL environment variable required for full Next.js build (page rendering)
- Stripe v20 API has breaking changes from v19 — helper functions needed for moved fields
- Exam results integration with admission comparison deferred to branch merge

## Constraints

- **Plati:** Stripe — singura optiune de payment gateway
- **Auth:** Email + parola — fara OAuth in v1
- **Platform:** Web + PWA — fara app nativ
- **Capitole:** Flexibile, definite din admin (nu hardcodate)
- **Stil vizual:** Profesional dar friendly — credibil, nu corporatist, accesibil pentru studenti
- **Limba:** Interfata si continut in romana
- **Browser:** Modern browsers only (Chrome, Firefox, Safari, Edge)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js 15 (not 16) | 16 deprecated middleware needed for auth | ✓ Good — stable, middleware works |
| Stripe v20 pentru plati | Functioneaza in Romania, usor de integrat | ✓ Good — needed helper functions for API changes |
| Capitole flexibile din admin | Adminul poate adauga/sterge capitole fara modificari de cod | ✓ Good — full CRUD with drag-and-drop |
| PWA in loc de app nativ | Acoperire mobile fara cost extra de dezvoltare | ✓ Good — installable, responsive, tab bar |
| Comparatie anonima | Motivatie prin competitie fara presiune sociala | ✓ Good — percentile + ranking + distribution |
| Email + parola (fara OAuth) | Simplitate pentru v1, OAuth se poate adauga in v2 | ✓ Good — full auth flow with verification |
| Mesaje auto-generate | Scalabilitate — nu depinde de admin sa le scrie manual | ✓ Good — template-based with context engine |
| shadcn/ui + oklch colors | Medical teal palette, consistent components | ✓ Good — professional look, dark mode support |
| Drizzle ORM schema-first | Type-safe queries, Supabase compatible | ✓ Good — clean schema, migration support |
| Soft delete pattern (archivedAt) | Chapters and questions recoverable | ✓ Good — archive/restore functionality |
| @dnd-kit for reordering | Maintained, modern, good accessibility | ✓ Good — smooth drag-and-drop |
| Client-side CSV/Excel parsing | Avoid large file uploads to server | ✓ Good — PapaParse + ExcelJS |
| UTF-8 BOM for CSV exports | Romanian diacritics display in Excel | ✓ Good — solved encoding issues |
| Pure scoring functions | Zero dependencies, portable, testable | ✓ Good — 23 tests, all edge cases |
| Idempotent webhook processing | Event deduplication prevents duplicate actions | ✓ Good — reliable Stripe sync |
| Split PWA icon entries | Separate any/maskable for broader compatibility | ✓ Good — works on Chrome + iOS |

---
*Last updated: 2026-03-03 after v1.0 milestone*
