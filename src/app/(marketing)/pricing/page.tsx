import { PricingCard } from "@/components/subscription/PricingCard"
import { STRIPE_CONFIG } from "@/lib/stripe/config"

const features = [
  "Acces la toate grilele",
  "Simulari de examen nelimitate",
  "Statistici detaliate per capitol",
  "Comparatie cu praguri de admitere",
  "Feedback imediat sau la final",
  "Revizuire intrebari gresite",
]

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Alege planul potrivit
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Acces complet la toate grilele si simularile de examen. Pregateste-te
          eficient pentru rezidentiat.
        </p>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <PricingCard
          name="Lunar"
          price="49"
          period="/luna"
          priceId={STRIPE_CONFIG.monthlyPriceId}
          features={features}
        />
        <PricingCard
          name="Anual"
          price="33"
          period="/luna, platit anual"
          priceId={STRIPE_CONFIG.annualPriceId}
          features={features}
          popular
          discount="4 luni gratuite"
          originalPrice="49"
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
              Dupa cele 7 zile de trial gratuit, vei avea nevoie de un
              abonament activ pentru a continua sa folosesti platforma. Alege
              planul lunar sau anual.
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
