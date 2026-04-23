# Configurare Stripe pentru 3 tier-uri

Platforma foloseste 3 tier-uri de abonament: **FREE**, **PRO** și **PREMIUM**. FREE este gratuit și nu are Stripe price ID. PRO și PREMIUM au câte două prețuri fiecare (lunar + anual), deci trebuie să creezi **4 prețuri** în Stripe Dashboard.

## 1. Creează produsele în Stripe Dashboard

Mergi la [Stripe Dashboard → Products](https://dashboard.stripe.com/products) și creează **2 produse**:

### Produs 1: `grile-ReziNOTE PRO`
- **Name:** `grile-ReziNOTE PRO`
- **Description:** Acces nelimitat la grile, simulări, istoric și greșelile mele.
- Adaugă **2 prețuri** pentru acest produs:
  | Ciclu | Preț | Interval | Currency |
  |---|---|---|---|
  | Lunar | **119 RON** | monthly | RON |
  | Anual | **1142.40 RON** (echiv. 95.20 RON/lună, -20% față de lunar) | yearly | RON |

### Produs 2: `grile-ReziNOTE PREMIUM`
- **Name:** `grile-ReziNOTE PREMIUM`
- **Description:** Tot ce include PRO + analiză pe capitole/subcapitole, clasamente, modul Admitere și estimare șanse.
- Adaugă **2 prețuri** pentru acest produs:
  | Ciclu | Preț | Interval | Currency |
  |---|---|---|---|
  | Lunar | **179 RON** | monthly | RON |
  | Anual | **1718.40 RON** (echiv. 143.20 RON/lună, -20% față de lunar) | yearly | RON |

> **Notă despre 20% reducere anual:**
> Prețul anual = preț lunar × 12 × 0.80.
> - PRO: 119 × 12 × 0.80 = **1142.40 RON/an** (echivalent 95.20 RON/lună)
> - PREMIUM: 179 × 12 × 0.80 = **1718.40 RON/an** (echivalent 143.20 RON/lună)
>
> Dacă preferi valori rotunde, poți folosi **1140 RON/an** pentru PRO și **1716 RON/an** pentru PREMIUM — diferența e neglijabilă.

### Trial period (7 zile)

**NU trebuie să configurezi nimic în Stripe Dashboard pentru trial.** Trial-ul de 7 zile e aplicat automat de cod la crearea Checkout Session (`subscription_data.trial_period_days = 7`), controlat prin `STRIPE_CONFIG.trialDays` în [src/lib/stripe/config.ts](src/lib/stripe/config.ts).

Logică anti-abuz: trial-ul se acordă **doar utilizatorilor care nu l-au folosit deja** (verificat atât prin `users.trialStartedAt` cât și prin tabelul `trial_history` — hash al emailului supraviețuiește re-signup-ului).

Dacă vrei să schimbi durata trial-ului:
- Modifică `trialDays` în `src/lib/stripe/config.ts`
- Redeploy — niciun setup Stripe necesar

## 2. Copiază Price ID-urile

Pentru fiecare preț creat, copiază `price_...` ID-ul (îl găsești în header-ul prețului).

## 3. Setează variabilele de mediu

În `.env.local` (dev) și în panoul de environment variables al Railway (producție), adaugă:

```bash
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_ANNUAL_PRICE_ID=price_...
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_...
STRIPE_PREMIUM_ANNUAL_PRICE_ID=price_...
```

**IMPORTANT:** Vechiile `STRIPE_MONTHLY_PRICE_ID` și `STRIPE_ANNUAL_PRICE_ID` nu mai sunt folosite — poți să le ștergi sau le poți lăsa (nu produc efecte secundare).

## 4. Rulează migrația DB

Schema bazei de date primește o coloană nouă `plan_tier` în tabelul `subscriptions`. Rulează una dintre comenzile:

```bash
# Opțiunea A — push direct (recomandat pentru dev/stage)
npm run db:push

# Opțiunea B — generează migrație și aplică
npm run db:generate
npm run db:migrate
```

Fișierul de migrație SQL e deja pregătit la `src/lib/db/migrations/0001_add_plan_tier.sql` dacă vrei să-l aplici manual (e safe — nu modifică userii existenți).

## 5. Configurează webhook-ul Stripe

Nu e nevoie de modificări la webhook — se folosește același endpoint `/api/webhooks/stripe` ca înainte. Webhook-ul acum citește `price.id` din subscriptia Stripe și mapează automat la tier (PRO sau PREMIUM) prin helper-ul `resolveStripePriceId`.

Asigură-te că webhook-ul Stripe e configurat să trimită:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## 6. Test end-to-end

Cu Stripe în mod test:

1. **Test FREE** — mergi pe `/pricing`, apasă "Incepe gratuit" pe cardul FREE. Nu ar trebui să te redirecționeze la Stripe.
2. **Test PRO lunar** — apasă "Activează PRO" cu toggle-ul pe "Lunar". Ar trebui să fie redirecționat la Stripe Checkout cu prețul de 119 RON/lună și trial 7 zile.
3. **Test PRO anual** — schimbă toggle-ul pe "Anual". Prețul anual apare cu badge "-20% reducere" și prețul lunar tăiat.
4. **Test PREMIUM** — repetă pentru PREMIUM (179 RON/lună sau 143.20 RON/lună dacă anual).
5. **Test upgrade mid-sub** — după ce ai un abonament PRO activ, mergi la `/subscription` și apasă "Fă upgrade la PREMIUM". Ar trebui să se facă proratare automată.
6. **Test webhook** — folosește Stripe CLI `stripe trigger customer.subscription.updated` și verifică în DB că `plan_tier` s-a setat corect.

## 7. Mapping tier ↔ feature access (de referință)

| Feature | FREE | PRO | PREMIUM |
|---|:-:|:-:|:-:|
| Grile pe capitole | 20/zi | ✓ nelim. | ✓ nelim. |
| Simulări de examen | – | ✓ | ✓ |
| "Greșelile mele" | – | ✓ | ✓ |
| Dashboard progres general | – | ✓ | ✓ |
| Istoric teste / răspunsuri | – | ✓ | ✓ |
| Tendințe accuracy | – | ✓ | ✓ |
| Dashboard pe capitole | – | – | ✓ |
| Dashboard pe subcapitole | – | – | ✓ |
| Clasamente / percentile | – | – | ✓ |
| Modul Admitere | – | – | ✓ |
| Estimare șanse admitere | – | – | ✓ |

Trial-ul de 7 zile oferă acces PRO (nu PREMIUM), pentru ca PREMIUM să rămână un stimulent de upgrade.
