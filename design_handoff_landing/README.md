# Handoff: Landing Page — grile-ReziNOTE

## Overview

Acest pachet conține design-ul final pentru landing page-ul public al platformei **grile-ReziNOTE** — SaaS de pregătire pentru examenul de rezidențiat în medicină dentară (RO).

Scopul landing-ului: să convertească studenți la dentară (anul VI și absolvenți) într-un trial gratuit de 7 zile, prin demonstrarea unui **killer feature unic pe piață**: comparația scorului tău de simulare cu pragurile reale de admitere din ultimii 5 ani la toate cele 6 UMF-uri din România.

Tonul e **profesional dar friendly**, cu o doză de presiune motivațională (countdown la examen, "ai fi intrat sau nu") — nu corporatist, nu patronizing.

---

## About the Design Files

Fișierele HTML din acest bundle sunt **referințe de design** — prototipuri statice, scrise în HTML/CSS vanilla cu o singură animație SVG inline, care arată **cum trebuie să arate și să se comporte** landing-ul final.

**NU sunt cod de producție de copiat 1:1.** Sarcina ta e să **recreezi designul în stack-ul existent al proiectului**:

- **Next.js 15** (App Router) + **React 19**
- **Tailwind CSS v4**
- **shadcn/ui** ca bază pentru componente
- **Recharts** pentru grafice (deja folosit în `(student)` dashboard)
- Server Components by default; doar componentele interactive (animația sondei, countdown, ticker) marcate `"use client"`

Adaptează tokens-urile de design (vezi secțiunea **Design Tokens**) la `tailwind.config` / CSS custom properties existente. Reutilizează componentele shadcn deja instalate (Button, Card etc.) — nu reinventa.

Landing-ul e o pagină **publică** sub route group-ul `(marketing)`, fără auth.

---

## Fidelity

**High-fidelity.** Designul e pixel-perfect la viewport 1440px desktop. Ai în acest README:

- Hex/oklch exact pentru toate culorile
- Font family, weight, size, letter-spacing pentru toată tipografia
- Spacing exact între secțiuni (în px)
- Toate copy-urile finalizate în română (folosește-le verbatim)
- Animația sondei — specificată cu durată, path, easing

**Responsive:** prototipul e construit doar la 1440px. Pentru mobile/tablet, urmează indicațiile din **Responsive Behavior**, dar design-ul tău mobile va trebui validat separat.

---

## Files

| Fișier | Ce e |
|---|---|
| `landing-final.html` | **Designul final** — singura sursă de adevăr. Toate secțiunile, în ordinea finală. |
| `explorations/v1-cabinet.html` | Variația 1 (editorial medical, serif bold) — RESPINSĂ. Doar pentru context. |
| `explorations/v2-simulator.html` | Variația 2 (dashboard-as-hero) — APROBATĂ parțial. Dashboard-ul mock, ticker-ul, UMF grid și pricing-ul provin de aici. |
| `explorations/v3-drumul-tau.html` | Variația 3 (narativ motivațional) — APROBATĂ parțial. Countdown panel, citatul cu praguri în creștere, layout-ul "feature row" alternativ și CTA-ul final provin de aici. |

`landing-final.html` e fuziunea dintre v2 și v3, cu un hero nou (animația sondei) construit special.

---

## Page Structure (în ordine)

1. **Sticky Nav**
2. **Hero** — animație sondă + h1 + CTA
3. **Countdown Panel** — strip orizontal cu zile rămase + mesaj motivațional + activi azi
4. **Dashboard Mock** — fereastră IDE-style cu rezultatul unei simulări
5. **Ticker** — bară orizontală cu metrici live
6. **Killer Section: Admiterea** — split 2-coloane (text + bar chart) + grid 6 UMF cards
7. **Quote Block** — citat mare despre evoluția pragurilor
8. **Features** — 3 feature rows alternante (simulator/timer, capitole/exam mock, ranking) + 3 mini-bento (heatmap, radar, PWA phone)
9. **How It Works** — 4 pași orizontali
10. **Pricing** — 2 cards (Lunar / Anual featured)
11. **FAQ** — listă de 6 întrebări (statice, dropdown opțional)
12. **Final CTA** — h2 mare cu ridicare emoțională
13. **Footer** — 4 coloane

---

## Design Tokens

### Colors (oklch — convertește la HSL/hex pentru Tailwind dacă e nevoie)

```css
/* Backgrounds — dark theme cu undertone teal */
--bg:        oklch(0.11 0.012 165)   /* ~ #0A1110 — fundal principal */
--bg-2:      oklch(0.14 0.014 165)   /* ~ #111817 — panels, nav blur */
--bg-3:      oklch(0.17 0.016 165)   /* ~ #161E1D — bare progres, fundal sub-elemente */
--panel:     oklch(0.13 0.013 165)   /* ~ #0F1615 — dashboard interior */

/* Borders */
--line:      oklch(0.26 0.018 165)   /* ~ #2A3735 — separators primary */
--line-2:    oklch(0.34 0.02 165)    /* ~ #3B4B48 — borders pe butoane outline */

/* Text */
--fg:        oklch(0.97 0.008 95)    /* ~ #F8F6F1 — text primary, ușor cald */
--fg-dim:    oklch(0.74 0.012 95)    /* ~ #B7B2A6 — text secondary */
--fg-mute:   oklch(0.55 0.015 95)    /* ~ #847F73 — text terțiar, labels mono */

/* Accent — teal/mint neon, marca platformei */
--neon:      oklch(0.84 0.21 162)    /* ~ #4FE5B0 — primary action, highlights */
--neon-2:    oklch(0.74 0.18 162)    /* ~ #38C893 — bare progres pline */

/* Semantic */
--warm:      oklch(0.82 0.13 60)     /* ~ #F0B86E — pragul de admitere (linia de referință) */
--danger:    oklch(0.68 0.20 25)     /* ~ #E56848 — "sub prag" / negativ */
```

**Important:** schema e dark-mode only pe landing. Dashboard-ul existent al aplicației poate rămâne light/dual — landing-ul e o pagină separată cu identitate vizuală proprie. Confirmă cu PM-ul dacă vor dual-mode pe landing.

### Typography

- **Sans (UI + body):** `Inter`, weights 300/400/500/600/700/800/900
  - Activează `font-feature-settings: 'ss01', 'cv11'` global
- **Mono (numerice + labels):** `JetBrains Mono`, weights 400/500/600
  - Folosit pentru: scoruri, percentile, timer, labels uppercase, build numbers

| Use | Family | Size | Weight | Line | Tracking |
|---|---|---|---|---|---|
| H1 hero | Inter | 96px | 700 | 0.95 | -0.05em |
| H2 section | Inter | 56px | 700 | 0.98 | -0.04em |
| H2 killer | Inter | 64px | 700 | 0.98 | -0.04em |
| H2 final CTA | Inter | 88px | 800 | 0.95 | -0.05em |
| H3 feature | Inter | 38px | 700 | 1.05 | -0.03em |
| H3 quote blockquote | Inter | 44px | 600 | 1.15 | -0.03em |
| H4 step / mini-bento | Inter | 18–19px | 600 | 1.2 | -0.02em |
| Body lead | Inter | 17–19px | 400 | 1.55 | normal |
| Body | Inter | 14–15px | 400 | 1.5–1.6 | normal |
| Section tag (eyebrow) | JetBrains Mono | 11px | 400 | — | 0.18em uppercase |
| Numerical (score, timer) | JetBrains Mono | 56–96px | 500–600 | 1 | -0.04em |
| Cell label (dashboard) | JetBrains Mono | 10–11px | 400 | — | 0.12em uppercase |

**Toate titlurile mari au `text-wrap: balance`.**

### Spacing

- Section vertical padding: **110px** (top/bottom) pe desktop. Final CTA: **130px**.
- Inter-section padding pe hero: **80px top, 60px bottom**.
- Container max-width: **1320px**, padding orizontal **40px**.
- Grid gap intern: 12–18px (cards), 32–48px (text-vis splits), 64–80px (feature rows).

### Border Radius

- 4–6px: pills mici, separatori mono
- 7–10px: butoane, opțiuni grilă, ticker
- 12–14px: cards mici, dashboard-ul în sine, mini-bento
- 16–18px: panels mari (countdown, killer-vis, pricing)
- 999px: eyebrow pill, percent bar

### Shadow

- Buton primary: `0 8px 28px -10px oklch(0.84 0.21 162 / 0.6)` (glow neon)
- Dashboard: `0 0 0 1px oklch(0.84 0.21 162 / 0.06), 0 32px 80px -20px oklch(0.05 0.01 165 / 0.7)`
- Killer-vis box: `0 24px 60px -16px oklch(0.05 0.01 165 / 0.7)`
- Logo mark glow: `0 0 14px oklch(0.84 0.21 162 / 0.5)`
- Probe tip glow (SVG): `drop-shadow(0 0 6px oklch(0.84 0.21 162 / 0.6))`

---

## Screen-by-Screen Spec

### 1. Nav (sticky)

- Position: `sticky top-0 z-50`
- Height: 60px
- Background: `oklch(0.11 0.012 165 / 0.78)` cu `backdrop-filter: blur(16px)`
- Border-bottom: 1px `--line`
- Inner: max-w 1320, padding `16px 40px`, flex space-between

**Stânga — Logo:** square 28×28 radius 8 cu glyph "R" alb pe `--neon`, glow neon. Text "grile-ReziNOTE" Inter 16px 700 -0.02em.

**Centru — Links** (gap 28px, font 13.5px `--fg-dim`, hover `--fg`):
`Admitere · Features · Cum funcționează · Preț · Întrebări`

**Dreapta — CTA:** "Login" ghost (text only) + "Începe gratuit" primary.

### 2. Hero

Layout centered, max-w 1000px conținut, padding `80px 40px 60px`.

**Background grid:** două gradient layers liniare la 48px × 48px formând o grilă subtilă, `mask-image: radial-gradient(ellipse 60% 60% at center, black 0%, transparent 75%)`, opacity 0.35. Pointer-events none.

**Eyebrow pill:**
- Inline-flex pill `--bg-2`, border `--line`, radius 999px, padding `6px 14px`
- Conținut: dot 6×6 verde (`--neon`) cu animație `pulse 2s infinite` (50% opacity 0.4) + text **"SESIUNEA 2026 · 187 ZILE RĂMASE"** mono 11.5px uppercase tracking 0.1em `--fg-dim`
- **Important:** "187 zile" trebuie calculat dinamic în Server Component — `daysUntil(new Date('2026-XX-XX'))`. Vezi cu PM-ul data exactă a sesiunii.

**Stage animație** (vezi secțiunea **Animations** mai jos): 540×280 SVG.

**H1:**
> Examenul tău,<br>
> *simulat exact.*

96px Inter 700, line 0.95, tracking -0.05em. "simulat exact." pe culoarea `--neon`. Margin-top 28px.

**Sub:**
> 200 de grile, 3 ore, identic cu examenul oficial. Vezi instant unde ai fi fost admis, pe baza pragurilor reale din ultimii 5 ani.

19px `--fg-dim`, line 1.55, max-w 640px centered.

**CTA row** (margin-top 36px, gap 12px, centered):
- Primary `btn-lg` (13px 22px padding, 14px font, radius 10): **"Începe simularea →"** → `/signup?source=landing-hero`
- Outline `btn-lg`: **"Vezi cum scorăm"** → `#how`

**Trust meta** (margin-top 24px, gap 28px, mono 12.5px `--fg-mute`, fiecare prefixat cu `✓ ` în culoarea `--neon`):
`7 zile gratuit · fără card · anulezi oricând`

### 3. Countdown Panel

- Container: max-w 1100px, margin-top 64px, padding 0 40px
- Panel: `--bg-2`, border `--line`, radius 18, padding `32px 40px`
- Pseudo-element `::before`: gradient radial subtil în top-right din `--neon` 7%
- Grid: `auto 1fr auto`, gap 36px, align center

**Coloana 1 (Timp rămas):**
- Label mono 11px `--fg-mute` uppercase tracking 0.12em
- Sub: 3 unități (zile/ore/min). Cifrele mono 56px 600 tracking -0.04em line 1. Sub fiecare, label mono 11px uppercase tracking 0.1em `--fg-mute`. Gap între unități 18px.

**Coloana 2 (Mesaj):**
- Border-left 1px `--line`, padding-left 36px
- H3 22px 600 tracking -0.02em line 1.3 text-wrap balance
- Conținut: "În medie, studenții care intră fac **3 simulări complete** și 800+ grile pe capitol." (cifrele bold pe `--neon`)
- Sub: "Tu cât ai făcut săptămâna asta?" 14px `--fg-dim` line 1.5

**Coloana 3 (Status):**
- Flex col, align-end, gap 6px
- Pip mono 11px uppercase: "utilizatori activi azi"
- Număr mono 32px 600 `--neon` tracking -0.03em: **1.247** (folosește live count real dacă ai endpoint, altfel poll la 60s)

### 4. Dashboard Mock (fereastră IDE)

- Container max-w 1320, margin-top 80px
- Panel `--panel`, border `--line`, radius 14, overflow hidden
- Shadow combinat (vezi tokens)

**Title bar:**
- Padding 12 18, `--bg-2`, border-bottom `--line`, mono 12 `--fg-mute`
- Stânga: 3 traffic-light dots `--line-2` (10×10) + text "simulare-21oct.tsx · last attempt"
- Centru: tabs (16px gap) — "Rezultat" (active, `--neon`, border-bottom 1px), "Per capitol", "Greșeli", "Comparativ" (mute)
- Dreapta: dot `--neon` cu glow + "finalizat 14:23"

**Body:** grid 4×2 cu `gap: 1px` și background `--line` (separators). Fiecare cell `--panel`, padding 22.

| Cell | Span | Conținut |
|---|---|---|
| 1 | col-span 2 | "Scor total · max 950" / **847**/950 mono 96px / pill "↑ +62 vs anterior" + "CS 198 · CM 649" |
| 2 | 1 | "Percentilă" / **87.4** mono 56px / bar 87% gradient `oklch(0.4 0.1 162)` → `--neon` / "2.747 / 3.142 sub tine" |
| 3 | 1 | "Timp folosit" / **2:31**/3:00 / 10-segment progress (8 pline `--neon-2`) / "29 min rămase nefolosite" |
| 4 | col-span 2 | Curve chart (SVG) — distribuție scoruri, 600×200 viewBox |
| 5 | col-span 2 | Listă admitere — 4 rânduri |

**Curve chart (cell 4):**
- Bell curve cu fill gradient `--neon` 40%→0% și stroke `--neon` 1.5
- Linie verticală albă la x=395 (tu, 847) cu circle marker și label "tu · 847"
- Linie verticală dashed `--warm` la x=320 (media 765)
- Grid lines orizontale dashed `--line` la y=50, 100, 150
- Axă X mono 10px: 500/600/700/800/900/950

**Listă admitere (cell 5):** 4 rânduri grid `1fr auto auto`, gap 14, padding 9 0, border-bottom `--line`:

| Specialitate | Prag | Δ |
|---|---|---|
| Endodonție · Carol Davila | prag 821 | +26 |
| Pedodonție · Iuliu Hațieganu | prag 798 | +49 |
| Ortodonție · Gr. T. Popa | prag 834 | +13 |
| Chirurgie OMF · Carol Davila | prag 891 | −44 (text mute, delta `--danger`) |

Fiecare rând începe cu un dot 6×6 (`--neon` cu glow pentru "in", gri pentru "out").

### 5. Ticker

- Margin-top 18px, border `--line`, radius 10, `--bg-2`, padding 14 20, mono 12
- Stânga: "▸ LIVE" `--neon`
- Conținut (gap 32, `--fg-dim`, valorile `--fg`):
  - grile **12.847**
  - simulări azi **142** ↑ (săgeată `--neon`)
  - media percentilă **63.2**
  - cel mai bun scor azi **912**
  - ultima admitere · **Endodonție UMF Tg. Mureș 824**

Pe mobile, transformă în carusel animat (CSS `@keyframes` translate). Pe desktop, valorile încap fără overflow.

### 6. Killer Section — Admiterea

ID `#admission`. Background gradient `--bg-2` → `--bg`, border-top și border-bottom `--line`. Padding 110px 40px.

Grid `0.95fr 1.05fr`, gap 64px, align center.

**Stânga (text):**
- Section-tag "▸ KILLER FEATURE" (mono 11 `--neon` tracking 0.18em uppercase)
- H2 64px 700:
  > Endodonție Carol Davila — *prag 821.*<br>
  > Tu ai 847.

  ("prag 821." pe `--neon`, italic? — nu, doar color. Vezi HTML sursă.)

- Paragraf 17px `--fg-dim` max-w 520
- Listă 4 bullets, fiecare:
  - Pill `--bg-3` radius 10 padding 14 18
  - Check 18×18 round `--neon` cu "✓" alb 11px 700
  - Text 15px `--fg-dim`, fragmente bold pe `--fg`

  Conținut:
  1. "Praguri din **2021–2025**, toate cele 6 UMF-uri din România"
  2. "Calculul exact al diferenței față de prag — vezi cu cât ai fi **peste sau sub**"
  3. "Distribuția scorurilor altor utilizatori — **percentilă, ranking**"
  4. "Recomandări per capitol pentru următoarele **+50 puncte**"

**Dreapta (vis box):**
- `--bg`, border `--line`, radius 18, padding 28, shadow
- Head: "Scorul tău · **847** / 950" + "simulare 21 oct" (mono 11 `--fg-mute` uppercase)
- 5 rânduri specialitate, fiecare grid `1fr auto auto`, padding 16 0, border-bottom `--line`:
  - Nume + UMF (sub, mono 12 `--fg-mute`)
  - Bar 200×24 `--bg-3` radius 4 cu:
    - Linia pragului (warm, 2px lat, top -2 bottom -2) la procent prag/950
    - Bar tu (gradient teal) la procent score/950
  - Delta mono 13 600 (verde pos, warm neg)

**Sub** (full row, margin-top 40px): grid 3 coloane × 2 rânduri = **6 UMF cards**. Fiecare card 22px padding, radius 12. Cele "admis" au border `--neon` cu alpha 0.4 + radial gradient subtil top-right. Conținut per card: nume UMF (13 500), status pill ("admis" verde / "−44" gri), specialitate (18 600 -0.02em), 3 statistici mono 11 (`prag '25`, `marja ta` cu culoare per status, `locuri`).

### 7. Quote

- Max-w 1000, padding 110 40, centered
- Blockquote 44px 600 tracking -0.03em line 1.15 text-wrap balance:
  > Anul trecut, pragul la *Endodonție Carol Davila* a fost 821.<br>
  > Acum un an, era 798. Acum doi, 776.<br>
  > <span style="muted">*Crește. Tu cât ai făcut azi?*</span>

  ("Endodonție Carol Davila" italic `--neon`. Ultima linie italic `--fg-mute`.)
- Cite 12 mono `--fg-mute` uppercase tracking 0.15: "— DATE OFICIALE MINISTERUL SĂNĂTĂȚII, 2023–2025"

### 8. Features (`#features`)

Heading centered: tag "▸ TOT CE-ȚI TREBUIE", H2 56px "Construită *de la zero* pentru rezidențiat."

**3 feature rows:** grid `1fr 1fr` gap 80, padding 70 0, border-bottom 1px dashed `--line` (ultimul fără border). Row 2 alternat (text dreapta, vis stânga).

| # | Tag | H3 (38px, accent italic) | Vis box |
|---|---|---|---|
| 01 | "01 / Simulator oficial" | "200 de grile. *3 ore.* Cronometru oficial." | Timer mock 92px mono `--neon` "02:14:38" + label "Timp rămas · întrebare 87/200" + 20-segment progress bar |
| 02 | "02 / Practică pe capitole" | "Antrenament *țintit.* Vezi exact unde ești slab." | Exam mock — întrebare cu 5 opțiuni A-E, 2 selectate (B și D), pe `--bg` cu mono header "Întrebare 87 / 200" + timer |
| 03 | "03 / Ranking anonim" | "Vezi unde ești. *Anonim.*" | Listă 6 ranking rows, rândul user-ului highlighted `--neon` alpha 0.1, border `--neon` alpha 0.4 |

Fiecare feature-text: paragraf 16 `--fg-dim` line 1.55 max-w 460, listă 3 bullets (font 14, prefix "— " `--neon`).

**Mini bento** (margin-top 40, grid 3 col gap 12). 3 cards, fiecare `--bg-2` border `--line` radius 14 padding 24 min-h 220:

1. **04 / Streak — Heat map zilnic** — grid 20×4 cu cells aspect-ratio 1, colori random pe 5 trepte (de la `--bg-3` la `--neon`)
2. **05 / Diagnostic — Radar per disciplină** — radar SVG 5-axe cu 4 ringuri și un poligon `--neon` 20% fill cu dots la vârfuri
3. **06 / Mobil — PWA phone** — phone mockup 90×160px, notch, screen interior cu un "score row" verde "847" și placeholder rows

### 9. How It Works (`#how`)

H2 left-aligned: "Patru pași până la *prima ta admitere simulată.*"

Steps: grid 4 coloane în container `--bg-2` border radius 14 overflow hidden. Fiecare step padding 28 24, border-right `--line`.

Per step: progress bar orizontal 3px `--bg-3` cu `--neon` umplut la 25/50/75/100%, label "PAS 0X / 04" mono 10 `--neon` tracking 0.15, H4 19 600 -0.02em, paragraf 13 `--fg-dim` line 1.5.

| Pas | Titlu | Descriere |
|---|---|---|
| 01 | Cont gratuit | Email + parolă. 7 zile trial fără card cerut. |
| 02 | Practica țintit | Începe cu zonele unde ești slab. Feedback la fiecare grilă. |
| 03 | Simulare oficială | 200 grile, 3 ore. Identic cu examenul real. |
| 04 | Comparație admitere | Vezi instant la ce specialitate ai fi fost admis. |

### 10. Pricing (`#pricing`)

Heading centered: tag "▸ PREȚ CINSTIT", H2 56 "Mai ieftin decât *o carte de specialitate.*", sub 17 `--fg-dim` "7 zile gratuit. Anulezi instant."

Grid `1fr 1fr`, max-w 920, gap 1px (border `--line` între), radius 18, overflow hidden.

**Card Lunar:**
- `--bg-2` padding 36
- Name "LUNAR" mono 11 uppercase tracking 0.12 `--fg-dim`
- Amount: **49** mono 56px 600 tracking -0.04, sub "RON" 22 `--fg-dim`
- Period mono 13 `--fg-mute`: "pe lună · facturat lunar"
- Listă 5 features (cu check `--neon`)
- Buton outline full-width: "Începe lunar"

**Card Anual (featured):**
- Background: radial top + `--bg-2`
- Name "ANUAL" + pill mini "−33%" 9.5px 700 mono `--neon` background
- Amount: **33** RON
- Period: "pe lună · 396 RON anual · ~~588 RON~~"
- Listă 5 features:
  - Tot ce e în Lunar
  - 7 zile trial gratuit
  - Acces până după examen
  - Prioritate la features noi
  - Economisești 192 RON
- Buton primary full-width: **"Începe gratuit 7 zile"**
- Foot mono 11 `--fg-mute` centered: "card cerut doar la final de trial"

**Stripe integration:** folosește același Embedded Checkout deja configurat în `(student)/subscription`.

### 11. FAQ (`#faq`)

Heading centered: "▸ RĂSPUNSURI", H2 "Întrebări *pe bune.*"

Listă max-w 880 centered. Fiecare item: padding 22 0, border-bottom `--line`.

Question: 17 500 -0.015em flex space-between cu "+" mono `--neon` (poate fi accordion expandable — în prototip e static expanded).

Answer: margin-top 10, font 14 `--fg-dim` line 1.6 max-w 720.

| Q | A |
|---|---|
| De unde sunt grilele? | Validate manual din bibliografia oficială (Iliescu, Gafar, Mounier-Forrest, etc.) și actualizate cu fiecare ediție nouă. |
| Cum sunt calculate pragurile de admitere? | Pragurile oficiale publicate de MS pentru fiecare an din 2021 încoace, pentru fiecare specialitate și UMF. |
| E aceeași formulă de scoring ca la examenul real? | Da. CS: 4p corect, 0 greșit. CM: partial credit cu anulare la mai puțin de 2 sau mai mult de 4 selecții. Total max 950. |
| Pot să o folosesc pe telefon? | Da, e PWA — o instalezi din browser direct pe home screen. |
| Cât durează un trial? | 7 zile, acces complet, fără card cerut la început. |
| Cum anulez? | Un buton în pagina de Subscription. Anulezi instant. |

### 12. Final CTA

Padding 130 40, centered, position relative cu pseudo-element `::before` radial gradient `--neon` 8% în spate.

H2 88px 800 line 0.95 tracking -0.05:
> 187 zile.<br>
> Sau *primul tău scor real,* în 3 ore.

Sub 17 `--fg-dim`: "7 zile gratuit. Vezi în prima simulare unde te afli."

Row: primary btn-lg "Începe simularea →" + outline btn-lg "Vezi un rezultat exemplu" (link la o pagină demo cu rezultat hardcoded — sau modal).

### 13. Footer

Border-top `--line`, background `oklch(0.09 0.01 165)`.

4 coloane (1.5 1 1 1), padding 56 40 28, gap 48:

1. **Brand:** logo + "Platformă de pregătire pentru rezidențiatul în medicină dentară. Făcută în România, pentru studenții români." (13 `--fg-mute` line 1.55 max-w 280)
2. **Produs:** Features, Pricing, Cum funcționează, FAQ
3. **Cont:** Login, Signup, Trial gratuit
4. **Legal:** Termeni, Confidențialitate, Cookies, Contact

Bottom strip: border-top, padding 22 40, mono 11 `--fg-mute`, flex space-between:
- "© 2026 grile-ReziNOTE · Făcut în Cluj"
- "v1.0 · build 2026.10.21" (build dinamic)

---

## Animations

### Animația sondei (hero stage)

**Concept:** O sondă dentară (instrument real, cu mâner gravat) se mișcă de la stânga la dreapta de-a lungul unei axe orizontale. Pe măsură ce vârful trece, lasă în urmă o linie ECG verde (cu spike-uri ca un heartbeat). În colțul stânga-sus al cadrului apare procentul scanat ("00.0% → 100.0%"). Crosshair-uri în colțuri și contor "3.142 utilizatori" + "conf · 99.7" în dreapta-sus.

**Implementare:** SVG inline, animație în vanilla JS cu `requestAnimationFrame`. **Recomandare pentru port:**
- Component client `<HeroProbeAnimation />`
- Folosește `framer-motion` (probabil deja în stack pentru animații shadcn) sau păstrează RAF pur
- Durată: **4200ms** per ciclu, **800ms** pauză, apoi reia
- Pe `prefers-reduced-motion: reduce`, oprește animația și afișează frame-ul final (sondă la dreapta, ECG complet)

**Detalii path-uri SVG** — vezi sursă în `landing-final.html` linii ~440–530. Cele importante:

```js
// poziție probe pe X
const startX = 60, endX = 480, y = 178;
const x = startX + (endX - startX) * progress;
probe.transform = `translate(${x}, ${y})`;

// reveal ECG cu stroke-dashoffset
ecgPath.strokeDashoffset = totalLen * (1 - progress);

// counter
pctText = (progress * 100).toFixed(1).padStart(4, '0') + '%';
```

ECG path: începe orizontal, are 2 grupuri de spike-uri (la x=170-200 și x=255-300) plus 1 mic la final (x=360-380), apoi platou. Vezi `d=` din `#ecgPath`.

### Microanimații

- **Pulse dot eyebrow:** opacity 1 → 0.4 → 1 la 2s infinite
- **Hover butoane:** background lightens, transition 150ms
- **Hover nav links:** color `--fg-dim` → `--fg`, fără tranziție explicită (instant)
- **Scroll-reveal opțional:** dacă vrei, fade-up 200ms la fiecare secțiune când intră în viewport (`IntersectionObserver`). NU e în prototip — întreabă PM-ul dacă-l vrea.

---

## Interactions & Behavior

### Click handlers

| Element | Acțiune |
|---|---|
| Nav "Login" | `/login` |
| Nav "Începe gratuit" | `/signup?source=landing-nav` |
| Nav links (Admitere/Features/etc.) | smooth scroll la anchor (`scroll-behavior: smooth`) |
| Hero "Începe simularea →" | `/signup?source=landing-hero` |
| Hero "Vezi cum scorăm" | smooth scroll la `#how` |
| Pricing "Începe gratuit 7 zile" | `/signup?plan=annual&source=landing-pricing` |
| Pricing "Începe lunar" | `/signup?plan=monthly` |
| Final CTA primary | `/signup?source=landing-final` |
| Final CTA "Vezi un rezultat exemplu" | `/demo-result` (pagină statică nouă, rezultat hardcoded) sau modal |
| FAQ "+" | toggle accordion (opțional — în prototip statice) |

### Live data

Două bucăți care **idealmente sunt live** (server-rendered cu revalidate 60s):

1. **"1.247 utilizatori activi azi"** (countdown panel) — număr de useri unici cu sesiune în ultimele 24h
2. **Ticker:**
   - grile total (`select count(*) from questions where archived_at is null`)
   - simulări azi (`select count(*) from exam_attempts where started_at > now() - interval '1 day'`)
   - media percentilă
   - cel mai bun scor azi
   - ultima admitere (cea mai recentă simulare cu `score >= prag` pentru orice spec/UMF)

Dacă nu vrei DB hit pe pagină publică, hardcoded la valori realiste e OK pentru launch.

**"187 zile":** calculat la build/request time din data oficială a sesiunii (server). Update zilnic.

### Form / signup

Toate butoanele "Începe..." merg în signup-ul existent. Nu construi nimic nou. Poți pasa `source` ca query param pentru analytics atribuire.

---

## State Management

Landing-ul e **aproape integral static**, server-rendered.

**Componente client** (marcate `"use client"`):

1. `<HeroProbeAnimation />` — RAF loop, niciun state extern
2. `<PulseDot />` — CSS only, nu trebuie client component (CSS animation)
3. `<TickerLive />` — opțional, dacă vrei polling. Altfel, server component cu revalidate
4. `<FAQItem />` — DOAR dacă faci accordion. Altfel HTML static
5. Sticky nav — CSS pur, niciun JS

State-uri necesare:
- Animație sondă: progres local (0 → 1) în RAF
- (Opțional) Accordion FAQ: `openId | null`
- (Opțional) Mobile menu open/closed dacă reproiectezi nav-ul pe small screens

---

## Responsive Behavior

Prototipul e desktop-only la 1440px. Pentru implementare:

| Breakpoint | Notes |
|---|---|
| ≥ 1280px | Layout full ca în prototip |
| 1024–1279px | Container max-w 1024, păstrează grids 4×2 dashboard |
| 768–1023px | Killer section: stack vertical (text deasupra, vis dedesubt). UMF grid: 2 col. Feature rows: stack. Steps: 2×2. Mini bento: stack. |
| < 768px | Tot pe o coloană. Hero h1 56px. H2 36px. Final CTA h2 48px. Dashboard mock: scroll orizontal sau colapsat la "score + percentilă + chart" doar. Ticker: animat orizontal. Pricing: stack (Anual featured deasupra). |

**Critical mobile:** CTA-ul primar trebuie mereu vizibil (sticky bottom CTA pe mobile e OK). Animația sondei se pune mai mică (320×180) sau se înlocuiește cu un still frame dacă perf-ul e o problemă.

---

## Assets

- **Niciun asset binar** în acest design — totul e SVG inline + CSS.
- **Fonturi:** Inter și JetBrains Mono din Google Fonts. Recomand `next/font/google` pentru self-host la build.
- **Logo:** glyph "R" pe square `--neon`. Dacă există un logo oficial de brand, înlocuiește.

---

## Copy Notes

- **Tot textul e în română.** Nu traduce. Aplicația nu suportă multi-locale în v1.
- Folosește **diacritice corecte:** ă, î, â, ș, ț. Sunt deja corect în prototip.
- Ortografie cheie: "rezidențiat" (nu "rezidentiat"), "specialitate" (nu "specialiate"), "Hațieganu" (cu ț, nu cu ț minuscul), "Gr. T. Popa" (abreviere standard).
- **Numbers:** stil european — 1.247 (mie cu punct), 87.4 (zecimală cu punct **în acest design** pentru consistență mono — confirmă cu PM-ul, dar punct e OK în context de score/dashboard).
- **CSS** și **CM:** abrevieri pentru "complement simplu" (1 răspuns corect din 5) și "complement multiplu" (2-4 corecte din 5). Nu le explica în pagină — audiența le știe.

---

## Open Questions for PM

1. **Data sesiunii 2026** — pentru countdown. Hardcodat 187 zile în prototip.
2. **Live numbers** — vrem queries reale sau hardcoded la lansare?
3. **"Vezi un rezultat exemplu"** — pagină statică nouă sau modal?
4. **Logo definitiv** — acceptăm "R glyph" sau există o variantă brand-aprobată?
5. **Dual-mode (light)** pe landing? Recomandare design: nu — dark e identitatea; aplicația interioară poate fi light.
6. **Scroll-reveal animations** — adăugăm sau lăsăm static?
7. **Mobile-first refit** — alocăm separat o sesiune de design pentru mobile, sau extrapolezi din breakpoints-urile date?

---

## Implementation Checklist (sugestie pentru tine)

- [ ] Confirmă sau adaugă tokens-urile în `tailwind.config.ts` / `globals.css`
- [ ] Inter + JetBrains Mono via `next/font/google`
- [ ] Page la `app/(marketing)/page.tsx` — Server Component
- [ ] Sub-componente: `<Nav>`, `<Hero>` + `<HeroProbeAnimation>` (client), `<CountdownPanel>`, `<DashboardMock>`, `<Ticker>`, `<KillerAdmission>`, `<Quote>`, `<Features>`, `<HowItWorks>`, `<Pricing>`, `<FAQ>`, `<FinalCTA>`, `<Footer>`
- [ ] Smooth scroll global (`html { scroll-behavior: smooth }`) + `scroll-margin-top` pe section IDs ca să compenseze nav-ul sticky
- [ ] Metadata SEO (title, description, og:image)
- [ ] Reduced motion fallback pentru animația sondei
- [ ] Lighthouse pass — target 95+ desktop performance (totul static + 1 SVG animation)
- [ ] Responsive validare la 320 / 375 / 768 / 1024 / 1440 / 1920

Succes!
