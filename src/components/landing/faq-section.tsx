import { getTierPricing } from "@/lib/stripe/tier-pricing"
import { resolveDisplayPrice } from "@/lib/subscription/pricing-model"
import { FaqSectionView, type Faq } from "./faq-section-view"

const REFERENCE_BOOKS_URL = "https://rezidentiat-medicina-dentara.ro/"

/**
 * Server component — pulls PRO/PREMIUM prices from the same live Stripe source
 * (`getTierPricing`) as the pricing pages, so the FAQ can never quote a stale
 * price. The interactive accordion lives in {@link FaqSectionView}.
 */
export async function FaqSection() {
  const tiers = await getTierPricing()
  const pro = tiers.find((t) => t.tier === "PRO")
  const premium = tiers.find((t) => t.tier === "PREMIUM")
  const proMonthly = pro ? resolveDisplayPrice(pro, "monthly") : "119"
  const premiumMonthly = premium
    ? resolveDisplayPrice(premium, "monthly")
    : "179"
  const annualDiscount = Math.round((pro?.annualDiscountPct ?? 0.2) * 100)

  const faqs: Faq[] = [
    {
      q: "Cat costa accesul la platforma?",
      a: (
        <>
          Ai 3 planuri:{" "}
          <strong>FREE</strong> (gratuit pentru totdeauna, 20 intrebari/zi),{" "}
          <strong>PRO la {proMonthly} RON/luna</strong> (grile nelimitate,
          simulari, greselile tale, dashboard de progres) si{" "}
          <strong>PREMIUM la {premiumMonthly} RON/luna</strong> (tot din PRO +
          analiza pe capitole si subcapitole, clasamente, modul Admitere cu
          estimarea sanselor). La plata anuala primesti {annualDiscount}%
          reducere. La primul abonament ai 7 zile de trial gratuit.
        </>
      ),
    },
    {
      q: "Care e diferenta intre FREE, PRO si PREMIUM?",
      a: (
        <>
          <strong>FREE</strong>: 20 de intrebari pe zi pe capitole, fara simulari
          si fara statistici. Bun pentru a te familiariza cu platforma.
          <br />
          <strong>PRO</strong>: grile nelimitate, simulari cu cronometru real,
          istoric complet, &bdquo;Greselile mele&rdquo; si dashboard cu progres
          general. Ideal pentru pregatirea serioasa.
          <br />
          <strong>PREMIUM</strong>: tot din PRO + analiza detaliata pe capitole
          si subcapitole, clasamente anonime intre utilizatori, modulul Admitere
          cu estimarea sanselor de admitere bazata pe scorurile tale. Pentru cei
          care vor un avantaj competitiv real.
        </>
      ),
    },
    {
      q: "Cum functioneaza trial-ul de 7 zile?",
      a: "La primul abonament PRO sau PREMIUM primesti automat 7 zile gratuite, fara obligatie. In aceste 7 zile ai acces la toate functiile PRO. Daca anulezi inainte de final, nu platesti nimic. Trial-ul se acorda o singura data pe cont.",
    },
    {
      q: "Grilele sunt actualizate dupa programa oficiala?",
      a: "Da. Banca de intrebari este revizuita constant de echipa noastra in pas cu programa oficiala de rezidentiat si cu schimbarile anuale ale Ministerului Sanatatii.",
    },
    {
      q: "Pot folosi platforma pe telefon?",
      a: "Da. Aplicatia este o PWA (Progressive Web App) si poate fi instalata direct pe iOS sau Android, cu o experienta fluenta, optimizata pentru mobil. Pentru a rezolva grile si a-ti sincroniza progresul ai nevoie de conexiune la internet.",
    },
    {
      q: "Cat de aproape sunt simularile de examenul real?",
      a: "Simularile respecta exact formatul oficial: numar de intrebari, timp alocat si sistemul de scoring. Vei intra in sala de examen stiind exact la ce sa te astepti.",
    },
    {
      q: "Pot sa imi compar progresul cu al colegilor?",
      a: "Da, cu planul PREMIUM. Vei vedea percentile anonime pentru fiecare simulare, pozitia ta in clasamentul general si distributia scorurilor, toate complet anonime. Participarea e opt-in.",
    },
    {
      q: "Unde gasesc cartile de referinta pentru intrebarile la care am gresit?",
      a: (
        <>
          Toate intrebarile au mentionata sursa (manualul si pagina) chiar in
          ecranul de feedback. Cand vrei sa aprofundezi un subiect sau sa
          comanzi cartea de referinta, le gasesti pe{" "}
          <a
            href={REFERENCE_BOOKS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-emerald-300 underline-offset-4 hover:underline"
          >
            Rezidentiat Medicina Dentara
          </a>
          , partenerul nostru pentru bibliografia oficiala.
        </>
      ),
    },
    {
      q: "Pot sa imi anulez abonamentul oricand?",
      a: "Sigur ca da. Anularea se face cu un click din contul tau si nu trebuie sa contactezi suportul. Iti pastrezi accesul pana la finalul perioadei platite.",
    },
    {
      q: "Cum imi protejati datele personale?",
      a: "Datele tale sunt stocate criptat si nu sunt impartasite cu terti. Suntem complet conformi GDPR si poti solicita oricand stergerea contului si a datelor asociate.",
    },
  ]

  return <FaqSectionView faqs={faqs} />
}
