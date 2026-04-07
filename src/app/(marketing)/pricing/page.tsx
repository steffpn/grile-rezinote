import { PricingCard } from "@/components/subscription/PricingCard"
import { STRIPE_CONFIG } from "@/lib/stripe/config"
import { stripe } from "@/lib/stripe/client"

const features = [
  "Acces la toate grilele",
  "Simulari de examen nelimitate",
  "Statistici detaliate per capitol",
  "Comparatie cu praguri de admitere",
  "Feedback imediat sau la final",
  "Revizuire intrebari gresite",
]

// Server component — prices are fetched from Stripe on the server, not hardcoded
// in the client bundle, so a tampered client cannot misrepresent pricing.
export const revalidate = 3600 // refresh hourly

async function fetchPrice(priceId: string) {
  try {
    const price = await stripe.prices.retrieve(priceId)
    if (!price.unit_amount) return null
    return {
      amount: Math.round(price.unit_amount / 100),
      currency: price.currency.toUpperCase(),
      interval: price.recurring?.interval ?? null,
    }
  } catch {
    return null
  }
}

export default async function PricingPage() {
  const [monthly, annual] = await Promise.all([
    fetchPrice(STRIPE_CONFIG.monthlyPriceId),
    fetchPrice(STRIPE_CONFIG.annualPriceId),
  ])

  // Annual price displayed as monthly equivalent
  const monthlyPrice = monthly?.amount?.toString() ?? "—"
  const annualMonthlyEquivalent = annual?.amount
    ? Math.round(annual.amount / 12).toString()
    : "—"

  return (
    <div className="mx-auto max-w-5xl px-4 pt-28 pb-16 sm:px-6 sm:pt-32 lg:px-8">
      <div className="text-center">
        <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          Alege planul potrivit
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Acces complet la toate grilele si simularile de examen. Pregateste-te
          eficient pentru rezidentiat.
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:mt-12 sm:gap-8 md:grid-cols-2">
        <PricingCard
          name="Lunar"
          price={monthlyPrice}
          period="/luna"
          priceId={STRIPE_CONFIG.monthlyPriceId}
          features={features}
        />
        <PricingCard
          name="Anual"
          price={annualMonthlyEquivalent}
          period="/luna, platit anual"
          priceId={STRIPE_CONFIG.annualPriceId}
          features={features}
          popular
          discount="4 luni gratuite"
          originalPrice={monthlyPrice}
        />
      </div>

      {/* FAQ Section */}
      <div className="mt-20">
        <h2 className="text-center text-2xl font-bold">Intrebari frecvente</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="font-semibold">
              Ce se intampla dupa perioada de trial?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Dupa perioada de trial gratuit, vei avea nevoie de un abonament
              activ pentru a continua sa folosesti platforma. Alege planul
              lunar sau anual.
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
              Pot schimba intre lunar si anual?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Da, poti schimba planul oricand din pagina de gestionare a
              abonamentului. Diferenta de pret se calculeaza automat.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Ce metode de plata acceptati?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Acceptam carduri Visa, Mastercard si alte metode prin Stripe.
              Platile sunt procesate securizat.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
