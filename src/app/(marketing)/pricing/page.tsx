import { STRIPE_CONFIG } from "@/lib/stripe/config"
import { stripe } from "@/lib/stripe/client"
import { TIER_DISPLAY, type PlanTier } from "@/lib/subscription/tiers"
import {
  BillingCycleToggle,
  type PricingCardModel,
} from "@/components/subscription/BillingCycleToggle"
import { auth } from "@/lib/auth"

// Server component — prices are fetched from Stripe on the server, not hardcoded
// in the client bundle, so a tampered client cannot misrepresent pricing.
export const revalidate = 3600 // refresh hourly

async function fetchPrice(priceId: string | undefined) {
  if (!priceId || !process.env.STRIPE_SECRET_KEY) return null
  try {
    const price = await stripe.prices.retrieve(priceId)
    if (!price.unit_amount) return null
    return {
      amount: Math.round(price.unit_amount / 100),
      currency: price.currency.toUpperCase(),
      interval: price.recurring?.interval ?? null,
    }
  } catch (err) {
    console.error("[pricing] stripe.prices.retrieve failed:", err)
    return null
  }
}

export default async function PricingPage() {
  const [proMonthly, proAnnual, premiumMonthly, premiumAnnual, session] =
    await Promise.all([
      fetchPrice(STRIPE_CONFIG.proMonthlyPriceId),
      fetchPrice(STRIPE_CONFIG.proAnnualPriceId),
      fetchPrice(STRIPE_CONFIG.premiumMonthlyPriceId),
      fetchPrice(STRIPE_CONFIG.premiumAnnualPriceId),
      auth(),
    ])

  const isAuthenticated = Boolean(session?.user?.id)

  const tiers: PricingCardModel[] = (
    ["FREE", "PRO", "PREMIUM"] as PlanTier[]
  ).map((tier) => {
    const display = TIER_DISPLAY[tier]
    const live =
      tier === "PRO"
        ? { monthly: proMonthly, annual: proAnnual }
        : tier === "PREMIUM"
          ? { monthly: premiumMonthly, annual: premiumAnnual }
          : { monthly: null, annual: null }

    return {
      tier,
      tagline: display.tagline,
      features: display.features,
      cta: display.cta,
      popular: display.popular,
      fallbackMonthlyPrice: display.monthlyPrice,
      annualDiscountPct: display.annualDiscountPct,
      prices: {
        monthlyAmount: live.monthly?.amount ?? null,
        annualAmount: live.annual?.amount ?? null,
        annualMonthlyEquivalent: live.annual?.amount
          ? Math.round(live.annual.amount / 12)
          : null,
      },
    }
  })

  return (
    <div className="mx-auto max-w-6xl px-4 pt-28 pb-16 sm:px-6 sm:pt-32 lg:px-8">
      <div className="text-center">
        <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          Alege planul potrivit pentru tine
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Indiferent de nivelul tau actual, platforma iti ofera instrumentele
          necesare pentru a invata inteligent si a obtine un scor competitiv la
          Rezidentiat.
        </p>
      </div>

      <div className="mt-12 sm:mt-16">
        <BillingCycleToggle tiers={tiers} isAuthenticated={isAuthenticated} />
      </div>

      {/* Why choose us */}
      <div className="mt-20 rounded-2xl border border-border bg-card p-6 sm:p-10">
        <h2 className="text-center text-2xl font-bold">
          De ce sa alegi platforma?
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border/60 p-4">
            <p className="text-sm font-semibold">
              Grile create dupa modelul real de rezidentiat
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Banca de intrebari este aliniata la formatul oficial CS/CM.
            </p>
          </div>
          <div className="rounded-xl border border-border/60 p-4">
            <p className="text-sm font-semibold">
              Simulari identice cu examenul oficial
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              200 intrebari, 4 ore, scoring oficial romanesc cu anulare.
            </p>
          </div>
          <div className="rounded-xl border border-border/60 p-4">
            <p className="text-sm font-semibold">
              Analiza clara a progresului tau
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Urmareste acuratetea si evolutia in timp pe capitole si
              subcapitole.
            </p>
          </div>
          <div className="rounded-xl border border-border/60 p-4">
            <p className="text-sm font-semibold">
              Sistem inteligent de invatare din greseli
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Reia intrebarile la care ai gresit pana le stapanesti complet.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-16">
        <h2 className="text-center text-2xl font-bold">Intrebari frecvente</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="font-semibold">Cum functioneaza trial-ul?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Ai 7 zile de trial gratuit cu acces la functiile PRO. Dupa
              expirare, poti continua pe planul FREE (20 intrebari/zi) sau sa
              alegi PRO / PREMIUM.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Pot anula oricand?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Da, poti anula abonamentul oricand. Vei avea acces pana la
              sfarsitul perioadei de facturare curente.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">
              Ce diferente sunt intre PRO si PREMIUM?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              PRO iti da acces nelimitat la grile, simulari si istoric. PREMIUM
              adauga analiza pe capitole si subcapitole, clasamente, modulul
              Admitere si estimarea sanselor de admitere.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Pot trece de la PRO la PREMIUM?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Da, poti face upgrade oricand din pagina de gestionare a
              abonamentului. Diferenta de pret se calculeaza automat (proratare
              Stripe).
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Ce metode de plata acceptati?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Acceptam carduri Visa, Mastercard si alte metode prin Stripe.
              Platile sunt procesate securizat.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">
              Pot schimba intre lunar si anual?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Da, schimbi ciclul de facturare oricand din pagina de gestionare
              a abonamentului. Planul anual ofera 20% reducere.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
